import { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupportDialog from "./SupportDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const SupportButton = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Reset count when dialog opens
  useEffect(() => {
    if (open) {
      // Count will be updated when messages are marked as read in the dialog
    }
  }, [open]);

  if (!user) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        aria-label="Get support"
      >
        <div className="relative">
          <HelpCircle className="h-10 w-10" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </Button>
      <SupportDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default SupportButton;
