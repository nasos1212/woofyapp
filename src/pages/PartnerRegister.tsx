import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, ArrowLeft, Plus, Trash2, Check, Clock, MapPin, Phone, Globe, Mail, Map, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BusinessCategory = Database["public"]["Enums"]["business_category"];

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: string;
  terms: string;
}

const categories: { value: BusinessCategory; label: string }[] = [
  { value: "trainer", label: "Dog Trainer" },
  { value: "pet_shop", label: "Pet Shop" },
  { value: "hotel", label: "Pet Hotel / Boarding" },
  { value: "grooming", label: "Grooming Salon" },
  { value: "vet", label: "Veterinary Clinic" },
  { value: "daycare", label: "Doggy Daycare" },
  { value: "food", label: "Pet Food Supplier" },
  { value: "accessories", label: "Pet Accessories" },
  { value: "other", label: "Other" },
];

const discountTypes = [
  { value: "percentage", label: "Percentage Off" },
  { value: "fixed", label: "Fixed Amount Off" },
  { value: "free_item", label: "Free Item" },
  { value: "free_session", label: "Free Session" },
];

const PartnerRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingBusiness, setExistingBusiness] = useState<boolean | null>(null);
  
  // Business info - pre-fill from URL param if available
  const [businessName, setBusinessName] = useState(() => {
    const nameFromUrl = searchParams.get("name");
    return nameFromUrl || "";
  });
  const [category, setCategory] = useState<BusinessCategory | "">("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  
  // Offers (optional)
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showOffers, setShowOffers] = useState(false);
  
  // Navigation confirmation
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // Track if form has unsaved changes
  const initialName = useMemo(() => searchParams.get("name") || "", [searchParams]);
  const hasUnsavedChanges = useMemo(() => {
    return (
      businessName !== initialName ||
      category !== "" ||
      description !== "" ||
      address !== "" ||
      city !== "" ||
      phone !== "" ||
      email !== "" ||
      website !== "" ||
      googleMapsUrl !== "" ||
      offers.some(o => o.title || o.description || o.discountValue || o.terms)
    );
  }, [businessName, initialName, category, description, address, city, phone, email, website, googleMapsUrl, offers]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=business");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkExistingBusiness = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setExistingBusiness(true);
        navigate("/business");
      } else {
        setExistingBusiness(false);
      }
    };
    
    checkExistingBusiness();
  }, [user, navigate]);

  const addOffer = () => {
    setOffers([
      ...offers,
      { id: Date.now().toString(), title: "", description: "", discountType: "percentage", discountValue: "", terms: "" }
    ]);
  };

  const updateOffer = (id: string, field: keyof Offer, value: string) => {
    setOffers(offers.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const handleSubmit = async () => {
    if (!user || !category) return;
    
    setIsSubmitting(true);
    
    try {
      // Create business
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert({
          user_id: user.id,
          business_name: businessName,
          category: category as BusinessCategory,
          description,
          address,
          city,
          phone,
          email: email || user.email || "",
          website,
          google_maps_url: googleMapsUrl || null,
        })
        .select()
        .single();
      
      if (businessError) throw businessError;
      
      // Add business role
      await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "business" as const,
        });
      
      // Create offers - only include offers with both title and discount value
      const validOffers = offers.filter(o => o.title.trim() && o.discountValue && parseFloat(o.discountValue) > 0);
      if (validOffers.length > 0) {
        const { error: offersError } = await supabase
          .from("offers")
          .insert(
            validOffers.map(o => ({
              business_id: business.id,
              title: o.title,
              description: o.description,
              discount_type: o.discountType,
              discount_value: parseFloat(o.discountValue),
              terms: o.terms,
            }))
          );
        
        if (offersError) throw offersError;
      }
      
      toast({
        title: "Application Submitted!",
        description: "Your partner application is now under review. We'll notify you once approved.",
      });
      
      navigate("/business");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || existingBusiness === null) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleBackClick = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (hasUnsavedChanges) {
      setPendingNavigation("/auth?type=business");
      setShowExitDialog(true);
    } else {
      navigate("/auth?type=business");
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setShowExitDialog(false);
    setPendingNavigation(null);
  };

  return (
    <div className="min-h-screen bg-gradient-warm py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Exit Confirmation Dialog */}
        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Unsaved Changes
              </AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved business information. If you leave now, your progress will be lost. Are you sure you want to exit?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingNavigation(null)}>
                Continue Editing
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmNavigation}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Leave Without Saving
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {step > 1 ? "Back to Business Info" : "Back to Login"}
        </Button>

        {/* Progress - simplified to 2 steps */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {step > 1 ? <Check className="w-4 h-4" /> : "1"}
            </div>
            <span className="font-medium hidden sm:inline">Business Info</span>
          </div>
          <div className="flex-1 h-1 bg-muted rounded">
            <div className={`h-full bg-primary rounded transition-all ${step >= 2 ? "w-full" : "w-0"}`} />
          </div>
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              2
            </div>
            <span className="font-medium hidden sm:inline">Review</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 md:p-8">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Business Information</h1>
                  <p className="text-muted-foreground">Tell us about your business</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Your Business Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as BusinessCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your business category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell pet owners about your services..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="address"
                        placeholder="Street address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="+353 1 234 5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@business.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="website"
                      placeholder="https://www.yourbusiness.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleMapsUrl">Google Maps Link (optional)</Label>
                  <div className="relative">
                    <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="googleMapsUrl"
                      placeholder="https://maps.google.com/..."
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste your Google Maps share link so customers can find you easily
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  variant="hero"
                  onClick={() => setStep(2)}
                  disabled={!businessName || !category}
                >
                  Review & Submit
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Review & Submit</h1>
                  <p className="text-muted-foreground">Confirm your partner application</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Business Summary */}
                <div className="p-4 bg-muted/50 rounded-xl">
                  <h3 className="font-semibold text-foreground mb-3">Business Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{categories.find(c => c.value === category)?.label}</span>
                    </div>
                    {city && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">{city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Offers Section */}
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">Special Offers (Optional)</h3>
                    {!showOffers && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowOffers(true);
                          if (offers.length === 0) {
                            setOffers([{ id: "1", title: "", description: "", discountType: "percentage", discountValue: "", terms: "" }]);
                          }
                        }}
                        className="gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Offers
                      </Button>
                    )}
                  </div>
                  
                  {!showOffers ? (
                    <p className="text-sm text-muted-foreground">
                      You can add special offers for Wooffy members now or later from your dashboard.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {offers.map((offer, index) => (
                        <div key={offer.id} className="p-3 bg-background rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Offer {index + 1}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newOffers = offers.filter(o => o.id !== offer.id);
                                setOffers(newOffers);
                                if (newOffers.length === 0) {
                                  setShowOffers(false);
                                }
                              }}
                              className="text-destructive hover:text-destructive h-6 w-6 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs">Offer Title</Label>
                            <Input
                              placeholder="e.g., 15% off all grooming services"
                              value={offer.title}
                              onChange={(e) => updateOffer(offer.id, "title", e.target.value)}
                              className="h-9"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Discount Type</Label>
                              <Select
                                value={offer.discountType}
                                onValueChange={(v) => updateOffer(offer.id, "discountType", v)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {discountTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Value {offer.discountType === "percentage" ? "(%)" : "(€)"}</Label>
                              <Input
                                type="number"
                                placeholder={offer.discountType === "percentage" ? "15" : "10"}
                                value={offer.discountValue}
                                onChange={(e) => updateOffer(offer.id, "discountValue", e.target.value)}
                                className="h-9"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs">Terms (optional)</Label>
                            <Input
                              placeholder="e.g., Valid once per month"
                              value={offer.terms}
                              onChange={(e) => updateOffer(offer.id, "terms", e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addOffer}
                        className="w-full gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Another Offer
                      </Button>
                    </div>
                  )}
                </div>

                {/* Verification Notice */}
                <div className="p-4 bg-paw-peach rounded-xl flex gap-3">
                  <Clock className="w-5 h-5 text-paw-orange flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Verification Required</p>
                    <p className="text-sm text-muted-foreground">
                      Your application will be reviewed by our team within 2-3 business days. 
                      You'll receive an email once approved.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="hero"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerRegister;
