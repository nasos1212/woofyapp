import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity, Question, Answer } from '@/hooks/useCommunity';
import { validateImageFile } from '@/lib/fileValidation';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DogLoader from '@/components/DogLoader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Bookmark,
  Bell,
  BellOff,
  Eye,
  MessageCircle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Send,
  ImagePlus,
  X,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Award,
  Shield,
  Heart,
  Share2,
  Flag,
  MoreVertical,
  ChevronLeft
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const urgencyConfig = {
  general: { icon: HelpCircle, color: 'bg-green-500', label: 'General', textColor: 'text-green-700' },
  concerned: { icon: AlertTriangle, color: 'bg-yellow-500', label: 'Concerned', textColor: 'text-yellow-700' },
  urgent: { icon: AlertCircle, color: 'bg-red-500', label: 'Urgent', textColor: 'text-red-700' }
};

const statusConfig = {
  open: { color: 'bg-blue-500', label: 'Open', textColor: 'text-blue-700' },
  answered: { color: 'bg-purple-500', label: 'Answered', textColor: 'text-purple-700' },
  resolved: { color: 'bg-green-500', label: 'Resolved', textColor: 'text-green-700' },
  closed: { color: 'bg-gray-500', label: 'Closed', textColor: 'text-gray-700' }
};

const CommunityQuestion = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    fetchQuestion,
    fetchAnswers,
    createAnswer,
    voteAnswer,
    acceptAnswer,
    toggleSaveQuestion,
    toggleFollowQuestion,
    markAsHelped,
    loading: submitting
  } = useCommunity();

  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
  const [answerPhotos, setAnswerPhotos] = useState<File[]>([]);
  const [answerPhotoUrls, setAnswerPhotoUrls] = useState<string[]>([]);
  const [showPhotoGallery, setShowPhotoGallery] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [q, a] = await Promise.all([
        fetchQuestion(id),
        fetchAnswers(id)
      ]);
      setQuestion(q);
      setAnswers(a);
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setLoading(false);
    }
  }, [id, fetchQuestion, fetchAnswers]);

  useEffect(() => {
    if (user && id) {
      loadData();
    }
  }, [user, id, loadData]);

  const handleSaveToggle = async () => {
    if (!question) return;
    try {
      await toggleSaveQuestion(question.id, question.is_saved || false);
      setQuestion(prev => prev ? { ...prev, is_saved: !prev.is_saved } : null);
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!question) return;
    try {
      await toggleFollowQuestion(question.id, question.is_following || false);
      setQuestion(prev => prev ? { ...prev, is_following: !prev.is_following } : null);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleHelped = async () => {
    if (!question) return;
    try {
      await markAsHelped(question.id);
      setQuestion(prev => prev ? { ...prev, helped_count: (prev.helped_count || 0) + 1 } : null);
    } catch (error) {
      console.error('Error marking as helped:', error);
    }
  };

  const handleVote = async (answerId: string, voteType: 'up' | 'down') => {
    try {
      await voteAnswer(answerId, voteType);
      // Reload answers to get updated vote counts
      const updatedAnswers = await fetchAnswers(question!.id);
      setAnswers(updatedAnswers);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleAccept = async (answerId: string) => {
    if (!question) return;
    try {
      await acceptAnswer(question.id, answerId);
      setQuestion(prev => prev ? { ...prev, status: 'resolved' } : null);
      setAnswers(prev => prev.map(a => ({
        ...a,
        is_accepted: a.id === answerId
      })));
    } catch (error) {
      console.error('Error accepting answer:', error);
    }
  };

  const handlePhotoAdd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate each file before adding
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }
    }
    
    if (answerPhotos.length + files.length > 3) {
      toast.error('Maximum 3 photos allowed per answer');
      return;
    }

    const newPhotos = [...answerPhotos, ...files].slice(0, 3);
    setAnswerPhotos(newPhotos);

    const newUrls = newPhotos.map(file => URL.createObjectURL(file));
    setAnswerPhotoUrls(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return newUrls;
    });
  }, [answerPhotos]);

  const handlePhotoRemove = useCallback((index: number) => {
    const newPhotos = answerPhotos.filter((_, i) => i !== index);
    setAnswerPhotos(newPhotos);

    URL.revokeObjectURL(answerPhotoUrls[index]);
    setAnswerPhotoUrls(prev => prev.filter((_, i) => i !== index));
  }, [answerPhotos, answerPhotoUrls]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim() || !question) return;

    try {
      await createAnswer(question.id, answerContent.trim(), answerPhotos);
      setAnswerContent('');
      setAnswerPhotos([]);
      setAnswerPhotoUrls([]);
      loadData(); // Reload to show new answer
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Question not found</h1>
        <Button onClick={() => navigate('/community')}>
          Back to Community
        </Button>
      </div>
    );
  }

  const urgency = urgencyConfig[question.urgency];
  const status = statusConfig[question.status];
  const UrgencyIcon = urgency.icon;
  const isOwner = user?.id === question.user_id;

  return (
    <>
      <Helmet>
        <title>{question.title} | Wooffy Community</title>
        <meta name="description" content={question.content.slice(0, 160)} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/community')}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Community
          </Button>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={question.author?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {question.author?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{question.author?.full_name || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(question.created_at), 'MMM d, yyyy')} · {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${urgency.color} text-white`}>
                    <UrgencyIcon className="w-3 h-3 mr-1" />
                    {urgency.label}
                  </Badge>
                  <Badge className={`${status.color} text-white`}>
                    {status.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Title */}
              <h1 className="text-2xl font-bold mb-4">{question.title}</h1>

              {/* Content */}
              <div className="prose dark:prose-invert max-w-none mb-4">
                <p className="whitespace-pre-wrap">{question.content}</p>
              </div>

              {/* Photos */}
              {question.photos && question.photos.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {question.photos.map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.photo_url}
                      alt=""
                      className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setShowPhotoGallery(photo.photo_url)}
                    />
                  ))}
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {question.pet && (
                  <Badge variant="outline">
                    🐕 {question.pet.pet_name} {question.pet.pet_breed && `(${question.pet.pet_breed})`}
                  </Badge>
                )}
                {question.category && (
                  <Badge variant="secondary">
                    {question.category.icon} {question.category.name}
                  </Badge>
                )}
                {question.breed_tags?.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {question.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {answers.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {question.helped_count}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleHelped}
                    disabled={isOwner}
                    className="text-xs sm:text-sm"
                  >
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">This helped me</span>
                    <span className="sm:hidden">Helped</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveToggle}
                    className={question.is_saved ? 'text-primary' : ''}
                  >
                    <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${question.is_saved ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant={question.is_following ? "default" : "outline"}
                    size="sm"
                    onClick={handleFollowToggle}
                    className="text-xs sm:text-sm"
                  >
                    {question.is_following ? (
                      <>
                        <BellOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Unfollow</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Follow</span>
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Flag className="w-4 h-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Answers Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
            </h2>

            {answers.length > 0 ? (
              <div className="space-y-4">
                {answers.map(answer => (
                  <Card 
                    key={answer.id}
                    className={answer.is_accepted ? 'border-green-500 border-2' : ''}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Vote buttons */}
                        <div className="flex flex-col items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote(answer.id, 'up')}
                            className={answer.user_vote === 'up' ? 'text-green-600' : ''}
                          >
                            <ThumbsUp className={`w-5 h-5 ${answer.user_vote === 'up' ? 'fill-current' : ''}`} />
                          </Button>
                          <span className="font-semibold text-lg">
                            {answer.upvotes - answer.downvotes}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote(answer.id, 'down')}
                            className={answer.user_vote === 'down' ? 'text-red-600' : ''}
                          >
                            <ThumbsDown className={`w-5 h-5 ${answer.user_vote === 'down' ? 'fill-current' : ''}`} />
                          </Button>
                        </div>

                        <div className="flex-1">
                          {/* Author */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={answer.author?.avatar_url || ''} />
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                  {answer.author?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {answer.author?.full_name || 'Anonymous'}
                                  </span>
                                  {answer.is_verified_pro && (
                                    <Badge className="bg-blue-500 text-white text-xs">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Verified Pro
                                    </Badge>
                                  )}
                                  {answer.is_accepted && (
                                    <Badge className="bg-green-500 text-white text-xs">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Accepted
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>

                            {isOwner && !answer.is_accepted && question.status !== 'resolved' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-green-600">
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Accept Answer
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Accept this answer?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will mark your question as resolved and highlight this answer as the solution.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleAccept(answer.id)}>
                                      Accept Answer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>

                          {/* Content */}
                          <p className="text-foreground whitespace-pre-wrap mb-3">
                            {answer.content}
                          </p>

                          {/* Photos */}
                          {answer.photos && answer.photos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {answer.photos.map((photo) => (
                                <img
                                  key={photo.id}
                                  src={photo.photo_url}
                                  alt=""
                                  className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                  onClick={() => setShowPhotoGallery(photo.photo_url)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No answers yet</h3>
                <p className="text-muted-foreground">
                  Be the first to help with this question!
                </p>
              </Card>
            )}
          </div>

          {/* Answer Form */}
          {question.status !== 'closed' && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Your Answer</h3>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitAnswer} className="space-y-4">
                  <Textarea
                    placeholder="Share your experience or advice..."
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    className="min-h-[120px]"
                  />

                  {/* Photo uploads */}
                  <div className="flex flex-wrap gap-2">
                    {answerPhotoUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Photo ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handlePhotoRemove(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {answerPhotos.length < 3 && (
                      <label className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <ImagePlus className="w-5 h-5 text-muted-foreground" />
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoAdd}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={!answerContent.trim() || submitting}>
                      {submitting ? 'Posting...' : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Post Answer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Photo Gallery Modal */}
          {showPhotoGallery && (
            <div 
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setShowPhotoGallery(null)}
            >
              <button
                className="absolute top-4 right-4 text-white"
                onClick={() => setShowPhotoGallery(null)}
              >
                <X className="w-8 h-8" />
              </button>
              <img
                src={showPhotoGallery}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CommunityQuestion;
