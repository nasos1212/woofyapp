import { useState, useEffect, useCallback } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupportDialog from "./SupportDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const SupportButton = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  if (!user) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        aria-label="Get support"
      >
        <MessageCircleQuestion className="h-7 w-7" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground z-10">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
      <SupportDialog 
        open={open} 
        onOpenChange={setOpen} 
        onMessagesRead={fetchUnreadCount}
      />
    </>
  );
};

export default SupportButton;
