import { useState, useEffect, useRef } from "react";
import { Bell, X, Syringe, Gift, Tag, Lightbulb, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const alertIcons: Record<string, React.ReactNode> = {
  vaccination_due: <Syringe className="w-4 h-4" />,
  birthday_coming: <Gift className="w-4 h-4" />,
  offer_suggestion: <Tag className="w-4 h-4" />,
  health_tip: <Lightbulb className="w-4 h-4" />,
};

const priorityColors: Record<string, string> = {
  urgent: "bg-red-50 border-red-200 text-red-800",
  high: "bg-orange-50 border-orange-200 text-orange-800",
  normal: "bg-blue-50 border-blue-200 text-blue-800",
  low: "bg-gray-50 border-gray-200 text-gray-700",
};

// Track if alerts have been generated this session to prevent duplicates
const generatedThisSession = new Set<string>();

export const AIProactiveAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAlerts();
      // Only generate alerts once per user per session
      if (!generatedThisSession.has(user.id)) {
        generatedThisSession.add(user.id);
        generateNewAlerts();
      }
    }
  }, [user]);

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
      // Sort by priority (urgent first)
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

  const markAsRead = async (alertId: string) => {
    await supabase
      .from("ai_proactive_alerts")
      .update({ is_read: true })
      .eq("id", alertId);

    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, is_read: true } : a
    ));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Wooffy Reminders</h3>
          <span className="text-xs text-muted-foreground">({alerts.length})</span>
        </div>
        {alerts.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
            onClick={dismissAllAlerts}
          >
            Clear all
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "relative p-3 rounded-lg border transition-all cursor-pointer",
              priorityColors[alert.priority] || priorityColors.normal,
              !alert.is_read && "ring-2 ring-primary/20"
            )}
            onClick={() => markAsRead(alert.id)}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {alertIcons[alert.alert_type] || <AlertTriangle className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-xs mt-0.5 opacity-80">{alert.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-6 w-6 p-0 hover:bg-white/50"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissAlert(alert.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIProactiveAlerts;