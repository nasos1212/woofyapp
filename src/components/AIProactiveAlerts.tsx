import { useState, useEffect } from "react";
import { Bell, X, Syringe, Gift, Tag, Lightbulb, AlertTriangle, Calendar, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, isPast, isToday } from "date-fns";

interface ProactiveAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  priority: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

interface UpcomingReminder {
  id: string;
  type: "vaccination" | "birthday" | "alert";
  title: string;
  petName: string;
  dueDate: Date;
  daysUntil: number;
  status: "overdue" | "today" | "urgent" | "soon" | "upcoming";
  originalData?: any;
}

const alertIcons: Record<string, React.ReactNode> = {
  vaccination_due: <Syringe className="w-5 h-5" />,
  birthday_coming: <Gift className="w-5 h-5" />,
  offer_suggestion: <Tag className="w-5 h-5" />,
  health_tip: <Lightbulb className="w-5 h-5" />,
  vaccination: <Syringe className="w-5 h-5" />,
  birthday: <Gift className="w-5 h-5" />,
};

const statusConfig: Record<string, { label: string; className: string; bgClass: string }> = {
  overdue: { 
    label: "Overdue", 
    className: "bg-red-500 text-white",
    bgClass: "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
  },
  today: { 
    label: "Due Today", 
    className: "bg-orange-500 text-white",
    bgClass: "bg-gradient-to-r from-orange-50 to-amber-100 border-orange-200"
  },
  urgent: { 
    label: "Due Soon", 
    className: "bg-amber-500 text-white",
    bgClass: "bg-gradient-to-r from-amber-50 to-yellow-100 border-amber-200"
  },
  soon: { 
    label: "This Week", 
    className: "bg-blue-500 text-white",
    bgClass: "bg-gradient-to-r from-blue-50 to-sky-100 border-blue-200"
  },
  upcoming: { 
    label: "Coming Up", 
    className: "bg-slate-500 text-white",
    bgClass: "bg-gradient-to-r from-slate-50 to-gray-100 border-slate-200"
  },
};

export const AIProactiveAlerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [reminders, setReminders] = useState<UpcomingReminder[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default
  const [isHidden, setIsHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);

  const hideWidget = () => {
    sessionStorage.setItem('wooffy_reminders_hidden', 'true');
    setIsHidden(true);
  };

  // Fetch data when user is available
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setDataFetched(false);
      return;
    }

    // Check if this is a fresh login by comparing user IDs
    const previousUserId = sessionStorage.getItem('wooffy_current_user_id');
    const isNewLogin = previousUserId !== user.id;
    
    if (isNewLogin) {
      // Clear hidden state for new login
      sessionStorage.removeItem('wooffy_reminders_hidden');
      sessionStorage.removeItem('wooffy_alerts_generated');
      sessionStorage.setItem('wooffy_current_user_id', user.id);
      setIsHidden(false);
    } else {
      // Check hidden state from storage
      const hiddenState = sessionStorage.getItem('wooffy_reminders_hidden') === 'true';
      setIsHidden(hiddenState);
    }

    // Prevent duplicate fetches
    if (dataFetched) {
      setIsLoading(false);
      return;
    }
    
    // Fetch data
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchAlerts(), fetchHealthRecords()]);
      
      // Generate alerts once per session
      if (!sessionStorage.getItem('wooffy_alerts_generated')) {
        sessionStorage.setItem('wooffy_alerts_generated', 'true');
        await generateNewAlerts();
      }
      setIsLoading(false);
      setDataFetched(true);
    };
    
    fetchData();
  }, [user, dataFetched]);

  const fetchHealthRecords = async () => {
    if (!user) return;

    // Fetch pets first
    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) return;

    const { data: pets } = await supabase
      .from("pets")
      .select("id, pet_name, birthday")
      .eq("membership_id", membership.id);

    // Fetch health records with due dates
    const { data: healthRecords } = await supabase
      .from("pet_health_records")
      .select("*, pets!inner(pet_name)")
      .eq("owner_user_id", user.id)
      .not("next_due_date", "is", null)
      .order("next_due_date", { ascending: true });

    const now = new Date();
    const upcomingReminders: UpcomingReminder[] = [];

    // Process health records (vaccinations)
    if (healthRecords) {
      for (const record of healthRecords) {
        const dueDate = new Date(record.next_due_date);
        const daysUntil = differenceInDays(dueDate, now);

        // Include overdue (up to 30 days) and upcoming (up to 30 days)
        if (daysUntil >= -30 && daysUntil <= 30) {
          let status: UpcomingReminder["status"] = "upcoming";
          if (daysUntil < 0) status = "overdue";
          else if (isToday(dueDate)) status = "today";
          else if (daysUntil <= 3) status = "urgent";
          else if (daysUntil <= 7) status = "soon";

          upcomingReminders.push({
            id: record.id,
            type: "vaccination",
            title: record.title,
            petName: record.pets?.pet_name || "Pet",
            dueDate,
            daysUntil,
            status,
            originalData: record,
          });
        }
      }
    }

    // Process pet birthdays
    if (pets) {
      for (const pet of pets) {
        if (!pet.birthday) continue;

        const birthday = new Date(pet.birthday);
        const thisYearBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        if (thisYearBirthday < now) {
          thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
        }

        const daysUntil = differenceInDays(thisYearBirthday, now);

        if (daysUntil <= 14) {
          let status: UpcomingReminder["status"] = "upcoming";
          if (isToday(thisYearBirthday)) status = "today";
          else if (daysUntil <= 3) status = "urgent";
          else if (daysUntil <= 7) status = "soon";

          const age = thisYearBirthday.getFullYear() - birthday.getFullYear();
          upcomingReminders.push({
            id: pet.id,
            type: "birthday",
            title: `${pet.pet_name} turns ${age}!`,
            petName: pet.pet_name,
            dueDate: thisYearBirthday,
            daysUntil,
            status,
          });
        }
      }
    }

    // Sort by status priority and date
    const statusPriority = { overdue: 0, today: 1, urgent: 2, soon: 3, upcoming: 4 };
    upcomingReminders.sort((a, b) => {
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      return a.daysUntil - b.daysUntil;
    });

    // Deduplicate reminders by unique ID + type combination
    const uniqueReminders = upcomingReminders.filter((reminder, index, self) =>
      index === self.findIndex(r => r.id === reminder.id && r.type === reminder.type)
    );

    setReminders(uniqueReminders);
  };

  const fetchAlerts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("ai_proactive_alerts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_dismissed", false)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const sorted = data.sort((a, b) => 
        (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
        (priorityOrder[b.priority as keyof typeof priorityOrder] || 3)
      );
      setAlerts(sorted);
    }
  };

  const generateNewAlerts = async () => {
    if (!user || isGenerating) return;
    setIsGenerating(true);

    try {
      await supabase.functions.invoke("generate-ai-alerts", {
        body: { userId: user.id },
      });
      await fetchAlerts();
      await fetchHealthRecords();
    } catch (error) {
      console.debug("Error generating alerts:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const dismissAlert = async (alertId: string) => {
    await supabase
      .from("ai_proactive_alerts")
      .update({ is_dismissed: true })
      .eq("id", alertId);

    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const dismissAllAlerts = async () => {
    if (!user || alerts.length === 0) return;
    
    await supabase
      .from("ai_proactive_alerts")
      .update({ is_dismissed: true })
      .eq("user_id", user.id)
      .eq("is_dismissed", false);

    setAlerts([]);
  };

  const getDaysText = (daysUntil: number) => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`;
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Tomorrow";
    return `In ${daysUntil} days`;
  };

  const hasUrgentItems = reminders.some(r => r.status === "overdue" || r.status === "today" || r.status === "urgent");
  const overdueCount = reminders.filter(r => r.status === "overdue").length;
  const todayCount = reminders.filter(r => r.status === "today").length;

  // If hidden by user, show nothing
  if (isHidden) return null;
  
  // If still loading or no reminders, show nothing
  if (isLoading) return null;
  if (reminders.length === 0 && alerts.length === 0) return null;

  return (
    <Card className={cn(
      "mb-6 overflow-hidden transition-all duration-300",
      hasUrgentItems 
        ? "border-2 border-primary/50 shadow-lg shadow-primary/10" 
        : "border-2 border-cyan-200 shadow-md"
    )}>
      {/* Header */}
      <div 
        className={cn(
          "px-4 py-3 flex items-center justify-between cursor-pointer transition-colors",
          hasUrgentItems 
            ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" 
            : "bg-gradient-to-r from-cyan-50 via-teal-50 to-emerald-50"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full",
            hasUrgentItems ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-cyan-400 to-teal-500 text-white"
          )}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              Wooffy Reminders
              {(overdueCount > 0 || todayCount > 0) && (
                <Badge variant="destructive" className="text-xs">
                  {overdueCount > 0 && `${overdueCount} overdue`}
                  {overdueCount > 0 && todayCount > 0 && " · "}
                  {todayCount > 0 && `${todayCount} today`}
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {reminders.length} upcoming reminder{reminders.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(false);
              }}
            >
              Show More
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                hideWidget();
              }}
            >
              Hide
            </Button>
          )}
          <ChevronRight className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            !isCollapsed && "rotate-90"
          )} />
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <CardContent className="p-4 pt-2 space-y-3">
          {/* Reminders List */}
          {reminders.slice(0, 5).map((reminder) => (
            <div
              key={`${reminder.type}-${reminder.id}`}
              className={cn(
                "relative p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                statusConfig[reminder.status].bgClass
              )}
              onClick={() => navigate("/member/health-records")}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "shrink-0 p-2 rounded-full",
                  reminder.status === "overdue" ? "bg-red-500 text-white" :
                  reminder.status === "today" ? "bg-orange-500 text-white" :
                  reminder.status === "urgent" ? "bg-amber-500 text-white" :
                  "bg-white/80 text-foreground"
                )}>
                  {alertIcons[reminder.type] || <Calendar className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm truncate">{reminder.title}</p>
                    <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0", statusConfig[reminder.status].className)}>
                      {statusConfig[reminder.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{reminder.petName}</span>
                    <span>•</span>
                    <span className={cn(
                      reminder.status === "overdue" && "text-red-600 font-medium"
                    )}>
                      {getDaysText(reminder.daysUntil)}
                    </span>
                    <span>•</span>
                    <span>{format(reminder.dueDate, "MMM d")}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </div>
          ))}

          {/* View All Link */}
          {reminders.length > 5 && (
            <Button
              variant="ghost"
              className="w-full text-sm text-primary hover:text-primary/80"
              onClick={() => navigate("/member/health-records")}
            >
              View all {reminders.length} reminders
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {/* AI Alerts (offer suggestions, etc.) */}
          {alerts.filter(a => a.alert_type === "offer_suggestion").length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Suggestions for you</p>
              {alerts.filter(a => a.alert_type === "offer_suggestion").map((alert) => (
                <div
                  key={alert.id}
                  className="relative p-2 rounded-lg bg-muted/50 flex items-center gap-2"
                >
                  <Tag className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-sm flex-1">{alert.message}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AIProactiveAlerts;