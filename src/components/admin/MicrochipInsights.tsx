import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Cpu, AlertTriangle, Dog, Cat, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import MetricTooltip from "./MetricTooltip";

interface MicrochipStats {
  totalAlerts: number;
  microchippedAlerts: number;
  notMicrochippedAlerts: number;
  unknownAlerts: number;
  lostMicrochipped: number;
  foundMicrochipped: number;
}

const MicrochipInsights = () => {
  const [stats, setStats] = useState<MicrochipStats>({ totalAlerts: 0, microchippedAlerts: 0, notMicrochippedAlerts: 0, unknownAlerts: 0, lostMicrochipped: 0, foundMicrochipped: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lost_pet_alerts")
        .select("alert_type, microchip_status, status");

      if (error) throw error;
      const alerts = data || [];

      const totalAlerts = alerts.length;
      const microchippedAlerts = alerts.filter(a => a.microchip_status === "yes").length;
      const notMicrochippedAlerts = alerts.filter(a => a.microchip_status === "no").length;
      const unknownAlerts = alerts.filter(a => !a.microchip_status || a.microchip_status === "unknown").length;
      const lostMicrochipped = alerts.filter(a => a.alert_type === "lost" && a.microchip_status === "yes").length;
      const foundMicrochipped = alerts.filter(a => a.alert_type === "found" && a.microchip_status === "yes").length;

      setStats({ totalAlerts, microchippedAlerts, notMicrochippedAlerts, unknownAlerts, lostMicrochipped, foundMicrochipped });
    } catch (error) {
      console.error("Error fetching microchip stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-muted-foreground text-sm py-8 text-center">Loading microchip insights...</p>;

  const chipRate = stats.totalAlerts > 0 ? Math.round((stats.microchippedAlerts / stats.totalAlerts) * 100) : 0;

  const cards = [
    { icon: AlertTriangle, label: "Total Lost & Found Alerts", value: stats.totalAlerts, colorClass: "text-primary", bgClass: "bg-primary/10", tip: "Total number of lost and found pet alerts ever created on the platform." },
    { icon: CheckCircle2, label: "Microchipped Pets", value: stats.microchippedAlerts, colorClass: "text-green-600", bgClass: "bg-green-500/10", tip: "Pets reported as having a microchip in lost or found alerts." },
    { icon: XCircle, label: "Not Microchipped", value: stats.notMicrochippedAlerts, colorClass: "text-red-500", bgClass: "bg-red-500/10", tip: "Pets confirmed as NOT having a microchip in lost or found alerts." },
    { icon: HelpCircle, label: "Microchip Unknown", value: stats.unknownAlerts, colorClass: "text-muted-foreground", bgClass: "bg-muted", tip: "Alerts where the microchip status was not specified or is unknown." },
    { icon: Cpu, label: "Microchip Rate", value: chipRate, colorClass: "text-blue-500", bgClass: "bg-blue-500/10", tip: "Percentage of all lost/found alerts where the pet is confirmed microchipped.", suffix: "%" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => (
          <Card key={card.label} className="border-border/50 hover:border-border transition-colors">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${card.bgClass}`}>
                  <card.icon className={`w-4 h-4 ${card.colorClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold tabular-nums">
                    {card.value.toLocaleString()}{"suffix" in card && card.suffix ? card.suffix : ""}
                  </p>
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] text-muted-foreground leading-tight">{card.label}</p>
                    {card.tip && <MetricTooltip text={card.tip} />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MicrochipInsights;
