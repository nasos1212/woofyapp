import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Phone, MapPin, Globe, Star, Clock, Tag, Send, Pencil, ArrowLeft } from "lucide-react";
import { ensureHttps } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BusinessEditDialog } from "@/components/BusinessEditDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import DogLoader from "@/components/DogLoader";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";

interface Business {
  id: string;
  user_id?: string; // Only available for owners
  business_name: string;
  description: string | null;
  category: string;
  phone?: string | null; // Only available for owners
  email?: string; // Only available for owners
  address: string | null;
  city: string | null;
  website: string | null;
  logo_url: string | null;
  google_maps_url: string | null;
}

interface Offer {
  id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number | null;
  terms: string | null;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_name?: string;
}

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
}

interface BusinessLocation {
  id: string;
  city: string;
  address: string | null;
  phone: string | null;
  google_maps_url: string | null;
}

interface BusinessHour {
  id: string;
  day_of_week: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

const categoryLabels: Record<string, string> = {
  trainer: "Dog Trainer",
  pet_shop: "Pet Shop",
  hotel: "Pet Hotel",
  grooming: "Grooming",
  vet: "Veterinary",
  daycare: "Daycare",
  physio: "Physiotherapy",
  accessories: "Accessories",
  food: "Food & Treats",
  other: "Other"
};

export default function BusinessProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { trackBusinessView } = useAnalyticsTracking();
  const [business, setBusiness] = useState<Business | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Check if in preview mode (business owner viewing as member)
  const isPreviewMode = searchParams.get("preview") === "true";
  const isOwner = user && business?.user_id === user.id;
  // In preview mode, hide all owner-specific actions
  const showOwnerActions = isOwner && !isPreviewMode;

  // Track business view when data is loaded
  useEffect(() => {
    if (business && id && !isOwner) {
      trackBusinessView(id, business.business_name);
    }
  }, [business, id, isOwner, trackBusinessView]);

  useEffect(() => {
    if (id) {
      fetchBusinessData();
    }
  }, [id, user]);

  const fetchBusinessData = async () => {
    try {
      // First try to fetch from businesses_public view (safe for public access)
      // This excludes sensitive data like email, phone, user_id
      let businessData: Business | null = null;
      
      // If user is logged in, check if they're the owner or admin first
      if (user) {
        // Check if owner
        const { data: ownerCheck } = await supabase
          .from("businesses")
          .select("id, user_id, business_name, description, category, phone, email, address, city, website, logo_url, google_maps_url")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (ownerCheck) {
          businessData = ownerCheck;
        } else {
          // Check if admin - admins can view all businesses including pending
          const { data: isAdmin } = await supabase.rpc("has_role", {
            _user_id: user.id,
            _role: "admin",
          });
          
          if (isAdmin) {
            const { data: adminCheck } = await supabase
              .from("businesses")
              .select("id, user_id, business_name, description, category, phone, email, address, city, website, logo_url, google_maps_url")
              .eq("id", id)
              .maybeSingle();
            
            if (adminCheck) {
              businessData = adminCheck;
            }
          }
        }
      }
      
      // If not owner/admin or not logged in, use the public view
      if (!businessData) {
        const { data: publicData, error: publicError } = await supabase
          .from("businesses_public")
          .select("*")
          .eq("id", id)
          .single();
        
        if (publicError) throw publicError;
        businessData = publicData;
      }
      
      setBusiness(businessData);

      // Fetch active offers
      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .eq("business_id", id)
        .eq("is_active", true);

      setOffers(offersData || []);

      // Fetch reviews with user profiles
      const { data: reviewsData } = await supabase
        .from("business_reviews")
        .select("*")
        .eq("business_id", id)
        .order("created_at", { ascending: false });

      if (reviewsData) {
        // Get user profiles for reviews
        const userIds = reviewsData.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        const reviewsWithNames = reviewsData.map(review => ({
          ...review,
          user_name: profileMap.get(review.user_id) || "Anonymous"
        }));
        
        setReviews(reviewsWithNames);

        // Check if current user has a review
        if (user) {
          const userExistingReview = reviewsData.find(r => r.user_id === user.id);
          if (userExistingReview) {
            setExistingReview(userExistingReview);
            setUserRating(userExistingReview.rating);
            setUserReview(userExistingReview.review_text || "");
          }
        }
      }

      // Fetch photos
      const { data: photosData } = await supabase
        .from("business_photos")
        .select("*")
        .eq("business_id", id)
        .order("display_order", { ascending: true });

      setPhotos(photosData || []);

      // Fetch locations
      const { data: locationsData } = await supabase
        .from("business_locations")
        .select("*")
        .eq("business_id", id)
        .order("display_order", { ascending: true });

      setLocations(locationsData || []);

      // Fetch business hours
      const { data: hoursData } = await supabase
        .from("business_hours")
        .select("*")
        .eq("business_id", id)
        .order("day_of_week", { ascending: true });

      setBusinessHours(hoursData || []);

    } catch (error) {
      console.error("Error fetching business:", error);
      toast.error("Failed to load business profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please log in to leave a review");
      return;
    }

    if (userRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from("business_reviews")
          .update({
            rating: userRating,
            review_text: userReview || null
          })
          .eq("id", existingReview.id);

        if (error) throw error;
        toast.success("Review updated!");
      } else {
        // Create new review
        const { error } = await supabase
          .from("business_reviews")
          .insert({
            business_id: id,
            user_id: user.id,
            rating: userRating,
            review_text: userReview || null
          });

        if (error) throw error;
        toast.success("Review submitted!");
      }

      fetchBusinessData();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDiscount = (offer: Offer) => {
    if (offer.discount_type === "percentage") {
      return `${offer.discount_value}% OFF`;
    } else if (offer.discount_type === "fixed") {
      return `$${offer.discount_value} OFF`;
    }
    return offer.discount_type;
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Business not found</h2>
          <button 
            onClick={() => navigate(-1)} 
            className="text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{business.business_name} | Wooffy Partner</title>
        <meta name="description" content={business.description || `${business.business_name} - Wooffy partner business`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Preview Mode Banner */}
        {isPreviewMode && (
          <div className="bg-primary text-primary-foreground py-3 px-4 text-center">
            <p className="text-sm font-medium">
              👁️ Preview Mode — This is how members see your profile
            </p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-2"
              onClick={() => navigate("/business")}
            >
              Exit Preview
            </Button>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-8">
          {!isPreviewMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          )}

          {/* Breadcrumbs - hidden in preview mode */}
          {!isPreviewMode && (
            <Breadcrumbs 
              items={[
                { label: "Businesses", href: "/member/offers" },
                { label: business.business_name }
              ]} 
            />
          )}

          {/* Business Header */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Logo */}
              <div className="w-24 h-24 bg-muted rounded-xl flex items-center justify-center shrink-0">
                {business.logo_url ? (
                  <img 
                    src={business.logo_url} 
                    alt={business.business_name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">
                    {business.business_name.charAt(0)}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">
                      {business.business_name}
                    </h1>
                    <Badge variant="secondary" className="mb-3">
                      {categoryLabels[business.category] || business.category}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Edit button for owner - hidden in preview mode */}
                    {showOwnerActions && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditDialog(true)}
                        className="gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit Profile
                      </Button>
                    )}
                  
                    {/* Rating */}
                    {reviews.length > 0 && (
                      <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span className="font-semibold text-foreground">
                          {averageRating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({reviews.length} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {business.description && (
                  <p className="text-muted-foreground mb-4">{business.description}</p>
                )}

                {/* Contact Info */}
                <div className="flex flex-wrap gap-3">
                  {business.phone && (
                    <a
                      href={`tel:${business.phone}`}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      <Phone className="w-4 h-4" />
                      Call Now
                    </a>
                  )}
                  
                  {business.google_maps_url && (
                    <a
                      href={business.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
                    >
                      <MapPin className="w-4 h-4" />
                      Get Directions
                    </a>
                  )}
                  
                  {business.website && (
                    <a
                      href={ensureHttps(business.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                </div>

                {/* Primary Address */}
                {(business.address || business.city) && locations.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[business.address, business.city].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Store Locations */}
          {locations.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Store Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {locations.map((location) => (
                    <div 
                      key={location.id}
                      className="p-4 bg-muted/50 rounded-xl border border-border"
                    >
                      <h3 className="font-semibold text-foreground mb-2">{location.city}</h3>
                      
                      {location.address && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {location.address}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {location.phone && (
                          <a
                            href={`tel:${location.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {location.phone}
                          </a>
                        )}
                        
                        {location.google_maps_url && (
                          <a
                            href={location.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Directions
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photos Gallery */}
          {photos.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo) => (
                    <div 
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden bg-muted"
                    >
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || "Business photo"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Offers */}
          {offers.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Available Offers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {offers.map((offer) => (
                    <div 
                      key={offer.id}
                      className="p-4 bg-primary/5 rounded-xl border border-primary/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{offer.title}</h3>
                          {offer.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {offer.description}
                            </p>
                          )}
                          {offer.terms && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {offer.terms}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-primary text-primary-foreground shrink-0">
                          {formatDiscount(offer)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5" />
                Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Write Review - hidden for business owners (including preview mode) */}
              {user && !isOwner && (
                <div className="mb-6 p-4 bg-muted/50 rounded-xl">
                  <h4 className="font-medium text-foreground mb-3">
                    {existingReview ? "Update your review" : "Write a review"}
                  </h4>
                  
                  {/* Star Rating */}
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setUserRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= userRating
                              ? "text-primary fill-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Share your experience..."
                    value={userReview}
                    onChange={(e) => setUserReview(e.target.value)}
                    className="mb-3"
                    rows={3}
                  />

                  <Button 
                    onClick={handleSubmitReview}
                    disabled={submitting || userRating === 0}
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {existingReview ? "Update Review" : "Submit Review"}
                  </Button>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {review.user_name?.charAt(0) || "A"}
                            </span>
                          </div>
                          <span className="font-medium text-foreground text-sm">
                            {review.user_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= review.rating
                                  ? "text-primary fill-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-muted-foreground pl-10">
                          {review.review_text}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground pl-10 mt-1">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No reviews yet. Be the first to review!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {businessHours.length > 0 ? (
                <div className="space-y-2">
                  {[
                    { value: 0, label: "Sunday" },
                    { value: 1, label: "Monday" },
                    { value: 2, label: "Tuesday" },
                    { value: 3, label: "Wednesday" },
                    { value: 4, label: "Thursday" },
                    { value: 5, label: "Friday" },
                    { value: 6, label: "Saturday" },
                  ].map((day) => {
                    const hours = businessHours.find((h) => h.day_of_week === day.value);
                    const today = new Date().getDay();
                    const isToday = day.value === today;
                    
                    return (
                      <div
                        key={day.value}
                        className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                          isToday ? "bg-primary/10 font-medium" : ""
                        }`}
                      >
                        <span className={`text-sm ${isToday ? "text-primary" : "text-foreground"}`}>
                          {day.label}
                          {isToday && <span className="ml-2 text-xs">(Today)</span>}
                        </span>
                        <span className={`text-sm ${hours?.is_closed ? "text-muted-foreground" : isToday ? "text-primary" : "text-foreground"}`}>
                          {!hours ? (
                            "—"
                          ) : hours.is_closed ? (
                            "Closed"
                          ) : (
                            `${hours.open_time?.slice(0, 5)} - ${hours.close_time?.slice(0, 5)}`
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Contact the business directly for their current operating hours.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog - only when not in preview mode */}
      {business && showOwnerActions && (
        <BusinessEditDialog
          business={business}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={fetchBusinessData}
        />
      )}
    </>
  );
}
