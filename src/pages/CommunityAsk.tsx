import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity, Category } from '@/hooks/useCommunity';
import { supabase } from '@/integrations/supabase/client';
import { validateImageFile } from '@/lib/fileValidation';
import { toast } from 'sonner';
import Header from '@/components/Header';
import DogLoader from '@/components/DogLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ImagePlus,
  X,
  Check,
  ChevronsUpDown,
  Send,
  Info,
  Dog,
  EyeOff,
  Cat,
  ArrowLeft
} from 'lucide-react';
import { dogBreeds } from '@/data/dogBreeds';
import { catBreeds } from '@/data/catBreeds';
import { cn } from '@/lib/utils';

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
}

const CommunityAsk = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { fetchCategories, createQuestion, loading: submitting } = useCommunity();

  const [categories, setCategories] = useState<Category[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [animalType, setAnimalType] = useState<'dog' | 'cat'>('dog');
  const [urgency, setUrgency] = useState<'general' | 'concerned' | 'urgent'>('general');
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [breedTags, setBreedTags] = useState<string[]>([]);
  const [breedOpen, setBreedOpen] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const playWarningSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (!authLoading && user) {
      const loadData = async () => {
        try {
          const [cats, { data: petsData }] = await Promise.all([
            fetchCategories(),
            supabase
              .from('pets')
              .select('id, pet_name, pet_breed')
              .eq('owner_user_id', user.id)
          ]);
          setCategories(cats);
          setPets(petsData || []);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user, authLoading, navigate, fetchCategories]);

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
    
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    const newPhotos = [...photos, ...files].slice(0, 5);
    setPhotos(newPhotos);

    // Create preview URLs
    const newUrls = newPhotos.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return newUrls;
    });
  }, [photos]);

  const handlePhotoRemove = useCallback((index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);

    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  }, [photos, photoPreviewUrls]);

  const handleBreedSelect = useCallback((breed: string) => {
    if (!breedTags.includes(breed)) {
      setBreedTags(prev => [...prev, breed].slice(0, 3));
    }
    setBreedOpen(false);
  }, [breedTags]);

  const handleBreedRemove = useCallback((breed: string) => {
    setBreedTags(prev => prev.filter(b => b !== breed));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !categoryId) {
      return;
    }

    try {
      const question = await createQuestion(
        {
          title: title.trim(),
          content: content.trim(),
          category_id: categoryId,
          animal_type: animalType,
          urgency,
          breed_tags: breedTags,
          pet_id: selectedPetId || undefined,
          is_anonymous: isAnonymous
        },
        photos
      );

      navigate(`/community/question/${question.id}`);
    } catch (error) {
      console.error('Error creating question:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Ask the Community | Wooffy</title>
        <meta name="description" content="Ask a question to the Wooffy community of pet owners." />
      </Helmet>

      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header />
        
        <main className="w-full max-w-3xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))] box-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/community")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </Button>

          <Card className="mt-2">
            <CardHeader>
              <CardTitle className="text-2xl">Ask the Community</CardTitle>
              <CardDescription>
                Get help from fellow pet owners and verified professionals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Animal Type Selection */}
                <div className="space-y-2">
                  <Label>Is this about a dog or a cat? *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={animalType === 'dog' ? 'default' : 'outline'}
                      className={cn(
                        'h-auto py-4 flex flex-col gap-2',
                        animalType === 'dog' && 'ring-2 ring-primary ring-offset-2'
                      )}
                      onClick={() => {
                        setAnimalType('dog');
                        setBreedTags([]);
                      }}
                    >
                      <Dog className="w-6 h-6" />
                      <span className="font-medium">Dog</span>
                    </Button>
                    <Button
                      type="button"
                      variant={animalType === 'cat' ? 'default' : 'outline'}
                      className={cn(
                        'h-auto py-4 flex flex-col gap-2',
                        animalType === 'cat' && 'ring-2 ring-primary ring-offset-2'
                      )}
                      onClick={() => {
                        setAnimalType('cat');
                        setBreedTags([]);
                      }}
                    >
                      <Cat className="w-6 h-6" />
                      <span className="font-medium">Cat</span>
                    </Button>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Question Title *</Label>
                  <Input
                    id="title"
                    placeholder="E.g., My dog has swollen paws - what could it be?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={150}
                  />
                  <p className="text-xs text-muted-foreground">
                    {title.length}/150 characters
                  </p>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Details *</Label>
                  <Textarea
                    id="content"
                    placeholder="Describe your question in detail. Include when the issue started, any symptoms, what you've tried, etc."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>

                {/* Urgency */}
                <div className="space-y-2">
                  <Label>How urgent is this?</Label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <Button
                      type="button"
                      className={cn(
                        'flex flex-col h-auto py-2 sm:py-3 text-white',
                        urgency === 'general' 
                          ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-400 ring-offset-2' 
                          : 'bg-green-500 hover:bg-green-600'
                      )}
                      onClick={() => setUrgency('general')}
                    >
                      <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1" />
                      <span className="text-[10px] sm:text-xs font-medium">General</span>
                    </Button>
                    <Button
                      type="button"
                      className={cn(
                        'flex flex-col h-auto py-2 sm:py-3 text-white',
                        urgency === 'concerned' 
                          ? 'bg-yellow-500 hover:bg-yellow-600 ring-2 ring-yellow-400 ring-offset-2' 
                          : 'bg-yellow-500 hover:bg-yellow-600'
                      )}
                      onClick={() => setUrgency('concerned')}
                    >
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1" />
                      <span className="text-[10px] sm:text-xs font-medium">Concerned</span>
                    </Button>
                    <Button
                      type="button"
                      className={cn(
                        'flex flex-col h-auto py-2 sm:py-3 text-white',
                        urgency === 'urgent' 
                          ? 'bg-red-600 hover:bg-red-700 ring-2 ring-red-400 ring-offset-2' 
                          : 'bg-red-500 hover:bg-red-600'
                      )}
                      onClick={() => {
                        setUrgency('urgent');
                        playWarningSound();
                      }}
                    >
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1" />
                      <span className="text-[10px] sm:text-xs font-medium">Urgent</span>
                    </Button>
                  </div>
                  {urgency === 'urgent' && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>
                          <strong>For emergencies:</strong> Please contact your veterinarian immediately. 
                          Community advice cannot replace professional medical care.
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Pet Selection */}
                {pets.length > 0 && (
                  <div className="space-y-2">
                    <Label>Link to your pet (optional)</Label>
                    <Select 
                      value={selectedPetId} 
                      onValueChange={(val) => {
                        const newPetId = val === 'none' ? '' : val;
                        setSelectedPetId(newPetId);
                        
                        // Auto-fill breed tag when pet is selected
                        if (newPetId) {
                          const selectedPet = pets.find(p => p.id === newPetId);
                          if (selectedPet?.pet_breed && !breedTags.includes(selectedPet.pet_breed)) {
                            setBreedTags(prev => [...prev.slice(0, 2), selectedPet.pet_breed!]);
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a pet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No pet selected</SelectItem>
                        {pets.map(pet => (
                          <SelectItem key={pet.id} value={pet.id}>
                            <span className="flex items-center gap-2">
                              <Dog className="w-4 h-4" />
                              {pet.pet_name} {pet.pet_breed && `(${pet.pet_breed})`}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}


                {/* Photos */}
                <div className="space-y-2">
                  <Label>Photos (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Add up to 5 photos to help the community understand your question better
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Photo ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg"
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
                    
                    {photos.length < 5 && (
                      <label className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <ImagePlus className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Add Photo</span>
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
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Post anonymously</p>
                      <p className="text-sm text-muted-foreground">
                        Your name won't be shown to others
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={isAnonymous ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                  >
                    {isAnonymous ? 'On' : 'Off'}
                  </Button>
                </div>

                {/* Tips */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2 text-blue-800 dark:text-blue-200">
                    <Info className="w-4 h-4" />
                    Tips for getting helpful answers
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Be specific about when the issue started</li>
                    <li>Include your pet's age, breed, and any relevant health history</li>
                    <li>Describe what you've already tried</li>
                    <li>Add photos if they help illustrate the problem</li>
                  </ul>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/community')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!title.trim() || !content.trim() || !categoryId || submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>Posting...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Post Question
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default CommunityAsk;
