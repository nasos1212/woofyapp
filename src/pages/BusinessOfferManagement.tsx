import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
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
  Calendar,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import DogLoader from "@/components/DogLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
}

const BusinessOfferManagement = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
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
    valid_until: "",
    is_limited_time: false,
    limited_time_label: "",
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
        .select("id, title, description, discount_value, discount_type, terms, is_active, valid_from, valid_until, is_limited_time, limited_time_label")
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

      const transformedOffers = (offersData || []).map((offer) => ({
        ...offer,
        redemption_count: redemptionCounts[offer.id] || 0,
      }));

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
      valid_until: "",
      is_limited_time: false,
      limited_time_label: "",
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
      valid_until: offer.valid_until ? offer.valid_until.split('T')[0] : "",
      is_limited_time: offer.is_limited_time || false,
      limited_time_label: offer.limited_time_label || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!businessId || !formData.title.trim()) {
      toast.error("Please fill in the required fields");
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
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        is_limited_time: formData.is_limited_time,
        limited_time_label: formData.limited_time_label.trim() || null,
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Offers | PawPass Business</title>
        <meta name="description" content="Create and manage your PawPass partner offers." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Breadcrumbs 
              items={[
                { label: "Partner Dashboard", href: "/business" },
                { label: "Manage Offers" }
              ]} 
            />
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Offer
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Manage Offers
            </h1>
            <p className="text-slate-500">
              Create, edit, and manage your discount offers for PawPass members
            </p>
          </div>

          {/* Offers List */}
          {offers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
              <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">No offers yet</h3>
              <p className="text-slate-500 mb-6">
                Create your first offer to start attracting PawPass members
              </p>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Offer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${
                    offer.is_active ? "border-slate-200" : "border-amber-200 bg-amber-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display font-semibold text-slate-900">
                          {offer.title}
                        </h3>
                        {!offer.is_active && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                            <Pause className="w-3 h-3" />
                            Paused
                          </span>
                        )}
                      </div>
                      {offer.description && (
                        <p className="text-sm text-slate-600 mb-3">{offer.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Percent className="w-4 h-4" />
                          {offer.discount_value}
                          {offer.discount_type === "percentage" ? "%" : "€"} off
                        </span>
                        <span className="text-slate-500">
                          {offer.redemption_count} redemption
                          {offer.redemption_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {offer.terms && (
                        <p className="text-xs text-slate-400 mt-2">Terms: {offer.terms}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleOfferStatus(offer)}
                        title={offer.is_active ? "Pause offer" : "Activate offer"}
                      >
                        {offer.is_active ? (
                          <Pause className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Play className="w-4 h-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(offer)}
                      >
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteOfferId(offer.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? "Edit Offer" : "Create New Offer"}
            </DialogTitle>
            <DialogDescription>
              {editingOffer
                ? "Update your offer details"
                : "Fill in the details to create a new offer for PawPass members"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Offer Title *</Label>
              <Input
                id="title"
                placeholder="e.g., First Grooming Free"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
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
                <Label htmlFor="discount_value">Discount Value</Label>
                <Input
                  id="discount_value"
                  type="number"
                  placeholder="e.g., 15"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_value: e.target.value })
                  }
                />
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

            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Input
                id="terms"
                placeholder="e.g., Valid for new customers only"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              />
            </div>

            {/* Time-sensitive options */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time-Sensitive Options
              </h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Expiry Date (optional)</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_limited_time" className="cursor-pointer">Mark as Limited Time Offer</Label>
                  <Switch
                    id="is_limited_time"
                    checked={formData.is_limited_time}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_limited_time: checked })}
                  />
                </div>

                {formData.is_limited_time && (
                  <div className="space-y-2">
                    <Label htmlFor="limited_time_label">Custom Label (optional)</Label>
                    <Input
                      id="limited_time_label"
                      placeholder="e.g., 1 week only, January special"
                      value={formData.limited_time_label}
                      onChange={(e) => setFormData({ ...formData, limited_time_label: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
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
    </>
  );
};

export default BusinessOfferManagement;
