import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity, Category, Question } from '@/hooks/useCommunity';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import DogLoader from '@/components/DogLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquarePlus,
  Search,
  Filter,
  TrendingUp,
  Clock,
  HelpCircle,
  Bookmark,
  Eye,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Users,
  Trophy
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const urgencyConfig = {
  general: { icon: HelpCircle, color: 'bg-green-500', label: 'General' },
  concerned: { icon: AlertTriangle, color: 'bg-yellow-500', label: 'Concerned' },
  urgent: { icon: AlertCircle, color: 'bg-red-500', label: 'Urgent' }
};

const statusConfig = {
  open: { color: 'bg-blue-500', label: 'Open' },
  answered: { color: 'bg-purple-500', label: 'Answered' },
  resolved: { color: 'bg-green-500', label: 'Resolved' },
  closed: { color: 'bg-gray-500', label: 'Closed' }
};

const Community = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { fetchCategories, fetchQuestions, toggleSaveQuestion } = useCommunity();

  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, quests] = await Promise.all([
          fetchCategories(),
          fetchQuestions({
            category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
            urgency: selectedUrgency !== 'all' ? selectedUrgency : undefined,
            search: searchQuery || undefined,
            sort: sortBy
          })
        ]);
        setCategories(cats);
        setQuestions(quests);
      } catch (error) {
        console.error('Error loading community data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, fetchCategories, fetchQuestions, selectedCategory, selectedUrgency, searchQuery, sortBy]);

  const handleSaveToggle = async (question: Question) => {
    try {
      await toggleSaveQuestion(question.id, question.is_saved || false);
      setQuestions(prev => prev.map(q => 
        q.id === question.id ? { ...q, is_saved: !q.is_saved } : q
      ));
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader />
      </div>
    );
  }

  const QuestionCard = ({ question }: { question: Question }) => {
    const urgency = urgencyConfig[question.urgency];
    const status = statusConfig[question.status];
    const UrgencyIcon = urgency.icon;

    return (
      <Card 
        className="hover:shadow-lg transition-all cursor-pointer group"
        onClick={() => navigate(`/member/community/question/${question.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Author Avatar */}
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={question.author?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {question.author?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Title and badges */}
              <div className="flex items-start gap-2 mb-2">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                  {question.is_pinned && <span className="text-primary mr-1">📌</span>}
                  {question.title}
                </h3>
                <div className="flex gap-1 shrink-0">
                  <Badge className={`${urgency.color} text-white text-xs`}>
                    <UrgencyIcon className="w-3 h-3 mr-1" />
                    {urgency.label}
                  </Badge>
                  <Badge className={`${status.color} text-white text-xs`}>
                    {status.label}
                  </Badge>
                </div>
              </div>

              {/* Content preview */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {question.content}
              </p>

              {/* Pet and category info */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {question.pet && (
                  <Badge variant="outline" className="text-xs">
                    🐕 {question.pet.pet_name} {question.pet.pet_breed && `(${question.pet.pet_breed})`}
                  </Badge>
                )}
                {question.category && (
                  <Badge variant="secondary" className="text-xs">
                    {question.category.icon} {question.category.name}
                  </Badge>
                )}
                {question.breed_tags?.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Photos preview */}
              {question.photos && question.photos.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {question.photos.slice(0, 3).map((photo, idx) => (
                    <img
                      key={photo.id}
                      src={photo.photo_url}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ))}
                  {question.photos.length > 3 && (
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                      +{question.photos.length - 3}
                    </div>
                  )}
                </div>
              )}

              {/* Stats and actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {question.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {question.answer_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {question.helped_count} helped
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={question.is_saved ? 'text-primary' : ''}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveToggle(question);
                  }}
                >
                  <Bookmark className={`w-4 h-4 ${question.is_saved ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Helmet>
        <title>Community Hub | Wooffy</title>
        <meta name="description" content="Connect with fellow dog owners, ask questions, and share experiences in the Wooffy community." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/member' },
              { label: 'Community' }
            ]}
          />

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Users className="w-8 h-8 text-primary" />
                Community Hub
              </h1>
              <p className="text-muted-foreground mt-1">
                Ask questions, share experiences, and help fellow dog owners
              </p>
            </div>
            <Button 
              onClick={() => navigate('/member/community/ask')}
              className="bg-primary hover:bg-primary/90"
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              Ask a Question
            </Button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="shrink-0"
            >
              All Categories
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="shrink-0"
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="general">🟢 General</SelectItem>
                  <SelectItem value="concerned">🟡 Concerned</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Most Recent
                    </span>
                  </SelectItem>
                  <SelectItem value="popular">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Most Popular
                    </span>
                  </SelectItem>
                  <SelectItem value="unanswered">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" /> Unanswered
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Questions List */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Questions</TabsTrigger>
                  <TabsTrigger value="my">My Questions</TabsTrigger>
                  <TabsTrigger value="saved">Saved</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {questions.length > 0 ? (
                    questions.map(q => <QuestionCard key={q.id} question={q} />)
                  ) : (
                    <Card className="p-8 text-center">
                      <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No questions found</h3>
                      <p className="text-muted-foreground mb-4">
                        Be the first to ask a question in this category!
                      </p>
                      <Button onClick={() => navigate('/member/community/ask')}>
                        Ask a Question
                      </Button>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="my" className="space-y-4">
                  {questions.filter(q => q.user_id === user?.id).length > 0 ? (
                    questions.filter(q => q.user_id === user?.id).map(q => (
                      <QuestionCard key={q.id} question={q} />
                    ))
                  ) : (
                    <Card className="p-8 text-center">
                      <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">You haven't asked any questions yet</h3>
                      <Button onClick={() => navigate('/member/community/ask')}>
                        Ask Your First Question
                      </Button>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="saved" className="space-y-4">
                  {questions.filter(q => q.is_saved).length > 0 ? (
                    questions.filter(q => q.is_saved).map(q => (
                      <QuestionCard key={q.id} question={q} />
                    ))
                  ) : (
                    <Card className="p-8 text-center">
                      <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No saved questions</h3>
                      <p className="text-muted-foreground">
                        Click the bookmark icon on any question to save it for later.
                      </p>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats Card */}
              <Card>
                <CardHeader className="pb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Community Stats
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Questions</span>
                      <span className="font-medium">{questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolved</span>
                      <span className="font-medium text-green-600">
                        {questions.filter(q => q.status === 'resolved').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Awaiting Help</span>
                      <span className="font-medium text-blue-600">
                        {questions.filter(q => q.status === 'open').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader className="pb-2">
                  <h3 className="font-semibold">Quick Actions</h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/member/community/ask')}
                  >
                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                    Ask a Question
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/member/community/leaderboard')}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    View Leaderboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/member/health-assistant')}
                  >
                    🤖 Ask Wooffy AI
                  </Button>
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
                <CardContent className="p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>⚠️ Important:</strong> Community advice is not a substitute for professional veterinary care. For emergencies, contact your vet immediately.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Community;
