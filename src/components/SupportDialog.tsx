import { useState, useEffect, useRef } from "react";
import { Send, Plus, ArrowLeft, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: "user" | "admin";
  is_read: boolean;
  created_at: string;
}

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessagesRead?: () => void;
}

const SupportDialog = ({ open, onOpenChange, onMessagesRead }: SupportDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "new" | "conversation">("list");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && user) {
      fetchConversations();
    }
  }, [open, user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`support-messages-${selectedConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "support_messages",
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          (payload) => {
            const newMsg = payload.new as Message & { sender_id?: string };
            setMessages((prev) => [...prev, newMsg]);
            // Mark admin messages as read only if we didn't send them ourselves
            if (newMsg.sender_type === "admin" && newMsg.sender_id !== user?.id) {
              markMessageAsRead(newMsg.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setConversations(data);
    }
    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
      // Mark all admin messages as read (only those not sent by current user)
      const unreadAdminMessages = data.filter(
        (m) => m.sender_type === "admin" && !m.is_read && m.sender_id !== user?.id
      );
      for (const msg of unreadAdminMessages) {
        markMessageAsRead(msg.id);
      }
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from("support_messages")
      .update({ is_read: true })
      .eq("id", messageId);
    
    // Notify parent to refresh unread count
    onMessagesRead?.();
  };

  const createConversation = async () => {
    if (!newSubject.trim() || !newContent.trim() || !user) return;

    setSending(true);
    try {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("support_conversations")
        .insert({
          user_id: user.id,
          subject: newSubject.trim(),
        })
        .select()
        .single();

      if (convError) throw convError;

      // Create first message
      const { error: msgError } = await supabase
        .from("support_messages")
        .insert({
          conversation_id: conversation.id,
          sender_type: "user",
          sender_id: user.id,
          content: newContent.trim(),
        });

      if (msgError) throw msgError;

      // Notify via edge function
      await supabase.functions.invoke("send-support-notification", {
        body: {
          conversationId: conversation.id,
          subject: newSubject.trim(),
          message: newContent.trim(),
          userId: user.id,
        },
      });

      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });

      setNewSubject("");
      setNewContent("");
      setSelectedConversation(conversation);
      setView("conversation");
      fetchConversations();
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again.",
        variant: "destructive",
      });
    }
    setSending(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from("support_messages").insert({
        conversation_id: selectedConversation.id,
        sender_type: "user",
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      // Notify via edge function
      await supabase.functions.invoke("send-support-notification", {
        body: {
          conversationId: selectedConversation.id,
          subject: `Re: ${selectedConversation.subject}`,
          message: newMessage.trim(),
          userId: user.id,
          isReply: true,
        },
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
    setSending(false);
  };

  const handleBack = () => {
    if (view === "conversation" || view === "new") {
      setView("list");
      setSelectedConversation(null);
      setMessages([]);
      fetchConversations();
    }
  };

  const openConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setView("conversation");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "resolved":
        return "bg-green-500";
      case "closed":
        return "bg-muted";
      default:
        return "bg-muted";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            {view !== "list" && (
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
              {view === "list" && "Support"}
              {view === "new" && "New Request"}
              {view === "conversation" && selectedConversation?.subject}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {view === "list" && (
            <div className="h-full flex flex-col">
              <div className="p-4">
                <Button
                  onClick={() => setView("new")}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Support Request
                </Button>
              </div>
              <ScrollArea className="flex-1 px-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No conversations yet</p>
                    <p className="text-sm">Start a new request to get help</p>
                  </div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => openConversation(conv)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium line-clamp-1">
                            {conv.subject}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`${getStatusColor(conv.status)} text-white text-xs`}
                          >
                            {conv.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated{" "}
                          {formatDistanceToNow(new Date(conv.updated_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {view === "new" && (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Brief description of your issue"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Describe your issue or question in detail..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  maxLength={2000}
                />
              </div>
              <Button
                onClick={createConversation}
                disabled={!newSubject.trim() || !newContent.trim() || sending}
                className="w-full"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          )}

          {view === "conversation" && selectedConversation && (
            <div className="h-full flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.sender_type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender_type === "user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatDistanceToNow(new Date(msg.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              {selectedConversation.status !== "closed" && selectedConversation.status !== "resolved" ? (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={sending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t text-center text-sm text-muted-foreground">
                  This conversation has been {selectedConversation.status}.
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupportDialog;
