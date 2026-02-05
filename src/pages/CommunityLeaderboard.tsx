import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity, ExpertStats } from '@/hooks/useCommunity';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import DogLoader from '@/components/DogLoader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Medal,
  Award,
  Star,
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  Shield,
  TrendingUp,
  Users,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeaderboardEntry extends ExpertStats {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  rank: number;
}

const rankIcons = [
  { icon: Trophy, color: 'text-yellow-500' },
  { icon: Medal, color: 'text-gray-400' },
  { icon: Award, color: 'text-amber-600' }
];

const CommunityLeaderboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { fetchLeaderboard } = useCommunity();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<ExpertStats | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        // Fetch leaderboard with profiles
        const { data, error } = await supabase
          .from('community_expert_stats')
          .select(`
            *,
            profile:profiles!community_expert_stats_user_id_fkey(full_name, avatar_url)
          `)
          .order('reputation_score', { ascending: false })
          .limit(50);

        if (error) throw error;

        const ranked = (data || []).map((entry, index) => ({
          ...entry,
          rank: index + 1
        })) as unknown as LeaderboardEntry[];

        setLeaderboard(ranked);

        // Find user's rank
        const userEntry = ranked.find(e => e.user_id === user.id);
        if (userEntry) {
          setUserStats(userEntry);
          setUserRank(userEntry.rank);
        } else {
          // User not in leaderboard, fetch their stats
          const { data: stats } = await supabase
            .from('community_expert_stats')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (stats) {
            setUserStats(stats);
            // Calculate approximate rank
            const { count } = await supabase
              .from('community_expert_stats')
              .select('*', { count: 'exact', head: true })
              .gt('reputation_score', stats.reputation_score);
            setUserRank((count || 0) + 1);
          }
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader />
      </div>
    );
  }

  const getReputationLevel = (score: number) => {
    if (score >= 1000) return { level: 'Expert', color: 'bg-purple-500', progress: 100 };
    if (score >= 500) return { level: 'Veteran', color: 'bg-blue-500', progress: ((score - 500) / 500) * 100 };
    if (score >= 200) return { level: 'Contributor', color: 'bg-green-500', progress: ((score - 200) / 300) * 100 };
    if (score >= 50) return { level: 'Helper', color: 'bg-yellow-500', progress: ((score - 50) / 150) * 100 };
    return { level: 'Newcomer', color: 'bg-gray-500', progress: (score / 50) * 100 };
  };

  return (
    <>
      <Helmet>
        <title>Community Leaderboard | Wooffy</title>
        <meta name="description" content="See the top contributors in the Wooffy community." />
      </Helmet>

      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header />
        
        <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))] box-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/community')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Community Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Celebrating our most helpful community members
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* User Stats Card */}
            {userStats && (
              <Card className="lg:col-span-3 bg-gradient-to-r from-primary/10 to-primary/5">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-20 w-20 border-4 border-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-xl font-bold mb-1">Your Stats</h2>
                      <p className="text-muted-foreground mb-3">
                        Rank #{userRank || '—'} in the community
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{userStats.reputation_score}</p>
                          <p className="text-xs text-muted-foreground">Reputation</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{userStats.total_answers}</p>
                          <p className="text-xs text-muted-foreground">Answers</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{userStats.accepted_answers}</p>
                          <p className="text-xs text-muted-foreground">Accepted</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{userStats.total_upvotes}</p>
                          <p className="text-xs text-muted-foreground">Upvotes</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <Badge className={`${getReputationLevel(userStats.reputation_score).color} text-white text-lg px-4 py-2`}>
                        <Star className="w-5 h-5 mr-2" />
                        {getReputationLevel(userStats.reputation_score).level}
                      </Badge>
                      <div className="mt-3 w-48">
                        <Progress 
                          value={getReputationLevel(userStats.reputation_score).progress} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Progress to next level
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top 3 Podium */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="w-5 h-5" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-end justify-center gap-4 py-6">
                  {/* 2nd Place */}
                  {leaderboard[1] && (
                    <div className="order-1 md:order-none flex flex-col items-center">
                      <Avatar className="h-16 w-16 mb-2 border-4 border-gray-400">
                        <AvatarImage src={leaderboard[1].profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-gray-400 text-white">
                          {leaderboard[1].profile?.full_name?.charAt(0) || '2'}
                        </AvatarFallback>
                      </Avatar>
                      <Medal className="w-8 h-8 text-gray-400 mb-1" />
                      <p className="font-semibold text-sm">{leaderboard[1].profile?.full_name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{leaderboard[1].reputation_score} pts</p>
                      <div className="w-24 h-20 bg-gray-200 dark:bg-gray-700 rounded-t-lg mt-2 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-500">2</span>
                      </div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {leaderboard[0] && (
                    <div className="order-0 md:order-none flex flex-col items-center">
                      <Avatar className="h-20 w-20 mb-2 border-4 border-yellow-500">
                        <AvatarImage src={leaderboard[0].profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-yellow-500 text-white text-xl">
                          {leaderboard[0].profile?.full_name?.charAt(0) || '1'}
                        </AvatarFallback>
                      </Avatar>
                      <Trophy className="w-10 h-10 text-yellow-500 mb-1" />
                      <p className="font-bold">{leaderboard[0].profile?.full_name || 'Anonymous'}</p>
                      <p className="text-sm text-muted-foreground">{leaderboard[0].reputation_score} pts</p>
                      {leaderboard[0].is_verified_professional && (
                        <Badge className="bg-blue-500 text-white text-xs mt-1">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified Pro
                        </Badge>
                      )}
                      <div className="w-24 h-28 bg-yellow-100 dark:bg-yellow-900/30 rounded-t-lg mt-2 flex items-center justify-center">
                        <span className="text-3xl font-bold text-yellow-600">1</span>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {leaderboard[2] && (
                    <div className="order-2 flex flex-col items-center">
                      <Avatar className="h-14 w-14 mb-2 border-4 border-amber-600">
                        <AvatarImage src={leaderboard[2].profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-amber-600 text-white">
                          {leaderboard[2].profile?.full_name?.charAt(0) || '3'}
                        </AvatarFallback>
                      </Avatar>
                      <Award className="w-7 h-7 text-amber-600 mb-1" />
                      <p className="font-semibold text-sm">{leaderboard[2].profile?.full_name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{leaderboard[2].reputation_score} pts</p>
                      <div className="w-24 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-t-lg mt-2 flex items-center justify-center">
                        <span className="text-2xl font-bold text-amber-600">3</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Full Leaderboard */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Rankings
                </CardTitle>
                <CardDescription>Top 50 community members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.slice(3).map((entry) => {
                    const level = getReputationLevel(entry.reputation_score);
                    return (
                      <div 
                        key={entry.id}
                        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                          entry.user_id === user?.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <span className="w-8 text-center font-bold text-muted-foreground">
                          {entry.rank}
                        </span>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={entry.profile?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {entry.profile?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {entry.profile?.full_name || 'Anonymous'}
                            </p>
                            {entry.is_verified_professional && (
                              <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                            )}
                          </div>
                          <Badge variant="secondary" className={`text-xs ${level.color} text-white`}>
                            {level.level}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{entry.reputation_score}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* How to Earn Points */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  How to Earn Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Answer Questions</p>
                    <p className="text-sm text-muted-foreground">+5 points per answer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <ThumbsUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Get Upvotes</p>
                    <p className="text-sm text-muted-foreground">+2 points per upvote</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">Answer Accepted</p>
                    <p className="text-sm text-muted-foreground">+15 points when accepted</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Verified Professional</p>
                    <p className="text-sm text-muted-foreground">Partner businesses get the badge</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default CommunityLeaderboard;
