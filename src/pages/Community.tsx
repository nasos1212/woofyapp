import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useCommunity, Category, Question } from '@/hooks/useCommunity';
import Header from '@/components/Header';
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
  Trophy,
  ArrowLeft,
  Dog,
  Cat
} from 'lucide-react';
import { formatRelative } from '@/lib/relativeTime';
import { useTranslation } from 'react-i18next';

const Community = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { hasMembership, isPaidMember, loading: membershipLoading } = useMembership();
  const { fetchCategories, fetchQuestions, toggleSaveQuestion } = useCommunity();
  const { t } = useTranslation();

  const urgencyConfig = {
    general: { icon: HelpCircle, color: 'bg-green-500', label: t('community.general') },
    concerned: { icon: AlertTriangle, color: 'bg-yellow-500', label: t('community.concerned') },
    urgent: { icon: AlertCircle, color: 'bg-red-500', label: t('community.urgent') }
  };

  const statusConfig = {
    open: { color: 'bg-blue-500', label: t('community.open') },
    answered: { color: 'bg-purple-500', label: t('community.answered') },
    resolved: { color: 'bg-green-500', label: t('community.resolved') },
    closed: { color: 'bg-gray-500', label: t('community.closed') }
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedAnimalType, setSelectedAnimalType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');

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
            animal_type: selectedAnimalType !== 'all' ? selectedAnimalType : undefined,
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
  }, [user, fetchCategories, fetchQuestions, selectedCategory, selectedUrgency, selectedAnimalType, searchQuery, sortBy]);

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
        onClick={() => navigate(`/community/question/${question.id}`)}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-3 sm:gap-4">
            {/* Author Avatar - hidden on very small screens or if anonymous */}
            {!question.is_anonymous && (
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 hidden xs:flex">
                <AvatarImage src={question.author?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {question.author?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
            {question.is_anonymous && (
              <div className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 hidden xs:flex items-center justify-center bg-muted rounded-full">
                <span className="text-muted-foreground text-sm">?</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Title and badges */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-2">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1 text-sm sm:text-base">
                  {question.is_pinned && <span className="text-primary mr-1">📌</span>}
                  {question.title}
                </h3>
                <div className="flex gap-1 shrink-0 flex-wrap">
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
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
                {question.content}
              </p>

              {/* Pet and category info */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                {question.pet && (
                  <Badge variant="outline" className="text-xs">
                    🐾 {question.pet.pet_name}
                  </Badge>
                )}
                {question.category && (
                  <Badge variant="secondary" className="text-xs">
                    {question.category.icon} <span className="hidden sm:inline">{t(`community.categories.${question.category.slug}`, question.category.name)}</span>
                  </Badge>
                )}
                {question.breed_tags?.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs hidden sm:inline-flex">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Photos preview */}
              {question.photos && question.photos.length > 0 && (
                <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-3">
                  {question.photos.slice(0, 2).map((photo, idx) => (
                    <img
                      key={photo.id}
                      src={photo.photo_url}
                      alt=""
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                    />
                  ))}
                  {question.photos.length > 2 && (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-lg flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
                      +{question.photos.length - 2}
                    </div>
                  )}
                </div>
              )}

              {/* Stats and actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    {question.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    {question.answer_count || 0}
                  </span>
                  <span className="flex items-center gap-1 hidden sm:flex">
                    <CheckCircle2 className="w-4 h-4" />
                    {question.helped_count} {t('community.helped')}
                  </span>
                  <span className="hidden xs:inline">
                    {formatRelative(question.created_at)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${question.is_saved ? 'text-primary' : ''} h-8 w-8 p-0`}
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
        <title>{t('community.pageTitle')}</title>
        <meta name="description" content={t('community.metaDescription')} />
      </Helmet>

      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header />
        <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))] box-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(hasMembership ? '/member' : '/member/free')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('community.backToDashboard')}
          </Button>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Users className="w-8 h-8 text-primary" />
                {t('community.title')}
              </h1>
            <p className="text-muted-foreground mt-1">
              {t('community.subtitle')}
            </p>
            </div>
            <Button 
              onClick={() => navigate('/community/ask')}
              className="bg-primary hover:bg-primary/90"
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              {t('community.askQuestion')}
            </Button>
          </div>

          {/* Animal Type Pills */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={selectedAnimalType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedAnimalType('all')}
              className="gap-2"
            >
              🐾 {t('community.allPets')}
            </Button>
            <Button
              variant={selectedAnimalType === 'dog' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedAnimalType('dog')}
              className="gap-2"
            >
              <Dog className="w-4 h-4" />
              {t('community.dogs')}
            </Button>
            <Button
              variant={selectedAnimalType === 'cat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedAnimalType('cat')}
              className="gap-2"
            >
              <Cat className="w-4 h-4" />
              {t('community.cats')}
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
              {t('community.allCategories')}
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="shrink-0"
              >
                {cat.icon} {t(`community.categories.${cat.slug}`, cat.name)}
              </Button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('community.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t('community.urgency')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('community.allUrgency')}</SelectItem>
                  <SelectItem value="general">🟢 {t('community.general')}</SelectItem>
                  <SelectItem value="concerned">🟡 {t('community.concerned')}</SelectItem>
                  <SelectItem value="urgent">🔴 {t('community.urgent')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {t('community.mostRecent')}
                    </span>
                  </SelectItem>
                  <SelectItem value="popular">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> {t('community.mostPopular')}
                    </span>
                  </SelectItem>
                  <SelectItem value="unanswered">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" /> {t('community.unanswered')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Questions List */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 w-full sm:w-auto flex">
                  <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm">{t('community.tabs.all')}</TabsTrigger>
                  <TabsTrigger value="my" className="flex-1 sm:flex-none text-xs sm:text-sm">{t('community.tabs.my')}</TabsTrigger>
                  <TabsTrigger value="saved" className="flex-1 sm:flex-none text-xs sm:text-sm">{t('community.tabs.saved')}</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {questions.length > 0 ? (
                    questions.map(q => <QuestionCard key={q.id} question={q} />)
                  ) : (
                    <Card className="p-8 text-center">
                      <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">{t('community.noQuestions')}</h3>
                      <p className="text-muted-foreground mb-4">
                        {t('community.beFirst')}
                      </p>
                      <Button onClick={() => navigate('/community/ask')}>
                        {t('community.askQuestion')}
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
                      <h3 className="font-semibold mb-2">{t('community.noOwnQuestions')}</h3>
                      <Button onClick={() => navigate('/community/ask')}>
                        {t('community.askFirstQuestion')}
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
                      <h3 className="font-semibold mb-2">{t('community.noSaved')}</h3>
                      <p className="text-muted-foreground">
                        {t('community.noSavedHint')}
                      </p>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - shows first on mobile */}
            <div className="space-y-6 order-1 lg:order-2">
              {/* Stats Card */}
              <Card>
                <CardHeader className="pb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    {t('community.stats')}
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('community.totalQuestions')}</span>
                      <span className="font-medium">{questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('community.resolvedCount')}</span>
                      <span className="font-medium text-green-600">
                        {questions.filter(q => q.status === 'resolved').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('community.awaitingHelp')}</span>
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
                  <h3 className="font-semibold">{t('community.quickActions')}</h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/community/ask')}
                  >
                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                    {t('community.askQuestion')}
                  </Button>
                  {isPaidMember ? (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/member/health-assistant')}
                    >
                      🤖 {t('community.askWooffyAi')}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start opacity-50 cursor-not-allowed"
                      disabled
                    >
                      🔒 {t('community.askWooffyAi')}
                      <Badge variant="secondary" className="ml-auto text-xs">{t('community.premium')}</Badge>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
                <CardContent className="p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>⚠️ {t('community.important')}</strong> {t('community.disclaimer')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Community;
