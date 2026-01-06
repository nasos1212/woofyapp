import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity, Category } from '@/hooks/useCommunity';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
  Dog
} from 'lucide-react';
import { dogBreeds } from '@/data/dogBreeds';
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
  const [urgency, setUrgency] = useState<'general' | 'concerned' | 'urgent'>('general');
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [breedTags, setBreedTags] = useState<string[]>([]);
  const [breedOpen, setBreedOpen] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

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
    if (photos.length + files.length > 5) {
      alert('Maximum 5 photos allowed');
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
          urgency,
          breed_tags: breedTags,
          pet_id: selectedPetId || undefined
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
        <meta name="description" content="Ask a question to the Wooffy community of dog owners." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
          <Card className="mt-2">
            <CardHeader>
              <CardTitle className="text-2xl">Ask the Community</CardTitle>
              <CardDescription>
                Get help from fellow dog owners and verified professionals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      type="button"
                      variant={urgency === 'general' ? 'default' : 'outline'}
                      className={cn(
                        'flex flex-col h-auto py-3',
                        urgency === 'general' 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700'
                      )}
                      onClick={() => setUrgency('general')}
                    >
                      <HelpCircle className="w-5 h-5 mb-1" />
                      <span className="text-xs">General</span>
                    </Button>
                    <Button
                      type="button"
                      variant={urgency === 'concerned' ? 'default' : 'outline'}
                      className={cn(
                        'flex flex-col h-auto py-3',
                        urgency === 'concerned' 
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                          : 'border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700'
                      )}
                      onClick={() => setUrgency('concerned')}
                    >
                      <AlertTriangle className="w-5 h-5 mb-1" />
                      <span className="text-xs">Concerned</span>
                    </Button>
                    <Button
                      type="button"
                      variant={urgency === 'urgent' ? 'default' : 'outline'}
                      className={cn(
                        'flex flex-col h-auto py-3',
                        urgency === 'urgent' 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700'
                      )}
                      onClick={() => setUrgency('urgent')}
                    >
                      <AlertCircle className="w-5 h-5 mb-1" />
                      <span className="text-xs">Urgent</span>
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
                    <Select value={selectedPetId} onValueChange={(val) => setSelectedPetId(val === 'none' ? '' : val)}>
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

                {/* Breed Tags */}
                <div className="space-y-2">
                  <Label>Related breeds (optional)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {breedTags.map(breed => (
                      <Badge key={breed} variant="secondary" className="gap-1">
                        {breed}
                        <button
                          type="button"
                          onClick={() => handleBreedRemove(breed)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {breedTags.length < 3 && (
                    <Popover open={breedOpen} onOpenChange={setBreedOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className="justify-between"
                        >
                          Add breed tag
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search breeds..." />
                          <CommandList>
                            <CommandEmpty>No breed found.</CommandEmpty>
                            <CommandGroup>
                              {dogBreeds
                                .filter(breed => !breedTags.includes(breed))
                                .map(breed => (
                                  <CommandItem
                                    key={breed}
                                    value={breed}
                                    onSelect={() => handleBreedSelect(breed)}
                                  >
                                    {breed}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

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

                {/* Tips */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2 text-blue-800 dark:text-blue-200">
                    <Info className="w-4 h-4" />
                    Tips for getting helpful answers
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Be specific about when the issue started</li>
                    <li>Include your dog's age, breed, and any relevant health history</li>
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

        <Footer />
      </div>
    </>
  );
};

export default CommunityAsk;
