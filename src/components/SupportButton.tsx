import { useState, useEffect, useRef } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupportDialog from "./SupportDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useBarkSound } from "@/hooks/useBarkSound";
const SupportButton = () => {
  const { user } = useAuth();
  const { playBark } = useBarkSound();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
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

    setUnreadCount(count || 0);
  };

  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel("support-unread-count")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
        },
        (payload) => {
          // Check if this is an admin message for the user
          if (payload.new && (payload.new as { sender_type: string }).sender_type === "admin") {
            fetchUnreadCount();
            // Play bark sound for new admin message
            playBark();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playBark]);

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
