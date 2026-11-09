import { useState, useEffect } from "react";
import { Bell, X, Syringe, Gift, Tag, Lightbulb, Calendar, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { differenceInDays } from "date-fns";
import { formatDate } from "@/lib/utils";
import { toZonedTime } from "date-fns-tz";
import { createReminderPreview } from "@/lib/reminderPreview";

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

const statusStyles: Record<UpcomingReminder["status"], string> = {
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  today: "bg-primary/10 text-primary border-primary/20",
  urgent: "bg-status-pending/15 text-foreground border-status-pending/30",
  soon: "bg-primary/10 text-primary border-primary/20",
  upcoming: "bg-primary/5 text-primary border-primary/15",
};

export const AIProactiveAlerts = ({ previewPet }: { previewPet?: { id: string; pet_name: string } } = {}) => {
  const isPreview = import.meta.env.DEV && previewPet !== undefined;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [reminders, setReminders] = useState<UpcomingReminder[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(!isPreview); // Preview starts expanded
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);

  // Listen for auth state changes - clear session data on logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Clear all wooffy session data on logout
        sessionStorage.removeItem('wooffy_reminders_hidden');
        sessionStorage.removeItem('wooffy_alerts_generated');
        sessionStorage.removeItem('wooffy_current_user_id');
        setDataFetched(false);
        setReminders([]);
        setAlerts([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when user is available
  useEffect(() => {
    if (isPreview && previewPet) {
      setReminders(createReminderPreview(previewPet.id).map(sample => ({
        id: sample.id,
        type: "vaccination",
        title: sample.title,
        petName: previewPet.pet_name,
        dueDate: new Date(`${sample.next_due_date}T12:00:00`),
        daysUntil: sample.daysUntil,
        status: sample.status === "due-today" ? "today" : sample.status === "due-soon" ? "urgent" : sample.status,
      })));
      setAlerts([]);
      setIsLoading(false);
      return;
    }
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Legacy Hide must no longer suppress the panel.
    sessionStorage.removeItem('wooffy_reminders_hidden');

    // Store current user ID
    sessionStorage.setItem('wooffy_current_user_id', user.id);

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
  }, [user, dataFetched, isPreview, previewPet?.id, previewPet?.pet_name]);

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
      .order("next_due_date", { ascending: true }) as { data: any[] | null };

    const TIMEZONE = "Europe/Athens";
    const now = toZonedTime(new Date(), TIMEZONE);
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const upcomingReminders: UpcomingReminder[] = [];

    // Process health records (vaccinations/medications use blanket window, others use reminder_days_before)
    if (healthRecords) {
      for (const record of healthRecords) {
        const dueDate = new Date(record.next_due_date);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const daysUntil = Math.round((dueDateOnly.getTime() - todayDateOnly.getTime()) / (1000 * 60 * 60 * 24));
        const isDueToday = daysUntil === 0;

        const isAutoReminder = record.record_type === 'vaccination' || record.record_type === 'medication';
        const reminderDaysBefore: number[] | null = record.reminder_days_before;

        // For vaccination/medication: show in blanket 30-day window
        // For other types: only show if reminder_days_before matches or if overdue
        let shouldShow = false;

        if (isAutoReminder) {
          shouldShow = daysUntil >= -30 && daysUntil <= 30;
        } else if (reminderDaysBefore && reminderDaysBefore.length > 0) {
          // Show if we're within the earliest reminder window (e.g. 3 days before → show from day 3 onwards)
          // Also show if overdue (up to 7 days past)
          const earliestReminder = Math.max(...reminderDaysBefore);
          shouldShow = (daysUntil >= 0 && daysUntil <= earliestReminder) || (daysUntil >= -7 && daysUntil < 0);
        }

        if (shouldShow) {
          let status: UpcomingReminder["status"] = "upcoming";
          if (daysUntil < 0) status = "overdue";
          else if (isDueToday) status = "today";
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
        // Use date-only comparison to avoid timezone issues
        const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisYearBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        // Check if birthday already passed this year
        if (thisYearBirthday < todayDateOnly) {
          thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
        }

        // Calculate days using date-only values for accuracy
        const daysUntil = Math.round((thisYearBirthday.getTime() - todayDateOnly.getTime()) / (1000 * 60 * 60 * 24));
        const isBirthdayToday = daysUntil === 0;

        if (daysUntil <= 14) {
          let status: UpcomingReminder["status"] = "upcoming";
          if (isBirthdayToday) status = "today";
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
    if (isPreview || !user || isGenerating) return;
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
    if (isPreview) return;
    await supabase
      .from("ai_proactive_alerts")
      .update({ is_dismissed: true })
      .eq("id", alertId);

    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const dismissAllAlerts = async () => {
    if (isPreview || !user || alerts.length === 0) return;
    
    await supabase
      .from("ai_proactive_alerts")
      .update({ is_dismissed: true })
      .eq("user_id", user.id)
      .eq("is_dismissed", false);

    setAlerts([]);
  };

  const getDaysText = (daysUntil: number) => {
    if (daysUntil < 0) {
      const n = Math.abs(daysUntil);
      return t(n === 1 ? "proactiveAlerts.days.overdueOne" : "proactiveAlerts.days.overdueOther", { count: n });
    }
    if (daysUntil === 0) return t("proactiveAlerts.days.today");
    if (daysUntil === 1) return t("proactiveAlerts.days.tomorrow");
    return t("proactiveAlerts.days.inDays", { count: daysUntil });
  };

  const hasUrgentItems = reminders.some(r => r.status === "overdue" || r.status === "today" || r.status === "urgent");
  const overdueCount = reminders.filter(r => r.status === "overdue").length;
  const todayCount = reminders.filter(r => r.status === "today").length;

  // If still loading or no reminders, show nothing
  if (isLoading) return null;
  if (reminders.length === 0 && alerts.length === 0) return null;

  return (
    <Card className="mb-6 overflow-hidden rounded-lg border-primary/20 bg-card shadow-none" aria-label={t("proactiveAlerts.title")}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-l-4 border-primary bg-primary/5 px-4 py-4">
        <div className="flex min-w-0 w-full items-start gap-3 sm:w-auto sm:flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bell className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground break-words">
              {t("proactiveAlerts.title")} <span className="whitespace-nowrap text-primary">({reminders.length})</span>
            </h3>
            {hasUrgentItems && (overdueCount > 0 || todayCount > 0) && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium leading-5 text-destructive">
                {overdueCount > 0 && <span>{t("proactiveAlerts.overdue", { count: overdueCount })}</span>}
                {todayCount > 0 && <span>{t("proactiveAlerts.today", { count: todayCount })}</span>}
              </div>
            )}
            {isPreview && <Badge variant="secondary" className="mt-1 text-xs">Preview only</Badge>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-9 shrink-0 gap-1.5 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
          aria-expanded={!isCollapsed}
          aria-controls="dashboard-reminder-list"
          onClick={() => setIsCollapsed(current => !current)}
        >
          {t(isCollapsed ? "proactiveAlerts.showMore" : "proactiveAlerts.hide")}
          {isCollapsed ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronUp className="h-4 w-4 shrink-0" />}
        </Button>
      </div>

      {!isCollapsed && (
        <CardContent id="dashboard-reminder-list" className="border-t border-border p-0">
          <div className="divide-y divide-border">
            {reminders.slice(0, 5).map((reminder) => (
              <Button
                key={`${reminder.type}-${reminder.id}`}
                variant="ghost"
                className="grid h-auto w-full grid-cols-[2rem_minmax(0,1fr)_1rem] items-start justify-start gap-x-3 gap-y-3 whitespace-normal rounded-none px-4 py-4 text-left font-normal hover:bg-muted/50"
                onClick={() => navigate(reminder.type === "birthday" ? `/member/pet/${reminder.id}` : "/member/health-records")}
              >
                <div className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  statusStyles[reminder.status]
                )}>
                  {alertIcons[reminder.type] || <Calendar className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium leading-5 text-foreground">{reminder.title}</p>
                  <p className="mt-1.5 break-words text-sm leading-5 text-muted-foreground">{reminder.petName}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="col-span-3 flex min-w-0 flex-col items-start gap-2.5 sm:col-start-2 sm:col-span-2">
                  <p className="flex items-center gap-2 text-sm leading-5 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(reminder.dueDate)}
                  </p>
                  <div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                    <Badge className={cn("rounded-md border px-2 py-0.5 text-xs font-medium leading-5 shadow-none hover:bg-muted", statusStyles[reminder.status])}>
                      {t(`proactiveAlerts.status.${reminder.status}`)}
                    </Badge>
                    <span className={cn("text-sm leading-5", reminder.status === "overdue" ? "text-destructive" : "text-muted-foreground")}>
                      {getDaysText(reminder.daysUntil)}
                    </span>
                  </div>
                </div>
              </Button>
            ))}
          </div>

          {/* View All Link */}
          {reminders.length > 5 && (
            <Button
              variant="ghost"
              className="w-full text-sm text-primary hover:text-primary/80"
              onClick={() => navigate("/member/health-records")}
            >
              {t("proactiveAlerts.viewAll", { count: reminders.length })}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {/* AI Alerts (offer suggestions, etc.) */}
          {alerts.filter(a => a.alert_type === "offer_suggestion").length > 0 && (
            <div className="border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground mb-2">{t("proactiveAlerts.suggestions")}</p>
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