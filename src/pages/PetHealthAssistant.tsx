import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, History, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
  birthday: string | null;
  notes: string | null;
}

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface UserContext {
  userProfile: any;
  membership: any;
  pets: Pet[];
  selectedPet: { name: string; breed: string | null } | null;
  healthRecords: any[];
  redemptions: any[];
  favoriteOffers: any[];
  recentActivity: any[];
  communityQuestions: any[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pet-health-assistant`;

const suggestedQuestions = [
  "What vaccines does my dog need?",
  "How often should I groom my pet?",
  "My dog is scratching a lot, what could it be?",
  "What human foods are toxic to dogs?",
  "How much exercise does my breed need?",
  "What offers would be good for my pet?",
  "When is my pet's next vaccination due?",
];

const PetHealthAssistant = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { trackAIChat, trackFeatureUse } = useActivityTracking();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=member");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFullUserContext();
      fetchChatSessions();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track if we need to save the last message after streaming completes
  const pendingSaveRef = useRef<{ role: string; content: string } | null>(null);

  const fetchChatSessions = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("ai_chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (data) {
      setChatSessions(data);
    }
  };

  const createNewSession = async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("ai_chat_sessions")
      .insert({
        user_id: user.id,
        title: "New conversation",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return null;
    }

    setChatSessions(prev => [data, ...prev]);
    setCurrentSessionId(data.id);
    setMessages([]);
    trackFeatureUse("ai_new_chat");
    return data.id;
  };

  const loadSession = async (sessionId: string) => {
    const { data } = await supabase
      .from("ai_chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data as Message[]);
      setCurrentSessionId(sessionId);
      setShowHistory(false);
      trackFeatureUse("ai_load_history", { session_id: sessionId });
    }
  };

  const saveMessageToSession = async (sessionId: string, role: string, content: string, isFirstMessage: boolean) => {
    if (!sessionId || !content) return;

    await supabase
      .from("ai_chat_messages")
      .insert({
        session_id: sessionId,
        role,
        content,
      });

    // Update session title based on first user message
    if (isFirstMessage && role === "user") {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      await supabase
        .from("ai_chat_sessions")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      setChatSessions(prev => 
        prev.map(s => s.id === sessionId ? { ...s, title } : s)
      );
    }
  };

  const deleteSession = async (sessionId: string) => {
    await supabase
      .from("ai_chat_sessions")
      .delete()
      .eq("id", sessionId);

    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setMessages([]);
    }
    
    toast.success("Conversation deleted");
  };

  const fetchFullUserContext = async () => {
    if (!user) return;

    try {
      // Fetch all data in parallel for efficiency
      const [
        profileResult,
        membershipResult,
        activityResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("memberships")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_activity_tracking")
          .select("activity_type, activity_data, page_path")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const userProfile = profileResult.data;
      const membership = membershipResult.data;
      const recentActivity = activityResult.data || [];

      // Fetch relevant community questions
      const { data: communityData } = await supabase
        .from("community_questions")
        .select(`
          id,
          title,
          content,
          urgency,
          breed_tags,
          helped_count,
          category:community_categories(name),
          answers:community_answers(content, is_verified_pro, upvotes)
        `)
        .eq("status", "open")
        .order("helped_count", { ascending: false })
        .limit(10);

      // Process community questions for AI context
      const communityQuestions = (communityData || []).map((q: any) => ({
        title: q.title,
        urgency: q.urgency,
        breed_tags: q.breed_tags,
        helped_count: q.helped_count,
        category_name: q.category?.name,
        answer_count: q.answers?.length || 0,
        has_verified_answer: q.answers?.some((a: any) => a.is_verified_pro) || false,
        top_answer: q.answers?.sort((a: any, b: any) => (b.upvotes || 0) - (a.upvotes || 0))[0]?.content || null,
      }));

      if (!membership) {
        setUserContext({
          userProfile,
          membership: null,
          pets: [],
          selectedPet: null,
          healthRecords: [],
          redemptions: [],
          favoriteOffers: [],
          recentActivity,
          communityQuestions,
        });
        return;
      }

      // Fetch pets, health records, redemptions, and favorites in parallel
      const [
        petsResult,
        redemptionsResult,
        favoritesResult,
      ] = await Promise.all([
        supabase
          .from("pets")
          .select("id, pet_name, pet_breed, birthday, notes")
          .eq("membership_id", membership.id),
        supabase
          .from("offer_redemptions")
          .select(`
            id,
            redeemed_at,
            offers (id, title, description),
            businesses:business_id (id, business_name, category)
          `)
          .eq("membership_id", membership.id)
          .order("redeemed_at", { ascending: false })
          .limit(20),
        supabase
          .from("favorite_offers")
          .select(`
            id,
            offers (
              id,
              title,
              description,
              businesses:business_id (id, business_name, category)
            )
          `)
          .eq("user_id", user.id)
          .limit(10),
      ]);

      const petsData = petsResult.data || [];
      setPets(petsData);

      // Set first pet as selected if available
      if (petsData.length > 0) {
        setSelectedPet(petsData[0]);
      }

      // Fetch health records for all pets
      let healthRecords: any[] = [];
      if (petsData.length > 0) {
        const petIds = petsData.map(p => p.id);
        const healthResult = await supabase
          .from("pet_health_records")
          .select("*")
          .in("pet_id", petIds)
          .order("date_administered", { ascending: false })
          .limit(30);
        healthRecords = healthResult.data || [];
      }

      // Fetch relevant community questions based on user's pet breeds
      const breedTags = petsData.map(p => p.pet_breed).filter(Boolean);
      let relevantCommunityQuestions: any[] = [];
      
      if (breedTags.length > 0) {
        const { data: breedCommunity } = await supabase
          .from("community_questions")
          .select(`
            id,
            title,
            content,
            urgency,
            breed_tags,
            helped_count,
            category:community_categories(name),
            answers:community_answers(content, is_verified_pro, upvotes)
          `)
          .eq("status", "open")
          .overlaps("breed_tags", breedTags)
          .order("helped_count", { ascending: false })
          .limit(10);

        relevantCommunityQuestions = (breedCommunity || []).map((q: any) => ({
          title: q.title,
          urgency: q.urgency,
          breed_tags: q.breed_tags,
          helped_count: q.helped_count,
          category_name: q.category?.name,
          answer_count: q.answers?.length || 0,
          has_verified_answer: q.answers?.some((a: any) => a.is_verified_pro) || false,
          top_answer: q.answers?.sort((a: any, b: any) => (b.upvotes || 0) - (a.upvotes || 0))[0]?.content || null,
        }));
      }

      // If no breed-specific questions, get general popular ones
      if (relevantCommunityQuestions.length < 5) {
        const { data: generalCommunity } = await supabase
          .from("community_questions")
          .select(`
            id,
            title,
            content,
            urgency,
            breed_tags,
            helped_count,
            category:community_categories(name),
            answers:community_answers(content, is_verified_pro, upvotes)
          `)
          .eq("status", "open")
          .order("helped_count", { ascending: false })
          .limit(10 - relevantCommunityQuestions.length);

        const generalQuestions = (generalCommunity || []).map((q: any) => ({
          title: q.title,
          urgency: q.urgency,
          breed_tags: q.breed_tags,
          helped_count: q.helped_count,
          category_name: q.category?.name,
          answer_count: q.answers?.length || 0,
          has_verified_answer: q.answers?.some((a: any) => a.is_verified_pro) || false,
          top_answer: q.answers?.sort((a: any, b: any) => (b.upvotes || 0) - (a.upvotes || 0))[0]?.content || null,
        }));

        relevantCommunityQuestions = [...relevantCommunityQuestions, ...generalQuestions];
      }

      setUserContext({
        userProfile,
        membership,
        pets: petsData,
        selectedPet: petsData[0] ? { name: petsData[0].pet_name, breed: petsData[0].pet_breed } : null,
        healthRecords,
        redemptions: redemptionsResult.data || [],
        favoriteOffers: favoritesResult.data || [],
        recentActivity,
        communityQuestions: relevantCommunityQuestions,
      });
    } catch (error) {
      console.error("Error fetching user context:", error);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Ensure we have a session
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) {
        toast.error("Failed to create chat session");
        return;
      }
    }

    const userMessage: Message = { role: "user", content: messageText.trim() };
    const isFirstMessage = messages.length === 0;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Save user message immediately
    await saveMessageToSession(sessionId, "user", userMessage.content, isFirstMessage);

    // Track AI chat usage
    trackAIChat(messages.length + 1, selectedPet?.pet_name);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      // Build context with selected pet info and activity
      const contextToSend = userContext ? {
        ...userContext,
        selectedPet: selectedPet ? { name: selectedPet.pet_name, breed: selectedPet.pet_breed } : null,
      } : null;

      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userContext: contextToSend,
          petInfo: selectedPet ? { name: selectedPet.pet_name, breed: selectedPet.pet_breed } : null,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      // Save the complete assistant response after streaming finishes
      if (assistantContent) {
        await saveMessageToSession(sessionId, "assistant", assistantContent, false);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = "I'm sorry, I encountered an error. Please try again in a moment. 🐾";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
      await saveMessageToSession(sessionId, "assistant", errorMessage, false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const startNewChat = async () => {
    await createNewSession();
    setShowHistory(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>AI Pet Health Assistant | Wooffy</title>
        <meta name="description" content="Get instant pet health advice from our AI-powered assistant." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-wooffy-soft to-background flex flex-col">
        <Header />

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-6 pt-24 flex flex-col max-w-3xl">
          {/* Title & Pet Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-foreground">
                    Wooffy Health Assistant
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about your pet's health! 🐾
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History className="w-4 h-4 mr-1" />
                  History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNewChat}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </div>
            </div>

            {pets.length > 1 && (
              <div className="flex gap-2 mt-4">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPet(pet)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedPet?.id === pet.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {pet.pet_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat History Panel */}
          {showHistory && (
            <div className="mb-4 bg-white rounded-xl shadow-soft border border-border/50 p-4 max-h-64 overflow-y-auto">
              <h3 className="font-semibold text-sm mb-3">Previous Conversations</h3>
              {chatSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No previous conversations</p>
              ) : (
                <div className="space-y-2">
                  {chatSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                        currentSessionId === session.id ? "bg-muted" : ""
                      }`}
                    >
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => loadSession(session.id)}
                      >
                        <p className="text-sm font-medium truncate">{session.title || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 bg-white rounded-2xl shadow-soft border border-border/50 p-4 mb-4 overflow-y-auto max-h-[50vh] min-h-[300px]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  How can I help today?
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Ask me about pet health, nutrition, behavior, or any concerns you have about your furry friend.
                </p>

                {/* Suggested Questions */}
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedQuestions.slice(0, 3).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="px-3 py-2 bg-muted text-sm rounded-lg hover:bg-muted/80 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted p-3 rounded-2xl rounded-bl-md">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Wooffy is an AI assistant and cannot replace professional veterinary care. 
              For emergencies, please contact your vet immediately.
            </p>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your pet's health..."
              className="resize-none min-h-[50px] max-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-auto"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </main>
      </div>
    </>
  );
};

export default PetHealthAssistant;