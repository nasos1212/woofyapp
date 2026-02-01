import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircleQuestion, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import SupportDialog from "./SupportDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const SupportButton = () => {
  const { user } = useAuth();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const isMobile = useIsMobile();

  // Check if we're on a page with bottom navigation
  const hasBottomNav = isMobile && (
    location.pathname.startsWith("/business") ||
    location.pathname.startsWith("/shelter")
  );

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
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

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel("support-unread-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleEmailClick = () => {
    const email = "hello@wooffy.app";
    navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard!");
    window.location.href = `mailto:${email}`;
    setPopoverOpen(false);
  };

  const handleSupportMessageClick = () => {
    setPopoverOpen(false);
    setDialogOpen(true);
  };

  if (!user) return null;

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            className={`fixed right-4 z-50 h-14 w-14 rounded-full shadow-lg ${
              hasBottomNav ? "bottom-20" : "bottom-6"
            }`}
            size="icon"
            aria-label="Get support"
          >
            <div className="relative">
              <MessageCircleQuestion className="h-7 w-7" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-56 p-2 bg-background border border-border shadow-lg" 
          side="top" 
          align="end"
          sideOffset={8}
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground px-2 py-1.5">
              How would you like to contact us?
            </p>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              onClick={handleEmailClick}
            >
              <Mail className="h-5 w-5 text-primary" />
              <span>Send Email</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              onClick={handleSupportMessageClick}
            >
              <MessageSquare className="h-5 w-5 text-primary" />
              <div className="flex items-center gap-2">
                <span>Support Message</span>
                {unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <SupportDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};

export default SupportButton;
