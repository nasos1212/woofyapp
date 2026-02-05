import { useState, useEffect, useRef } from "react";
import { Send, Loader2, User, Clock, CheckCircle2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";

interface Conversation {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  content: string;
  sender_type: "user" | "admin";
  is_read: boolean;
  created_at: string;
}

const SupportManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConversations();

    // Subscribe to new conversations
    const channel = supabase
      .channel("admin-support-conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);

      // Focus the input field when a conversation is selected
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);

      // Subscribe to new messages
      const channel = supabase
        .channel(`admin-support-messages-${selectedConversation.id}`)
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
            // Mark user messages as read
            if (newMsg.sender_type === "user") {
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
    setLoading(true);
    let query = supabase
      .from("support_conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }

    const { data: convData, error } = await query;

    if (error) {
      console.error("Error fetching conversations:", error);
      setLoading(false);
      return;
    }

    // Fetch user details and unread counts
    const enrichedConversations = await Promise.all(
      (convData || []).map(async (conv) => {
        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("user_id", conv.user_id)
          .single();

        // Get unread count
        const { count } = await supabase
          .from("support_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("sender_type", "user")
          .eq("is_read", false);

        return {
          ...conv,
          user_name: profile?.full_name || "Unknown User",
          user_email: profile?.email || "",
          unread_count: count || 0,
        };
      })
    );

    setConversations(enrichedConversations);
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
      // Mark all user messages as read
      const unreadUserMessages = data.filter(
        (m) => m.sender_type === "user" && !m.is_read
      );
      for (const msg of unreadUserMessages) {
        markMessageAsRead(msg.id);
      }
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from("support_messages")
      .update({ is_read: true })
      .eq("id", messageId);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from("support_messages").insert({
        conversation_id: selectedConversation.id,
        sender_type: "admin",
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      // Update conversation status to pending if it was open
      if (selectedConversation.status === "open") {
        await updateConversationStatus("pending");
      }

      // Send notification email to the user
      try {
        await supabase.functions.invoke("send-support-notification", {
          body: {
            conversationId: selectedConversation.id,
            subject: selectedConversation.subject,
            message: newMessage.trim(),
            userId: selectedConversation.user_id,
            isReply: true,
            isAdminReply: true,
          },
        });
        console.log("Notification sent to user");
      } catch (notifyError) {
        console.error("Failed to send notification to user:", notifyError);
        // Don't fail the message send if notification fails
      }

      // Create in-app notification for the user
      await supabase.from("notifications").insert({
        user_id: selectedConversation.user_id,
        type: "support_reply",
        title: "New Support Reply",
        message: `You have a new reply to your support request: "${selectedConversation.subject}"`,
        data: { conversation_id: selectedConversation.id },
      });

      setNewMessage("");
      toast({
        title: "Reply sent",
        description: "Your reply has been sent and the user has been notified.",
      });
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

  const updateConversationStatus = async (status: string) => {
    if (!selectedConversation) return;

    const updateData: { status: string; resolved_at?: string | null } = { status };
    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    } else {
      updateData.resolved_at = null;
    }

    const { error } = await supabase
      .from("support_conversations")
      .update(updateData)
      .eq("id", selectedConversation.id);

    if (!error) {
      setSelectedConversation({ ...selectedConversation, status });
      fetchConversations();
      toast({
        title: "Status updated",
        description: `Conversation marked as ${status}`,
      });
    }
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "normal":
        return "bg-blue-500";
      case "low":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              Support Requests
              {totalUnread > 0 && (
                <Badge variant="destructive">{totalUnread}</Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex gap-2 mt-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">
                  <span className="flex items-center gap-2">
                    General Support
                  </span>
                </SelectItem>
                <SelectItem value="affiliate">
                  <span className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Affiliate Inquiries
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground px-4">
                <p>No support requests</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedConversation?.id === conv.id
                        ? "bg-accent border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium line-clamp-1 text-sm">
                        {conv.subject}
                      </span>
                      {(conv.unread_count || 0) > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {conv.category === "affiliate" && (
                        <Badge
                          variant="outline"
                          className="bg-purple-100 text-purple-700 border-purple-200 text-xs"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Affiliate
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(conv.status)} text-white text-xs`}
                      >
                        {conv.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`${getPriorityColor(conv.priority)} text-white text-xs`}
                      >
                        {conv.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {conv.user_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(conv.updated_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Conversation View */}
      <Card className="lg:col-span-2 flex flex-col">
        {selectedConversation ? (
          <>
            <CardHeader className="pb-2 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedConversation.subject}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.user_name} ({selectedConversation.user_email})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {format(new Date(selectedConversation.created_at), "PPp")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={selectedConversation.status}
                    onValueChange={updateConversationStatus}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_type === "admin" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.sender_type === "admin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div
                          className={`text-xs mt-1 flex items-center gap-1 ${
                            msg.sender_type === "admin"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {format(new Date(msg.created_at), "p")}
                          {msg.sender_type === "admin" && msg.is_read && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                        </div>
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
                      ref={inputRef}
                      placeholder="Type your response..."
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
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t text-center text-sm text-muted-foreground">
                  This conversation has been {selectedConversation.status}. Change status to reply.
                </div>
              )}
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">
              Select a conversation to view messages
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default SupportManager;
