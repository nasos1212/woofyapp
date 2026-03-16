import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MetricTooltipProps {
  text: string;
}

const MetricTooltip = ({ text }: MetricTooltipProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <button type="button" className="inline-flex items-center justify-center shrink-0 focus:outline-none">
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help" />
      </button>
    </PopoverTrigger>
    <PopoverContent side="top" className="max-w-[240px] text-xs leading-relaxed p-3">
      {text}
    </PopoverContent>
  </Popover>
);

export default MetricTooltip;
