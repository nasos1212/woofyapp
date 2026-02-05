import { useState, useMemo } from "react";
import { Dog, Trash2, Pencil, Check, X, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate as formatDateStandard } from "@/lib/utils";

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
}

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  pet_name: string | null;
  pet_breed: string | null;
}

interface ChatHistoryPanelProps {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  pets: Pet[];
  selectedPet: Pet | null;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateSessionTitle: (sessionId: string, newTitle: string) => Promise<void>;
  onStartNewChat: () => void;
  onClose: () => void;
}

const ChatHistoryPanel = ({
  chatSessions,
  currentSessionId,
  pets,
  selectedPet,
  onLoadSession,
  onDeleteSession,
  onUpdateSessionTitle,
  onStartNewChat,
  onClose,
}: ChatHistoryPanelProps) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [filterPet, setFilterPet] = useState<string | "all">("all");

  // Group sessions by pet for display
  const groupedSessions = useMemo(() => {
    if (filterPet === "all") {
      // Group by pet name
      const groups: Record<string, ChatSession[]> = { "Other": [] };
      
      pets.forEach(pet => {
        groups[pet.pet_name] = [];
      });
      
      chatSessions.forEach(session => {
        const petName = session.pet_name;
        if (petName && groups[petName]) {
          groups[petName].push(session);
        } else if (petName) {
          if (!groups[petName]) groups[petName] = [];
          groups[petName].push(session);
        } else {
          groups["Other"].push(session);
        }
      });
      
      // Remove empty groups
      Object.keys(groups).forEach(key => {
        if (groups[key].length === 0) delete groups[key];
      });
      
      return groups;
    } else {
      // Filter to specific pet
      const filtered = chatSessions.filter(s => s.pet_name === filterPet);
      return { [filterPet]: filtered };
    }
  }, [chatSessions, pets, filterPet]);

  const startEditingTitle = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title || "");
  };

  const saveSessionTitle = async (sessionId: string) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    
    await onUpdateSessionTitle(sessionId, editingTitle.trim());
    setEditingSessionId(null);
    toast.success("Title updated");
  };

  const cancelEditingTitle = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  const handleLoadSession = (sessionId: string) => {
    if (editingSessionId !== sessionId) {
      onLoadSession(sessionId);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return formatDateStandard(date);
  };

  const totalSessions = chatSessions.length;

  return (
    <div className="mb-4 bg-white rounded-xl shadow-soft border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat History
            <span className="text-xs text-muted-foreground font-normal">
              ({totalSessions} conversation{totalSessions !== 1 ? "s" : ""})
            </span>
          </h3>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              onStartNewChat();
              onClose();
            }}
            className="h-8"
          >
            <Plus className="w-3 h-3 mr-1" />
            New Chat
          </Button>
        </div>
        
        {/* Pet filter tabs */}
        {pets.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterPet("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterPet === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All Pets
            </button>
            {pets.map((pet) => {
              const count = chatSessions.filter(s => s.pet_name === pet.pet_name).length;
              return (
                <button
                  key={pet.id}
                  onClick={() => setFilterPet(pet.pet_name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                    filterPet === pet.pet_name
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Dog className="w-3 h-3" />
                  {pet.pet_name}
                  {count > 0 && (
                    <span className={`text-[10px] ${filterPet === pet.pet_name ? "opacity-80" : "opacity-60"}`}>
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sessions list */}
      <div className="max-h-80 overflow-y-auto p-3">
        {Object.keys(groupedSessions).length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {filterPet !== "all" 
                ? `No conversations about ${filterPet} yet`
                : "No previous conversations"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onStartNewChat();
                onClose();
              }}
              className="mt-3"
            >
              Start your first chat
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSessions).map(([petName, sessions]) => (
              <div key={petName}>
                {/* Pet group header - only show in "all" view */}
                {filterPet === "all" && pets.length > 1 && (
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Dog className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      {petName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({sessions.length})
                    </span>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                        currentSessionId === session.id 
                          ? "bg-primary/10 border border-primary/20" 
                          : "hover:bg-muted/50 border border-transparent"
                      }`}
                    >
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleLoadSession(session.id)}
                      >
                        {editingSessionId === session.id ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="flex-1 text-sm px-2 py-1 border rounded bg-background"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveSessionTitle(session.id);
                                if (e.key === "Escape") cancelEditingTitle();
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveSessionTitle(session.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Check className="w-3 h-3 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditingTitle}
                              className="h-7 w-7 p-0"
                            >
                              <X className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium truncate pr-2">
                              {session.title || "Untitled conversation"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(session.updated_at)}
                              </span>
                              {session.pet_breed && filterPet === "all" && (
                                <span className="text-xs text-muted-foreground">
                                  • {session.pet_breed}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {editingSessionId !== session.id && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingTitle(session);
                            }}
                            className="h-7 w-7 p-0 hover:bg-muted"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            className="h-7 w-7 p-0 hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryPanel;
