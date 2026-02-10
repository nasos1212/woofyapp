import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { ensureHttps } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AdoptionInquiryDialog from "@/components/AdoptionInquiryDialog";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import { 
  ArrowLeft, 
  Heart, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Facebook, 
  Instagram,
  Calendar,
  Dog,
  ExternalLink,
  PawPrint,
  MessageSquare
} from "lucide-react";

const ShelterProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedPet, setSelectedPet] = useState<{ id: string; name: string; shelter_id: string } | null>(null);
  const { trackShelterView } = useAnalyticsTracking();

  const { data: shelter, isLoading: shelterLoading } = useQuery({
    queryKey: ['shelter', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shelters')
        .select('*')
        .eq('id', id)
        .eq('verification_status', 'approved')
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Track shelter view
  useEffect(() => {
    if (shelter && id) {
      trackShelterView(id, shelter.shelter_name);
    }
  }, [shelter?.id, id, trackShelterView]);

  const { data: photos } = useQuery({
    queryKey: ['shelter-photos', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shelter_photos')
        .select('*')
        .eq('shelter_id', id)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: adoptablePets } = useQuery({
    queryKey: ['shelter-adoptable-pets-public', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shelter_adoptable_pets')
        .select('*')
        .eq('shelter_id', id)
        .eq('is_available', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch photos for all pets
  const { data: petPhotos } = useQuery({
    queryKey: ['shelter-adoptable-pet-photos-public', id],
    queryFn: async () => {
      if (!adoptablePets || adoptablePets.length === 0) return [];
      const petIds = adoptablePets.map(p => p.id);
      const { data, error } = await supabase
        .from('shelter_adoptable_pet_photos')
        .select('*')
        .in('pet_id', petIds)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!adoptablePets && adoptablePets.length > 0,
  });

  const getPetMainPhoto = (pet: { id: string; photo_url: string | null }) => {
    const photos = petPhotos?.filter(p => p.pet_id === pet.id) || [];
    return photos[0]?.photo_url || pet.photo_url;
  };

  if (shelterLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-64 md:h-80 bg-muted animate-pulse" />
        <div className="container max-w-4xl mx-auto px-4 -mt-16">
          <div className="bg-card rounded-xl p-6 shadow-lg">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-48 mb-6" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!shelter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Shelter Not Found</h1>
          <p className="text-muted-foreground mb-4">This shelter doesn't exist or is not yet approved.</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{shelter.shelter_name} | Wooffy</title>
        <meta name="description" content={shelter.description || `Support ${shelter.shelter_name} - a verified animal shelter partner of Wooffy.`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Cover Photo */}
        <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
          {shelter.cover_photo_url ? (
            <img 
              src={shelter.cover_photo_url} 
              alt={`${shelter.shelter_name} cover`}
              className="w-full h-[200%] object-cover absolute left-0"
              style={{ top: `${-(shelter.cover_photo_position ?? 50)}%` }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Dog className="h-24 w-24 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Back Button */}
          <Link 
            to="/" 
            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        {/* Main Content */}
        <div className="container max-w-4xl mx-auto px-4 -mt-20 relative z-10 pb-12">
          {/* Header Card */}
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-muted overflow-hidden border-4 border-background shadow-lg">
                    {shelter.logo_url ? (
                      <img 
                        src={shelter.logo_url} 
                        alt={shelter.shelter_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <Heart className="h-10 w-10 text-primary" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        {shelter.shelter_name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>{shelter.city || shelter.location}</span>
                        {shelter.years_operating && (
                          <>
                            <span>•</span>
                            <Calendar className="h-4 w-4" />
                            <span>{shelter.years_operating} years</span>
                          </>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Verified Wooffy Partner
                      </Badge>
                    </div>
                    
                    {shelter.donation_link && (
                      <Button asChild className="gap-2">
                        <a href={ensureHttps(shelter.donation_link)} target="_blank" rel="noopener noreferrer">
                          <Heart className="h-4 w-4" />
                          Donate Now
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 mt-4 pt-4 border-t">
                    {shelter.dogs_in_care && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{shelter.dogs_in_care}</div>
                        <div className="text-sm text-muted-foreground">Dogs in Care</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mission Statement */}
          {shelter.mission_statement && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Our Mission
                </h2>
                <p className="text-muted-foreground italic text-lg leading-relaxed">
                  "{shelter.mission_statement}"
                </p>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {shelter.description && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3">About Us</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {shelter.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pets Available for Adoption */}
          {adoptablePets && adoptablePets.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-primary" />
                  Pets Available for Adoption
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {adoptablePets.map((pet) => {
                    const mainPhoto = getPetMainPhoto(pet);
                    return (
                      <div 
                        key={pet.id} 
                        className="rounded-lg overflow-hidden bg-muted border group"
                      >
                        <div className="aspect-square relative">
                          {mainPhoto ? (
                            <img 
                              src={mainPhoto} 
                              alt={pet.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <PawPrint className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium">{pet.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {pet.pet_type}
                            </Badge>
                            {pet.breed && (
                              <Badge variant="outline" className="text-xs">
                                {pet.breed}
                              </Badge>
                            )}
                            {pet.age && (
                              <Badge variant="outline" className="text-xs">
                                {pet.age}
                              </Badge>
                            )}
                            {pet.gender && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {pet.gender}
                              </Badge>
                            )}
                          </div>
                          {pet.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {pet.description}
                            </p>
                          )}
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full mt-3 gap-2"
                            onClick={() => setSelectedPet({ id: pet.id, name: pet.name, shelter_id: pet.shelter_id })}
                          >
                            <MessageSquare className="h-4 w-4" />
                            Inquire About {pet.name}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo Gallery */}
          {photos && photos.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Photo Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div 
                      key={photo.id} 
                      className="aspect-square rounded-lg overflow-hidden bg-muted"
                    >
                      <img 
                        src={photo.photo_url} 
                        alt={photo.caption || 'Shelter photo'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {shelter.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Address</div>
                      <div className="text-muted-foreground">{shelter.address}</div>
                    </div>
                  </div>
                )}
                
                {shelter.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Phone</div>
                      <a href={`tel:${shelter.phone}`} className="text-primary hover:underline">
                        {shelter.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {shelter.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Email</div>
                      <a href={`mailto:${shelter.email}`} className="text-primary hover:underline">
                        {shelter.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {shelter.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Website</div>
                      <a 
                        href={ensureHttps(shelter.website)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {shelter.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {(shelter.facebook_url || shelter.instagram_url) && (
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  {shelter.facebook_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={ensureHttps(shelter.facebook_url)} target="_blank" rel="noopener noreferrer">
                        <Facebook className="h-4 w-4 mr-2" />
                        Facebook
                      </a>
                    </Button>
                  )}
                  {shelter.instagram_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={ensureHttps(shelter.instagram_url)} target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-4 w-4 mr-2" />
                        Instagram
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wooffy Donation Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              🐾 Wooffy donates 10% of membership fees to our verified shelter partners
            </p>
          </div>
        </div>
      </div>

      {/* Adoption Inquiry Dialog */}
      {selectedPet && (
        <AdoptionInquiryDialog
          open={!!selectedPet}
          onOpenChange={(open) => !open && setSelectedPet(null)}
          pet={selectedPet}
          shelterName={shelter.shelter_name}
        />
      )}
    </>
  );
};

export default ShelterProfile;
