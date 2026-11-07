import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";

interface ContributorBadgesProps {
  totalAnswers?: number;
  className?: string;
}

const ContributorBadges = ({ 
  totalAnswers = 0, 
  className = ""
}: ContributorBadgesProps) => {
  const isTopContributor = totalAnswers >= 10;

  if (!isTopContributor) return null;

  return (
    <div className={`flex gap-1 flex-wrap ${className}`}>
      {isTopContributor && (
        <Badge 
          variant="secondary" 
          className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1"
        >
          <Award className="w-3 h-3" />
          Top Contributor
        </Badge>
      )}
    </div>
  );
};

export default ContributorBadges;
