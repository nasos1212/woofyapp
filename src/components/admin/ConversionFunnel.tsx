import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, Eye, MousePointer, Gift } from "lucide-react";
import MetricTooltip from "./MetricTooltip";

interface ConversionFunnelProps {
  businessViews: number;
  offerClicks: number;
  redemptions: number;
}

const ConversionFunnel = ({ businessViews, offerClicks, redemptions }: ConversionFunnelProps) => {
  const viewToClick = businessViews > 0 ? ((offerClicks / businessViews) * 100).toFixed(1) : "0";
  const clickToRedeem = offerClicks > 0 ? ((redemptions / offerClicks) * 100).toFixed(1) : "0";
  const overallRate = businessViews > 0 ? ((redemptions / businessViews) * 100).toFixed(1) : "0";

  const steps = [
    { icon: Eye, label: "Business Views", value: businessViews, color: "hsl(var(--primary))", bgClass: "bg-primary/10", textClass: "text-primary", width: businessViews > 0 ? "100%" : "0%" },
    { icon: MousePointer, label: "Offer Clicks", value: offerClicks, color: "hsl(25, 95%, 53%)", bgClass: "bg-orange-500/10", textClass: "text-orange-500", width: offerClicks > 0 ? (businessViews > 0 ? `${Math.max(20, (offerClicks / businessViews) * 100)}%` : "20%") : "0%" },
    { icon: Gift, label: "Redemptions", value: redemptions, color: "hsl(142, 71%, 45%)", bgClass: "bg-green-500/10", textClass: "text-green-500", width: redemptions > 0 ? (businessViews > 0 ? `${Math.max(10, (redemptions / businessViews) * 100)}%` : "10%") : "0%" },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
          <MetricTooltip text="Shows the journey from a member viewing a business profile → clicking an offer → redeeming it. Conversion rates between each step help identify where users drop off." />
        </div>
        <p className="text-xs text-muted-foreground">From discovery to redemption</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {steps.map((step, index) => (
            <div key={step.label}>
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${step.bgClass} shrink-0`}>
                  <step.icon className={`w-4 h-4 ${step.textClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{step.label}</span>
                    <span className="text-lg font-bold tabular-nums">{step.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: step.width, backgroundColor: step.color }} />
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex items-center gap-3 py-1.5">
                  <div className="w-7 flex justify-center"><ArrowDown className="w-3.5 h-3.5 text-muted-foreground" /></div>
                  <span className="text-xs text-muted-foreground">{index === 0 ? viewToClick : clickToRedeem}% conversion</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Overall conversion</span>
          <span className="text-lg font-bold text-primary">{overallRate}%</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnel;
