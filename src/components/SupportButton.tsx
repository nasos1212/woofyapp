import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircleQuestion, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupportDialog from "./SupportDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const POSITION_KEY = "support-widget-position";
const DRAG_THRESHOLD = 6;
const EDGE_MARGIN = 8;

type WidgetPosition = { x: number; y: number };

const clampPosition = (x: number, y: number, w: number, h: number): WidgetPosition => {
  const maxX = window.innerWidth - w - EDGE_MARGIN;
  const maxY = window.innerHeight - h - EDGE_MARGIN;
  return {
    x: Math.min(Math.max(EDGE_MARGIN, x), Math.max(EDGE_MARGIN, maxX)),
    y: Math.min(Math.max(EDGE_MARGIN, y), Math.max(EDGE_MARGIN, maxY)),
  };
};

const SupportButton = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem("support-widget-minimized") === "true";
  });
  const [position, setPosition] = useState<WidgetPosition | null>(() => {
    try {
      const raw = localStorage.getItem(POSITION_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (
        parsed &&
        typeof parsed.x === "number" &&
        typeof parsed.y === "number" &&
        parsed.x >= 0 &&
        parsed.y >= 0
      ) {
        return parsed as WidgetPosition;
      }
    } catch {
      // ignore malformed stored position
    }
    return null;
  });

  const containerRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    moved: false,
  });
  const movedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    // Get all user's conversations
    const { data: conversations } = await supabase
      .from("support_conversations")
      .select("id")
      .eq("user_id", user.id);

    if (!conversations || conversations.length === 0) {
      setUnreadCount(0);
      return;
    }

    const conversationIds = conversations.map((c) => c.id);

    // Count unread admin messages
    const { count } = await supabase
      .from("support_messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .eq("sender_type", "admin")
      .eq("is_read", false);

    console.log("[SupportButton] Unread admin messages:", count);
    setUnreadCount(count || 0);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    // Get user's conversation IDs first, then subscribe
    const setupSubscription = async () => {
      const { data: conversations } = await supabase
        .from("support_conversations")
        .select("id")
        .eq("user_id", user.id);
      
      const userConversationIds = conversations?.map(c => c.id) || [];
      
      // Subscribe to new messages and updates
      const channel = supabase
        .channel("support-unread-count")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "support_messages",
          },
          (payload) => {
            const message = payload.new as { sender_type: string; conversation_id: string } | null;
            
            // Only process if this message is for one of the user's conversations
            if (message && userConversationIds.includes(message.conversation_id)) {
              console.log("[SupportButton] Realtime event for user's conversation:", payload.eventType, message);
              
              // Check if this is an admin message INSERT
              if (payload.eventType === "INSERT" && message.sender_type === "admin") {
                fetchUnreadCount();
              }
              // Also refresh on UPDATE (when messages are marked as read)
              if (payload.eventType === "UPDATE") {
                fetchUnreadCount();
              }
            }
          }
        )
        .subscribe();
      
      return channel;
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;
    setupSubscription().then(ch => { channel = ch; });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, fetchUnreadCount]);

  // Keep a dragged position on screen when the window is resized or rotated
  useEffect(() => {
    const onResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const el = containerRef.current;
        const w = el?.offsetWidth ?? 56;
        const h = el?.offsetHeight ?? 56;
        return clampPosition(prev.x, prev.y, w, h);
      });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  // Remove window listeners if the widget unmounts mid-drag
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Left mouse button, touch or pen only
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      moved: false,
    };
    movedRef.current = false;

    const onMove = (ev: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag.active) return;
      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      movedRef.current = true;
      const el = containerRef.current;
      const w = el?.offsetWidth ?? 56;
      const h = el?.offsetHeight ?? 56;
      setPosition(clampPosition(drag.origX + dx, drag.origY + dy, w, h));
    };

    const onEnd = () => {
      const drag = dragStateRef.current;
      drag.active = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);

      if (drag.moved) {
        // Final clamped position based on where the widget actually ended up
        const el = containerRef.current;
        const rect = el?.getBoundingClientRect();
        const w = el?.offsetWidth ?? 56;
        const h = el?.offsetHeight ?? 56;
        const finalPos = clampPosition(
          rect ? rect.left : position?.x ?? 0,
          rect ? rect.top : position?.y ?? 0,
          w,
          h
        );
        setPosition(finalPos);
        try {
          localStorage.setItem(POSITION_KEY, JSON.stringify(finalPos));
        } catch {
          // storage may be unavailable
        }
      }
      // Reset after the click event has had a chance to read the flag
      window.setTimeout(() => {
        movedRef.current = false;
      }, 0);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    cleanupRef.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  };

  const handleMinimize = (e: React.MouseEvent) => {
    if (movedRef.current) return; // it was a drag, not a tap
    e.stopPropagation();
    setIsMinimized(true);
    localStorage.setItem("support-widget-minimized", "true");
  };

  const handleExpand = () => {
    if (movedRef.current) return; // it was a drag, not a tap
    setIsMinimized(false);
    localStorage.setItem("support-widget-minimized", "false");
  };

  const handleOpen = () => {
    if (movedRef.current) return; // it was a drag, not a tap
    setOpen(true);
  };

  if (!user) return null;

  const positionStyle = position
    ? { left: `${position.x}px`, top: `${position.y}px`, right: "auto", bottom: "auto" }
    : undefined;
  const dragProps = {
    onPointerDown: handlePointerDown,
    style: positionStyle,
  };

  // Minimized state - small dot that can be expanded (and dragged)
  if (isMinimized) {
    return (
      <button
        ref={containerRef as unknown as React.Ref<HTMLButtonElement>}
        onClick={handleExpand}
        onPointerDown={handlePointerDown}
        style={positionStyle}
        className="fixed bottom-[5.5rem] md:bottom-6 right-4 z-50 h-8 w-8 rounded-full bg-primary shadow-lg flex items-center justify-center hover:scale-110 transition-transform cursor-grab active:cursor-grabbing select-none touch-none"
        aria-label={t("supportButton.expandAria")}
      >
        {unreadCount > 0 ? (
          <span className="text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : (
          <MessageCircleQuestion className="h-4 w-4 text-primary-foreground pointer-events-none" />
        )}
      </button>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        {...dragProps}
        className="fixed bottom-[5.5rem] md:bottom-6 right-4 z-50 flex items-center gap-1 cursor-grab active:cursor-grabbing select-none touch-none"
      >
        <Button
          onClick={handleMinimize}
          className="h-8 w-8 rounded-full shadow-lg opacity-80 hover:opacity-100"
          size="icon"
          variant="secondary"
          aria-label={t("supportButton.minimizeAria")}
        >
          <Minus className="h-4 w-4 pointer-events-none" />
        </Button>
        <Button
          onClick={handleOpen}
          className="h-14 w-14 rounded-full shadow-lg"
          size="icon"
          aria-label={t("supportButton.getSupportAria")}
        >
          <MessageCircleQuestion className="h-7 w-7 pointer-events-none" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground z-10 pointer-events-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </div>
      <SupportDialog 
        open={open} 
        onOpenChange={setOpen} 
        onMessagesRead={fetchUnreadCount}
      />
    </>
  );
};

export default SupportButton;
