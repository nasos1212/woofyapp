import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Pause,
  Play,
  Tag,
  Percent,
  X,
  Check,
  AlertCircle,
  Clock,
  Calendar as CalendarIcon,
  ArrowLeft,
  Info,
} from "lucide-react";
import DogLoader from "@/components/DogLoader";
import BusinessMobileNav from "@/components/BusinessMobileNav";
import BusinessHeader from "@/components/BusinessHeader";
import PendingApprovalBanner from "@/components/PendingApprovalBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessVerification } from "@/hooks/useBusinessVerification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import { format } from "date-fns";

import { PetType } from "@/data/petBreeds";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  discount_value: number | null;
  discount_type: string;
  terms: string | null;
  is_active: boolean;
  redemption_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_limited_time: boolean;
  limited_time_label: string | null;
  max_redemptions: number | null;
  offer_type: 'per_member' | 'per_pet';
  redemption_scope: 'per_member' | 'per_pet';
  redemption_frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'unlimited';
  valid_days: number[] | null;
  valid_hours_start: string | null;
  valid_hours_end: string | null;
  pet_type: PetType | null;
}

const BusinessOfferManagement = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { isApproved, verificationStatus, loading: verificationLoading } = useBusinessVerification();
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_value: "",
    discount_type: "percentage",
    terms: "",
    valid_from: undefined as Date | undefined,
    valid_until: undefined as Date | undefined,
    is_limited_time: false,
    limited_time_label: "",
    max_redemptions: "",
    offer_type: "per_member" as 'per_member' | 'per_pet',
    redemption_scope: "per_member" as 'per_member' | 'per_pet' | 'unlimited',
    redemption_frequency: "one_time" as 'one_time' | 'daily' | 'weekly' | 'monthly' | 'unlimited',
    valid_days: [] as number[],
    valid_hours_start: "",
    valid_hours_end: "",
    pet_type: null as PetType | null,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=business");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user]);

  const fetchOffers = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Get business
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!business) {
        toast.error("No business found. Please register first.");
        navigate("/partner-register");
        return;
      }

      setBusinessId(business.id);

      // Get offers with redemption counts
      const { data: offersData, error } = await supabase
        .from("offers")
        .select("id, title, description, discount_value, discount_type, terms, is_active, valid_from, valid_until, is_limited_time, limited_time_label, max_redemptions, offer_type, redemption_scope, redemption_frequency, valid_days, valid_hours_start, valid_hours_end, pet_type")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get redemption counts
      const { data: redemptions } = await supabase
        .from("offer_redemptions")
        .select("offer_id")
        .eq("business_id", business.id);

      const redemptionCounts: Record<string, number> = {};
      redemptions?.forEach((r) => {
        redemptionCounts[r.offer_id] = (redemptionCounts[r.offer_id] || 0) + 1;
      });

      const transformedOffers: Offer[] = (offersData || []).map((offer) => {
        // Convert 'unlimited' scope to 'per_member' for backward compatibility
        let scope = offer.redemption_scope as 'per_member' | 'per_pet';
        if (offer.redemption_scope === 'unlimited') {
          scope = 'per_member';
        }
        return {
          ...offer,
          offer_type: (offer.offer_type as 'per_member' | 'per_pet') || 'per_member',
          redemption_scope: scope,
          redemption_frequency: (offer.redemption_frequency as 'one_time' | 'daily' | 'weekly' | 'monthly' | 'unlimited') || 'one_time',
          valid_days: offer.valid_days || null,
          valid_hours_start: offer.valid_hours_start || null,
          valid_hours_end: offer.valid_hours_end || null,
          redemption_count: redemptionCounts[offer.id] || 0,
          pet_type: (offer.pet_type === 'dog' || offer.pet_type === 'cat') ? offer.pet_type : null,
        };
      });

      setOffers(transformedOffers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Failed to load offers");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingOffer(null);
    setFormData({
      title: "",
      description: "",
      discount_value: "",
      discount_type: "percentage",
      terms: "",
      valid_from: undefined,
      valid_until: undefined,
      is_limited_time: false,
      limited_time_label: "",
      max_redemptions: "",
      offer_type: "per_member",
      redemption_scope: "per_member",
      redemption_frequency: "one_time",
      valid_days: [],
      valid_hours_start: "",
      valid_hours_end: "",
      pet_type: null,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description || "",
      discount_value: offer.discount_value?.toString() || "",
      discount_type: offer.discount_type,
      terms: offer.terms || "",
      valid_from: offer.valid_from ? new Date(offer.valid_from) : undefined,
      valid_until: offer.valid_until ? new Date(offer.valid_until) : undefined,
      is_limited_time: offer.is_limited_time || false,
      limited_time_label: offer.limited_time_label || "",
      max_redemptions: offer.max_redemptions?.toString() || "",
      offer_type: offer.offer_type || "per_member",
      redemption_scope: offer.redemption_scope || "per_member",
      redemption_frequency: offer.redemption_frequency || "one_time",
      valid_days: offer.valid_days || [],
      valid_hours_start: offer.valid_hours_start || "",
      valid_hours_end: offer.valid_hours_end || "",
      pet_type: offer.pet_type || null,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!businessId || !formData.title.trim()) {
      toast.error("Please fill in the required fields");
      return;
    }

    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      toast.error("Please enter a valid discount value");
      return;
    }

    if (formData.discount_type === "percentage" && parseFloat(formData.discount_value) > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    try {
      const offerData = {
        business_id: businessId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        discount_type: formData.discount_type,
        terms: formData.terms.trim() || null,
        valid_from: formData.valid_from ? formData.valid_from.toISOString() : null,
        valid_until: formData.valid_until ? formData.valid_until.toISOString() : null,
        is_limited_time: formData.is_limited_time,
        limited_time_label: formData.limited_time_label.trim() || null,
        max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions) : null,
        offer_type: formData.offer_type,
        redemption_scope: formData.redemption_scope,
        redemption_frequency: formData.redemption_frequency,
        valid_days: formData.valid_days.length > 0 ? formData.valid_days : null,
        valid_hours_start: formData.valid_hours_start || null,
        valid_hours_end: formData.valid_hours_end || null,
        pet_type: formData.pet_type,
      };

      if (editingOffer) {
        const { error } = await supabase
          .from("offers")
          .update(offerData)
          .eq("id", editingOffer.id);

        if (error) throw error;
        toast.success("Offer updated successfully");
      } else {
        const { error } = await supabase.from("offers").insert(offerData);

        if (error) throw error;
        toast.success("Offer created successfully");
      }

      setIsDialogOpen(false);
      fetchOffers();
    } catch (error) {
      console.error("Error saving offer:", error);
      toast.error("Failed to save offer");
    }
  };

  const toggleOfferStatus = async (offer: Offer) => {
    try {
      const { error } = await supabase
        .from("offers")
        .update({ is_active: !offer.is_active })
        .eq("id", offer.id);

      if (error) throw error;
      toast.success(offer.is_active ? "Offer paused" : "Offer activated");
      fetchOffers();
    } catch (error) {
      console.error("Error toggling offer:", error);
      toast.error("Failed to update offer");
    }
  };

  const deleteOffer = async () => {
    if (!deleteOfferId) return;

    try {
      const { error } = await supabase.from("offers").delete().eq("id", deleteOfferId);

      if (error) throw error;
      toast.success("Offer deleted");
      setDeleteOfferId(null);
      fetchOffers();
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast.error("Failed to delete offer");
    }
  };

  if (loading || isLoading || verificationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Offers | Wooffy Business</title>
        <meta name="description" content="Create and manage your Wooffy partner offers." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <BusinessHeader />

        <main className="container mx-auto px-4 py-8 pt-24 md:pt-28 max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/business")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {/* Pending Approval Banner */}
          <PendingApprovalBanner status={verificationStatus} />

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Manage Offers
              </h1>
              <p className="text-slate-500">
                Create, edit, and manage your discount offers for Wooffy members
              </p>
            </div>
            <Button onClick={openCreateDialog} className="gap-2 w-fit" disabled={!isApproved}>
              <Plus className="w-4 h-4" />
              Create Offer
            </Button>
          </div>

          {/* Pending Notice for non-approved */}
          {!isApproved && (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">Offer Management Unavailable</h3>
              <p className="text-slate-500">
                You'll be able to create and manage offers once your business is approved.
              </p>
            </div>
          )}

          {/* Offers List - Only show when approved */}
          {isApproved && offers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
              <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">No offers yet</h3>
              <p className="text-slate-500 mb-6">
                Create your first offer to start attracting Wooffy members
              </p>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Offer
              </Button>
            </div>
          ) : isApproved && (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${
                    offer.is_active ? "border-slate-200" : "border-amber-200 bg-amber-50/30"
                  }`}
                >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-display font-semibold text-slate-900 text-sm sm:text-base">
                          {offer.title}
                        </h3>
                        {!offer.is_active && (
                          <span className="text-[10px] sm:text-xs bg-amber-100 text-amber-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1">
                            <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            Paused
                          </span>
                        )}
                      </div>
                      {offer.description && (
                        <p className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3 line-clamp-2">{offer.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="flex items-center gap-1 text-primary font-medium">
                          {offer.discount_type === "percentage" ? (
                            <>{offer.discount_value}% off</>
                          ) : (
                            <>€{offer.discount_value} off</>
                          )}
                        </span>
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                          offer.redemption_scope === 'per_pet' 
                            ? 'bg-teal-100 text-teal-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {offer.redemption_scope === 'per_pet' ? '🐾 Per Pet' : '👤 Per Member'}
                        </span>
                        {offer.pet_type && (
                          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                            offer.pet_type === 'dog' 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {offer.pet_type === 'dog' ? '🐕 Dogs' : '🐱 Cats'}
                          </span>
                        )}
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                          offer.redemption_frequency === 'unlimited' 
                            ? 'bg-green-100 text-green-700' 
                            : offer.redemption_frequency === 'one_time'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}>
                          {offer.redemption_frequency === 'one_time' ? '1x' : 
                           offer.redemption_frequency === 'daily' ? '📅 Daily' :
                           offer.redemption_frequency === 'weekly' ? '📆 Weekly' :
                           offer.redemption_frequency === 'monthly' ? '🗓️ Monthly' : '♾️ Anytime'}
                        </span>
                        <span className="text-slate-500">
                          {offer.redemption_count}{offer.max_redemptions ? `/${offer.max_redemptions}` : ''} redemption{offer.redemption_count !== 1 ? "s" : ""}
                        </span>
                        {offer.max_redemptions && offer.redemption_count >= offer.max_redemptions && (
                          <span className="text-[10px] sm:text-xs bg-red-100 text-red-700 px-1.5 sm:px-2 py-0.5 rounded-full">
                            Limit reached
                          </span>
                        )}
                      </div>
                      {offer.terms && (
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2 truncate">Terms: {offer.terms}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => toggleOfferStatus(offer)}
                        title={offer.is_active ? "Pause offer" : "Activate offer"}
                      >
                        {offer.is_active ? (
                          <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                        ) : (
                          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => openEditDialog(offer)}
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => setDeleteOfferId(offer.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] md:max-h-[90vh] flex flex-col overflow-hidden w-[95vw] sm:w-full">
          <DialogHeader className="flex-shrink-0 pb-2">
            <DialogTitle>
              {editingOffer ? "Edit Offer" : "Create New Offer"}
            </DialogTitle>
            <DialogDescription>
              {editingOffer
                ? "Update your offer details"
                : "Fill in the details to create a new offer for Wooffy members"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0 px-1 -mx-1">
            <div className="space-y-2">
              <Label htmlFor="title">Offer Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="e.g., First Grooming Free"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="text-base"
              />
              {!formData.title.trim() && (
                <p className="text-xs text-destructive">Title is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what's included in this offer..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_value">Discount Value <span className="text-destructive">*</span></Label>
                <Input
                  id="discount_value"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  step="any"
                  placeholder="e.g., 15"
                  value={formData.discount_value}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numbers and decimal point
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setFormData({ ...formData, discount_value: value });
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent non-numeric input
                    if (['e', 'E', '+', '-'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  required
                />
                {(!formData.discount_value || parseFloat(formData.discount_value) <= 0) ? (
                  <p className="text-xs text-destructive">Please enter a valid discount value</p>
                ) : formData.discount_type === "percentage" && parseFloat(formData.discount_value) > 100 ? (
                  <p className="text-xs text-destructive">Percentage cannot exceed 100%</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_type">Discount Type</Label>
                <select
                  id="discount_type"
                  value={formData.discount_type}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (€)</option>
                </select>
              </div>
            </div>

            {/* Pet Type Filter */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                🐾 Pet Type (Optional)
              </h4>
              <div className="space-y-2">
                <Label htmlFor="pet_type">Which pets is this offer for?</Label>
                <select
                  id="pet_type"
                  value={formData.pet_type || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, pet_type: e.target.value === "" ? null : e.target.value as PetType })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Pets (Dogs & Cats)</option>
                  <option value="dog">🐕 Dogs Only</option>
                  <option value="cat">🐱 Cats Only</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {formData.pet_type === 'dog' 
                    ? '🐕 Only visible to members with dogs' 
                    : formData.pet_type === 'cat'
                      ? '🐱 Only visible to members with cats'
                      : '🐾 Visible to all pet owners'}
                </p>
              </div>
            </div>


            {/* Redemption Settings */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Redemption Rules
                </h4>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 text-xs" align="start">
                    <p className="font-medium mb-2">Examples:</p>
                    <ul className="space-y-1.5 text-muted-foreground">
                      <li><span className="text-foreground">Per Pet + Monthly</span> → "20% off grooming" - each pet once/month</li>
                      <li><span className="text-foreground">Per Member + One-time</span> → "Free first visit" - member uses once ever</li>
                      <li><span className="text-foreground">Per Member + Unlimited</span> → "10% on treats" - use anytime, no limits</li>
                      <li><span className="text-foreground">Per Pet + One-time</span> → "First grooming free" - each pet uses once</li>
                    </ul>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-4">
                {/* Redemption Scope */}
                <div className="space-y-2">
                  <Label htmlFor="redemption_scope">Who can redeem?</Label>
                  <select
                    id="redemption_scope"
                    value={formData.redemption_scope}
                    onChange={(e) =>
                      setFormData({ ...formData, redemption_scope: e.target.value as 'per_member' | 'per_pet' })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="per_member">Per Member</option>
                    <option value="per_pet">Per Pet</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {formData.redemption_scope === 'per_pet' 
                      ? '🐕 Each pet on the membership can redeem (e.g., grooming)' 
                      : '👤 Track redemptions per membership'}
                  </p>
                </div>

                {/* Redemption Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="redemption_frequency">How often can they redeem?</Label>
                  <select
                    id="redemption_frequency"
                    value={formData.redemption_frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, redemption_frequency: e.target.value as 'one_time' | 'daily' | 'weekly' | 'monthly' | 'unlimited' })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="one_time">One-time only</option>
                    <option value="daily">Daily (resets each day)</option>
                    <option value="weekly">Weekly (resets each week)</option>
                    <option value="monthly">Monthly (resets each month)</option>
                    <option value="unlimited">Unlimited (no frequency limit)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {formData.redemption_frequency === 'one_time' 
                      ? '1️⃣ Can only be used once ever' 
                      : formData.redemption_frequency === 'daily'
                        ? '📅 Resets every day at midnight'
                        : formData.redemption_frequency === 'weekly'
                          ? '📆 Resets every Monday'
                          : formData.redemption_frequency === 'monthly'
                            ? '🗓️ Resets on the 1st of each month'
                            : '♾️ Can be used as many times as they want'}
                  </p>
                </div>

                {/* Example summary */}
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-foreground mb-1">Example:</p>
                  <p className="text-muted-foreground">
                    {formData.redemption_scope === 'per_pet' && formData.redemption_frequency === 'monthly'
                      ? '"20% grooming" → Each pet can use once per month'
                      : formData.redemption_scope === 'unlimited' && formData.redemption_frequency === 'unlimited'
                        ? '"10% on treats" → Anyone can use anytime, no limits'
                        : formData.redemption_scope === 'per_member' && formData.redemption_frequency === 'one_time'
                          ? '"Free first visit" → Member uses once ever'
                          : formData.redemption_scope === 'per_pet' && formData.redemption_frequency === 'one_time'
                            ? '"First grooming free" → Each pet uses once ever'
                            : `${formData.redemption_scope === 'per_pet' ? 'Each pet' : formData.redemption_scope === 'per_member' ? 'Each member' : 'Anyone'} can redeem ${formData.redemption_frequency === 'unlimited' ? 'unlimited times' : formData.redemption_frequency.replace('_', ' ')}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Time-sensitive options */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Restrictions (Optional)
              </h4>
              
              <div className="space-y-4">
                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.valid_from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.valid_from ? format(formData.valid_from, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.valid_from}
                          onSelect={(date) => setFormData({ ...formData, valid_from: date })}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.valid_until && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.valid_until ? format(formData.valid_until, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.valid_until}
                          onSelect={(date) => setFormData({ ...formData, valid_until: date })}
                          disabled={(date) => formData.valid_from ? date < formData.valid_from : false}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {(formData.valid_from || formData.valid_until) && (
                  <p className="text-xs text-muted-foreground">
                    📅 {formData.valid_from && formData.valid_until 
                      ? `Valid from ${format(formData.valid_from, "MMM d, yyyy")} to ${format(formData.valid_until, "MMM d, yyyy")}`
                      : formData.valid_from 
                        ? `Starts ${format(formData.valid_from, "MMM d, yyyy")}`
                        : `Ends ${format(formData.valid_until!, "MMM d, yyyy")}`}
                  </p>
                )}

                {/* Valid Days */}
                <div className="space-y-2">
                  <Label>Valid Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const newDays = formData.valid_days.includes(index)
                            ? formData.valid_days.filter(d => d !== index)
                            : [...formData.valid_days, index];
                          setFormData({ ...formData, valid_days: newDays });
                        }}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          formData.valid_days.includes(index)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-input hover:bg-muted'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.valid_days.length === 0 
                      ? 'Valid all days (leave empty)' 
                      : `Valid on: ${formData.valid_days.sort().map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="w-full sm:w-auto"
              disabled={
                !formData.title.trim() || 
                !formData.discount_value || 
                parseFloat(formData.discount_value) <= 0 ||
                (formData.discount_type === "percentage" && parseFloat(formData.discount_value) > 100)
              }
            >
              {editingOffer ? "Save Changes" : "Create Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOfferId} onOpenChange={() => setDeleteOfferId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this offer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The offer will be permanently deleted and
              members will no longer be able to redeem it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteOffer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="pb-20 md:pb-0" />
      <BusinessMobileNav />
    </>
  );
};

export default BusinessOfferManagement;
