import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, ArrowLeft, Check, Clock, Globe, Mail, AlertTriangle } from "lucide-react";
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
import BusinessLocationManager, { BusinessLocation } from "@/components/BusinessLocationManager";
import { ensureHttps } from "@/lib/utils";

type BusinessCategory = Database["public"]["Enums"]["business_category"];

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

const PartnerRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading, signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };
  
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
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  
  // Primary location
  const [primaryLocation, setPrimaryLocation] = useState({
    city: "",
    address: "",
    phone: "",
    google_maps_url: "",
  });
  
  // Additional locations
  const [additionalLocations, setAdditionalLocations] = useState<BusinessLocation[]>([]);
  
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
      primaryLocation.city !== "" ||
      primaryLocation.address !== "" ||
      primaryLocation.phone !== "" ||
      primaryLocation.google_maps_url !== "" ||
      additionalLocations.length > 0 ||
      email !== "" ||
      website !== ""
    );
  }, [businessName, initialName, category, description, primaryLocation, additionalLocations, email, website]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=business");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkExistingBusinessAndEnsureRole = async () => {
      if (!user) return;
      
      // Check for existing business and ensure business role exists in parallel
      const [businessResult, roleResult] = await Promise.all([
        supabase
          .from("businesses")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "business")
          .maybeSingle()
      ]);
      
      // If user is on this page, they MUST have a business role
      // Insert it if missing (handles users who signed up before role logic was added)
      if (!roleResult.data) {
        await supabase
          .from("user_roles")
          .upsert(
            { user_id: user.id, role: "business" as const },
            { onConflict: "user_id,role" }
          );
      }
      
      if (businessResult.data) {
        setExistingBusiness(true);
        navigate("/business");
      } else {
        setExistingBusiness(false);
      }
    };
    
    checkExistingBusinessAndEnsureRole();
  }, [user, navigate]);

  // Combine all locations for display and storage
  const allLocations = [
    ...(primaryLocation.city ? [primaryLocation] : []),
    ...additionalLocations.filter(loc => loc.city),
  ];

  const handleSubmit = async () => {
    if (!user || !category || !primaryLocation.city) return;
    
    setIsSubmitting(true);
    
    try {
      // Collect all cities for the main business record
      const allCities = allLocations.map(loc => loc.city);
      
      // Create business with primary location info
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert({
          user_id: user.id,
          business_name: businessName,
          category: category as BusinessCategory,
          description,
          address: primaryLocation.address,
          city: allCities.join(", "),
          phone: primaryLocation.phone,
          email: email || user.email || "",
          website: website ? ensureHttps(website) : null,
          google_maps_url: primaryLocation.google_maps_url ? ensureHttps(primaryLocation.google_maps_url) : null,
        })
        .select()
        .single();
      
      if (businessError) throw businessError;
      
      // Insert all locations into business_locations table
      if (business && allLocations.length > 0) {
        const locationsToInsert = allLocations.map((loc, index) => ({
          business_id: business.id,
          city: loc.city,
          address: loc.address || null,
          phone: loc.phone || null,
          google_maps_url: loc.google_maps_url ? ensureHttps(loc.google_maps_url) : null,
          display_order: index,
        }));
        
        const { error: locationsError } = await supabase
          .from("business_locations")
          .insert(locationsToInsert);
        
        if (locationsError) {
          console.error("Error inserting locations:", locationsError);
          // Don't throw - business was created successfully
        }
      }
      
      // Ensure business role exists (upsert in case it wasn't added during signup)
      await supabase
        .from("user_roles")
        .upsert({
          user_id: user.id,
          role: "business" as const,
        }, { onConflict: 'user_id,role' });
      
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

  const handleBackClick = async () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (hasUnsavedChanges) {
      setPendingNavigation("/");
      setShowExitDialog(true);
    } else {
      // Sign out and redirect to home
      await signOut();
    }
  };

  const confirmNavigation = async () => {
    // Sign out and redirect to home
    await signOut();
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
          {step > 1 ? "Back to Business Info" : "Back to Home"}
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

                {/* Store Locations */}
                <div className="space-y-2">
                  <Label className="font-semibold">Store Locations *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add your store locations with their specific address and phone number.
                  </p>
                  <BusinessLocationManager
                    locations={additionalLocations}
                    onLocationsChange={setAdditionalLocations}
                    primaryLocation={primaryLocation}
                    onPrimaryLocationChange={setPrimaryLocation}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  variant="hero"
                  onClick={() => setStep(2)}
                  disabled={!businessName || !category || !primaryLocation.city}
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
                  </div>
                </div>

                {/* Locations Summary */}
                <div className="p-4 bg-muted/50 rounded-xl">
                  <h3 className="font-semibold text-foreground mb-3">Store Locations</h3>
                  <div className="space-y-3">
                    {allLocations.map((loc, index) => (
                      <div key={index} className="p-3 bg-background rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{loc.city}</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-7">
                          {loc.address && <div>📍 {loc.address}</div>}
                          {loc.phone && <div>📞 {loc.phone}</div>}
                          {loc.google_maps_url && <div>🗺️ Google Maps link added</div>}
                        </div>
                      </div>
                    ))}
                  </div>
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
