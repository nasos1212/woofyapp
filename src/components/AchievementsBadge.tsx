import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAchievements, Achievement } from "@/hooks/useAchievements";

const AchievementsBadge = () => {
  const { achievements, getUnlockedCount, getTotalCount, isLoading } = useAchievements();

  if (isLoading) return null;

  const unlockedCount = getUnlockedCount();
  const totalCount = getTotalCount();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 min-h-[44px] bg-paw-gold/10 rounded-full hover:bg-paw-gold/20 transition-colors active:bg-paw-gold/30">
          <Trophy className="w-4 h-4 text-paw-gold" />
          <span className="text-sm font-medium text-paw-gold">
            {unlockedCount}/{totalCount}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Trophy className="w-5 h-5 text-paw-gold" />
            Your Achievements
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {unlockedCount === totalCount ? (
            <span className="text-paw-gold font-medium">
              🎉 Congratulations! You've unlocked all achievements!
            </span>
          ) : (
            <span>
              Keep using PawPass to unlock more achievements!
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  return (
    <div
      className={`p-3 rounded-xl border transition-all ${
        achievement.unlocked
          ? "bg-paw-gold/10 border-paw-gold/30"
          : "bg-muted/50 border-transparent opacity-60"
      }`}
    >
      <div className="text-2xl mb-1">{achievement.icon}</div>
      <p
        className={`font-medium text-sm ${
          achievement.unlocked ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {achievement.title}
      </p>
      <p className="text-xs text-muted-foreground">{achievement.description}</p>
      {achievement.unlocked && (
        <Badge variant="secondary" className="mt-2 text-xs bg-paw-gold/20 text-paw-gold border-0">
          Unlocked
        </Badge>
      )}
    </div>
  );
};

export default AchievementsBadge;
