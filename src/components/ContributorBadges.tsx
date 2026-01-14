import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle } from "lucide-react";

interface ContributorBadgesProps {
  totalAnswers?: number;
  acceptedAnswers?: number;
  className?: string;
}

const ContributorBadges = ({ 
  totalAnswers = 0, 
  acceptedAnswers = 0,
  className = ""
}: ContributorBadgesProps) => {
  const isTopContributor = totalAnswers >= 10;
  const isVerifiedHelper = acceptedAnswers >= 3;

  if (!isTopContributor && !isVerifiedHelper) return null;

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
      {isVerifiedHelper && (
        <Badge 
          variant="secondary" 
          className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1"
        >
          <CheckCircle className="w-3 h-3" />
          Verified Helper
        </Badge>
      )}
    </div>
  );
};

export default ContributorBadges;
