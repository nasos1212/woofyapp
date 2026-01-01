import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, MapPin, Clock, Phone, Mail, Plus, Search, CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Breadcrumbs from "@/components/Breadcrumbs";
import { formatDistanceToNow } from "date-fns";

interface LostPetAlert {
  id: string;
  pet_name: string;
  pet_description: string;
  pet_breed: string | null;
  pet_photo_url: string | null;
  last_seen_location: string;
  last_seen_date: string;
  contact_phone: string | null;
  contact_email: string | null;
  reward_offered: string | null;
  status: "active" | "found" | "resolved";
  created_at: string;
  owner_user_id: string;
}

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
}

const LostPetAlerts = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<LostPetAlert[]>([]);
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [petName, setPetName] = useState("");
  const [petDescription, setPetDescription] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [lastSeenDate, setLastSeenDate] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [rewardOffered, setRewardOffered] = useState("");

  useEffect(() => {
    fetchAlerts();
    if (user) {
      fetchMyPets();
    }
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("lost_pet_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts((data || []) as LostPetAlert[]);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyPets = async () => {
    if (!user) return;

    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      const { data: pets } = await supabase
        .from("pets")
        .select("id, pet_name, pet_breed")
        .eq("membership_id", membership.id);

      setMyPets(pets || []);
    }
  };

  const handlePetSelect = (petId: string) => {
    setSelectedPetId(petId);
    const pet = myPets.find((p) => p.id === petId);
    if (pet) {
      setPetName(pet.pet_name);
      setPetBreed(pet.pet_breed || "");
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to create an alert");
      return;
    }

    if (!petName || !petDescription || !lastSeenLocation || !lastSeenDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from("lost_pet_alerts").insert({
        owner_user_id: user.id,
        pet_id: selectedPetId || null,
        pet_name: petName,
        pet_description: petDescription,
        pet_breed: petBreed || null,
        last_seen_location: lastSeenLocation,
        last_seen_date: new Date(lastSeenDate).toISOString(),
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
        reward_offered: rewardOffered || null,
        status: "active",
      });

      if (error) throw error;

      toast.success("Alert created! The community will help find your pet.");
      setShowCreateDialog(false);
      resetForm();
      fetchAlerts();
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Failed to create alert");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedPetId("");
    setPetName("");
    setPetDescription("");
    setPetBreed("");
    setLastSeenLocation("");
    setLastSeenDate("");
    setContactPhone("");
    setContactEmail("");
    setRewardOffered("");
  };

  const markAsFound = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("lost_pet_alerts")
        .update({ status: "found", resolved_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;
      toast.success("Wonderful news! So glad your pet is found! 🎉");
      fetchAlerts();
    } catch (error) {
      console.error("Error updating alert:", error);
      toast.error("Failed to update alert");
    }
  };

  const filteredAlerts = alerts.filter(
    (alert) =>
      alert.pet_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.last_seen_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.pet_breed?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const activeAlerts = filteredAlerts.filter((a) => a.status === "active");
  const foundAlerts = filteredAlerts.filter((a) => a.status === "found" || a.status === "resolved");

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Lost Pet Alerts | PawPass Community</title>
        <meta name="description" content="Community-powered lost pet alert system. Help reunite pets with their families." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background">
        <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs
              items={[
                { label: "Dashboard", href: "/member" },
                { label: "Lost Pet Alerts" },
              ]}
            />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Lost Pet Alerts 🚨
              </h1>
              <p className="text-muted-foreground">
                Help reunite pets with their families. {activeAlerts.length} active alerts.
              </p>
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Report Lost Pet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Report a Lost Pet</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAlert} className="space-y-4 pt-4">
                  {myPets.length > 0 && (
                    <div className="space-y-2">
                      <Label>Select your pet (optional)</Label>
                      <select
                        value={selectedPetId}
                        onChange={(e) => handlePetSelect(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">-- Manual entry --</option>
                        {myPets.map((pet) => (
                          <option key={pet.id} value={pet.id}>
                            {pet.pet_name} ({pet.pet_breed || "Unknown breed"})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Pet Name *</Label>
                    <Input
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      placeholder="e.g., Max"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Breed</Label>
                    <Input
                      value={petBreed}
                      onChange={(e) => setPetBreed(e.target.value)}
                      placeholder="e.g., Golden Retriever"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea
                      value={petDescription}
                      onChange={(e) => setPetDescription(e.target.value)}
                      placeholder="Color, size, distinguishing features, collar info..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Last Seen Location *</Label>
                    <Input
                      value={lastSeenLocation}
                      onChange={(e) => setLastSeenLocation(e.target.value)}
                      placeholder="e.g., Central Park, near the fountain"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Last Seen Date/Time *</Label>
                    <Input
                      type="datetime-local"
                      value={lastSeenDate}
                      onChange={(e) => setLastSeenDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Your phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Email</Label>
                      <Input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="Your email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Reward Offered (optional)</Label>
                    <Input
                      value={rewardOffered}
                      onChange={(e) => setRewardOffered(e.target.value)}
                      placeholder="e.g., €100"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Alert"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by pet name, breed, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Active Alerts */}
          <div className="space-y-4 mb-8">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Active Alerts
            </h2>

            {activeAlerts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active alerts at the moment</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-white rounded-2xl p-5 shadow-soft border-l-4 border-l-red-500"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display font-semibold text-foreground text-lg">
                          {alert.pet_name}
                        </h3>
                        {alert.pet_breed && (
                          <p className="text-sm text-muted-foreground">{alert.pet_breed}</p>
                        )}
                      </div>
                      {alert.reward_offered && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Reward: {alert.reward_offered}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-foreground mb-4 line-clamp-2">
                      {alert.pet_description}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        {alert.last_seen_location}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {formatDistanceToNow(new Date(alert.last_seen_date), { addSuffix: true })}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      {alert.contact_phone && (
                        <a
                          href={`tel:${alert.contact_phone}`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </a>
                      )}
                      {alert.contact_email && (
                        <a
                          href={`mailto:${alert.contact_email}`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </a>
                      )}
                    </div>

                    {user && alert.owner_user_id === user.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => markAsFound(alert.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark as Found
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Found */}
          {foundAlerts.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Recently Reunited 🎉
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {foundAlerts.slice(0, 6).map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-white rounded-2xl p-4 shadow-soft opacity-75 border-l-4 border-l-green-500"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{alert.pet_name}</h3>
                        <p className="text-xs text-muted-foreground">Found & reunited!</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default LostPetAlerts;
