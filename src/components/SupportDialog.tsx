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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatRelative } from "@/lib/relativeTime";
import { useTranslation } from "react-i18next";

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
  initialSubject?: string;
  initialConversationId?: string;
}

const SupportDialog = ({ open, onOpenChange, onMessagesRead, initialSubject, initialConversationId }: SupportDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
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
    if (open && initialSubject) {
      setNewSubject(initialSubject);
      setView("new");
    }
  }, [open, user, initialSubject]);

  useEffect(() => {
    if (!open || !initialConversationId) return;
    const conversation = conversations.find((item) => item.id === initialConversationId);
    if (conversation) { setSelectedConversation(conversation); setView("conversation"); }
  }, [open, initialConversationId, conversations]);

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
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
            // Mark admin messages as read when user views them
            if (newMsg.sender_type === "admin") {
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
      // Mark all admin messages as read when user views them
      const unreadAdminMessages = data.filter(
        (m) => m.sender_type === "admin" && !m.is_read
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
        title: t("support.messageSentTitle"),
        description: t("support.messageSentDesc"),
      });

      setNewSubject("");
      setNewContent("");
      setSelectedConversation(conversation);
      setView("conversation");
      fetchConversations();
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: t("support.errorTitle"),
        description: t("support.createFailed"),
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

      // Client replies reopen the ticket internally so the team sees it again
      if (selectedConversation.status !== "open") {
        await supabase
          .from("support_conversations")
          .update({ status: "open" })
          .eq("id", selectedConversation.id);
        setSelectedConversation({ ...selectedConversation, status: "open" });
      }


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
        title: t("support.errorTitle"),
        description: t("support.sendFailed"),
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
            <DialogTitle className="min-w-0 pr-6 text-base leading-snug break-words">
              {view === "list" && t("support.titleSupport")}
              {view === "new" && t("support.titleNewRequest")}
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
                  {t("support.newSupportRequest")}
                </Button>
              </div>
              <ScrollArea className="flex-1 px-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t("support.noConversations")}</p>
                    <p className="text-sm">{t("support.noConversationsHint")}</p>
                  </div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Button variant="ghost" onClick={() => openConversation(conv)} className="w-full block h-auto p-0 text-left whitespace-normal hover:bg-transparent">
                          <span className="font-medium text-sm break-words leading-snug">{conv.subject}</span>
                          <span className="block text-xs text-muted-foreground mt-1 font-normal">{t("support.updatedPrefix")} {formatRelative(conv.updated_at)}</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {view === "new" && (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("support.subjectLabel")}</label>
                <Textarea
                  placeholder={t("support.subjectPlaceholder")}
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  maxLength={100}
                  rows={2}
                  className="min-h-16 resize-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("support.messageLabel")}</label>
                <Textarea
                  placeholder={t("support.messagePlaceholder")}
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
                    {t("support.sending")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t("support.sendRequest")}
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
                          {formatRelative(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder={t("support.typeMessagePlaceholder")}
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupportDialog;
