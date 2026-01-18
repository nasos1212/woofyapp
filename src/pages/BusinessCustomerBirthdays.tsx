import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessVerification } from "@/hooks/useBusinessVerification";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Cake, Gift, Calendar, Settings, Users, PartyPopper, Clock, Send, ChevronDown, ChevronUp } from "lucide-react";
import { format, differenceInDays, isSameMonth, isSameDay, addYears, setYear } from "date-fns";
import DogLoader from "@/components/DogLoader";
import BusinessMobileNav from "@/components/BusinessMobileNav";
import BusinessHeader from "@/components/BusinessHeader";
import PendingApprovalBanner from "@/components/PendingApprovalBanner";
import { BirthdayOfferModal } from "@/components/BirthdayOfferModal";

interface CustomerPet {
  pet_id: string;
  pet_name: string;
  pet_breed: string | null;
  birthday: string | null;
  owner_name: string | null;
  owner_email: string;
  owner_user_id: string;
  last_interaction: string;
}

interface BusinessOffer {
  id: string;
  title: string;
  discount_type: string;
  discount_value: number | null;
}

interface BirthdaySettings {
  id?: string;
  enabled: boolean;
  days_before_reminder: number;
  custom_message: string | null;
}

interface UpcomingBirthday extends CustomerPet {
  daysUntil: number;
  nextBirthday: Date;
  age: number;
}

interface SentBirthdayOffer {
  id: string;
  pet_name: string;
  owner_name: string | null;
  discount_value: number;
  discount_type: string;
  message: string;
  sent_at: string;
}

const BusinessCustomerBirthdays = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isApproved, verificationStatus, loading: verificationLoading } = useBusinessVerification();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [customerPets, setCustomerPets] = useState<CustomerPet[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);
  const [businessOffers, setBusinessOffers] = useState<BusinessOffer[]>([]);
  const [sentOffers, setSentOffers] = useState<SentBirthdayOffer[]>([]);
  const [settings, setSettings] = useState<BirthdaySettings>({
    enabled: true,
    days_before_reminder: 7,
    custom_message: null,
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPetForOffer, setSelectedPetForOffer] = useState<UpcomingBirthday | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [showSentOffers, setShowSentOffers] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get business
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("id, business_name")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (businessError) throw businessError;
      if (!businessData) {
        toast({
          title: "No business found",
          description: "You need to register a business first.",
          variant: "destructive",
        });
        navigate("/partner-register");
        return;
      }

      setBusinessId(businessData.id);
      setBusinessName(businessData.business_name);

      // Fetch active offers for this business
      const { data: offersData } = await supabase
        .from("offers")
        .select("id, title, discount_type, discount_value")
        .eq("business_id", businessData.id)
        .eq("is_active", true);

      setBusinessOffers(offersData || []);

      // Fetch sent birthday offers
      const { data: sentOffersData } = await supabase
        .from("sent_birthday_offers")
        .select("*")
        .eq("business_id", businessData.id)
        .order("sent_at", { ascending: false })
        .limit(50);

      setSentOffers(sentOffersData || []);

      // Fetch customer pets using direct query instead of view
      // This gets pets from customers who have redeemed offers at this business
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from("offer_redemptions")
        .select(`
          membership_id,
          redeemed_at
        `)
        .eq("business_id", businessData.id);

      if (redemptionsError) throw redemptionsError;

      // Get unique membership IDs
      const membershipIds = [...new Set(redemptionsData?.map(r => r.membership_id) || [])];
      
      if (membershipIds.length > 0) {
        // Get pets for these memberships
        const { data: petsData, error: petsError } = await supabase
          .from("pets")
          .select("id, pet_name, pet_breed, birthday, owner_user_id, membership_id")
          .in("membership_id", membershipIds);

        if (petsError) throw petsError;

        // Get owner profiles
        const ownerIds = [...new Set(petsData?.map(p => p.owner_user_id) || [])];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", ownerIds);

        // Build customer pets list
        const customerPetsList: CustomerPet[] = (petsData || []).map(pet => {
          const profile = profilesData?.find(p => p.user_id === pet.owner_user_id);
          const lastRedemption = redemptionsData
            ?.filter(r => r.membership_id === pet.membership_id)
            .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime())[0];

          return {
            pet_id: pet.id,
            pet_name: pet.pet_name,
            pet_breed: pet.pet_breed,
            birthday: pet.birthday,
            owner_name: profile?.full_name || null,
            owner_email: profile?.email || "",
            owner_user_id: pet.owner_user_id,
            last_interaction: lastRedemption?.redeemed_at || "",
          };
        });

        setCustomerPets(customerPetsList);

        // Calculate upcoming birthdays
        const now = new Date();
        const upcoming: UpcomingBirthday[] = customerPetsList
          .filter(pet => pet.birthday)
          .map(pet => {
            const birthday = new Date(pet.birthday!);
            const thisYearBirthday = setYear(birthday, now.getFullYear());
            let nextBirthday = thisYearBirthday;
            
            if (thisYearBirthday < now && !isSameDay(thisYearBirthday, now)) {
              nextBirthday = addYears(thisYearBirthday, 1);
            }

            const daysUntil = differenceInDays(nextBirthday, now);
            const age = nextBirthday.getFullYear() - birthday.getFullYear();

            return {
              ...pet,
              daysUntil,
              nextBirthday,
              age,
            };
          })
          .filter(pet => pet.daysUntil <= 30) // Show birthdays within 30 days
          .sort((a, b) => a.daysUntil - b.daysUntil);

        setUpcomingBirthdays(upcoming);
      }

      // Fetch birthday settings
      const { data: settingsData } = await supabase
        .from("business_birthday_settings")
        .select("*")
        .eq("business_id", businessData.id)
        .maybeSingle();

      if (settingsData) {
        setSettings({
          id: settingsData.id,
          enabled: settingsData.enabled,
          days_before_reminder: settingsData.days_before_reminder,
          custom_message: settingsData.custom_message,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!businessId) return;
    
    setSavingSettings(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from("business_birthday_settings")
          .update({
            enabled: settings.enabled,
            days_before_reminder: settings.days_before_reminder,
            custom_message: settings.custom_message,
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("business_birthday_settings")
          .insert({
            business_id: businessId,
            enabled: settings.enabled,
            days_before_reminder: settings.days_before_reminder,
            custom_message: settings.custom_message,
          })
          .select()
          .single();

        if (error) throw error;
        setSettings(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Settings saved",
        description: "Your birthday reminder settings have been updated.",
      });
      setShowSettings(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const getBirthdayBadge = (daysUntil: number) => {
    if (daysUntil === 0) {
      return <Badge className="gap-1 bg-gradient-to-r from-pink-500 to-purple-500"><PartyPopper className="w-3 h-3" />Today!</Badge>;
    } else if (daysUntil <= 7) {
      return <Badge className="gap-1 bg-amber-500"><Cake className="w-3 h-3" />This Week</Badge>;
    } else {
      return <Badge variant="secondary" className="gap-1"><Calendar className="w-3 h-3" />In {daysUntil} days</Badge>;
    }
  };

  if (authLoading || verificationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!isApproved) {
    return (
      <>
        <Helmet>
          <title>Customer Pet Birthdays | Business Dashboard</title>
        </Helmet>
        <BusinessHeader />
        <main className="min-h-screen bg-background pt-24 md:pt-28 pb-16">
          <div className="container max-w-4xl mx-auto px-4">
            <PendingApprovalBanner status={verificationStatus} />
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">Birthday Tracking Unavailable</h3>
              <p className="text-slate-500">Track customer pet birthdays once your business is approved.</p>
            </div>
          </div>
        </main>
        <div className="pb-20 md:pb-0" />
        <BusinessMobileNav />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Customer Pet Birthdays | Business Dashboard</title>
        <meta name="description" content="Track your customers' pet birthdays and send special offers." />
      </Helmet>

      <BusinessHeader />
      
      <main className="min-h-screen bg-background pt-24 md:pt-28 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <Button 
            variant="ghost"
            onClick={() => navigate("/business")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                <Cake className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500" />
                Pet Birthdays
              </h1>
              <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                Celebrate your customers' pets
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Birthday Reminder Settings</CardTitle>
                <CardDescription>Configure how you want to be notified about upcoming birthdays</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enabled">Enable Birthday Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get notified about upcoming pet birthdays</p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={settings.enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Days Before Reminder</Label>
                  <Input
                    id="days"
                    type="number"
                    min={1}
                    max={30}
                    value={settings.days_before_reminder}
                    onChange={(e) => setSettings(prev => ({ ...prev, days_before_reminder: parseInt(e.target.value) || 7 }))}
                    className="max-w-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Custom Birthday Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="e.g., Happy Birthday! Enjoy 20% off your next visit..."
                    value={settings.custom_message || ""}
                    onChange={(e) => setSettings(prev => ({ ...prev, custom_message: e.target.value || null }))}
                  />
                </div>
                <Button onClick={saveSettings} disabled={savingSettings}>
                  {savingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-3 sm:pt-6 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  <div>
                    <p className="text-lg sm:text-2xl font-bold">{customerPets.length}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Pets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={upcomingBirthdays.filter(b => b.daysUntil <= 7).length > 0 ? "border-pink-500" : ""}>
              <CardContent className="p-3 sm:pt-6 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
                  <Cake className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500" />
                  <div>
                    <p className="text-lg sm:text-2xl font-bold">{upcomingBirthdays.filter(b => b.daysUntil <= 7).length}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:pt-6 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
                  <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
                  <div>
                    <p className="text-lg sm:text-2xl font-bold">{upcomingBirthdays.length}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Birthdays */}
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <PartyPopper className="h-5 w-5" />
            Upcoming Birthdays
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : upcomingBirthdays.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Cake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming birthdays</h3>
                <p className="text-muted-foreground">
                  {customerPets.length === 0 
                    ? "You don't have any customer interactions yet. Birthdays will appear here once customers redeem offers."
                    : "No pet birthdays in the next 30 days. Check back soon!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingBirthdays.map((pet) => (
                <Card key={pet.pet_id} className={pet.daysUntil === 0 ? "border-pink-500 bg-gradient-to-r from-pink-50 to-purple-50" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{pet.pet_name}</h3>
                          {getBirthdayBadge(pet.daysUntil)}
                          <span className="text-sm text-muted-foreground">
                            Turning {pet.age}!
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-1">
                          {pet.pet_breed && `${pet.pet_breed} • `}
                          Owner: <span className="font-medium">{pet.owner_name || pet.owner_email}</span>
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(pet.nextBirthday, "MMMM d, yyyy")}
                          </span>
                          {pet.last_interaction && (
                            <span>Last visit: {format(new Date(pet.last_interaction), "MMM d, yyyy")}</span>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="shrink-0"
                        onClick={() => {
                          setSelectedPetForOffer(pet);
                          setOfferModalOpen(true);
                        }}
                      >
                        <Gift className="mr-2 h-4 w-4" />
                        Send Offer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* All Customer Pets */}
          {customerPets.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mb-4 mt-8 flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Customer Pets
              </h2>
              <div className="grid gap-4">
                {customerPets.map((pet) => (
                  <Card key={pet.pet_id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{pet.pet_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {pet.pet_breed && `${pet.pet_breed} • `}
                            {pet.owner_name || pet.owner_email}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          {pet.birthday ? (
                            <p className="flex items-center gap-1">
                              <Cake className="h-4 w-4 text-pink-500" />
                              {format(new Date(pet.birthday), "MMM d")}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">No birthday set</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Sent Birthday Offers */}
          {sentOffers.length > 0 && (
            <>
              <div 
                className="flex items-center justify-between mt-8 mb-4 cursor-pointer"
                onClick={() => setShowSentOffers(!showSentOffers)}
              >
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Sent Birthday Offers
                  <Badge variant="secondary" className="ml-2">{sentOffers.length}</Badge>
                </h2>
                <Button variant="ghost" size="sm">
                  {showSentOffers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              
              {showSentOffers && (
                <div className="space-y-3">
                  {sentOffers.map((offer) => (
                    <Card key={offer.id} className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{offer.pet_name}</h3>
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                {offer.discount_type === "percentage" ? `${offer.discount_value}% off` : `€${offer.discount_value} off`}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              To: {offer.owner_name || "Pet Owner"}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2 italic">
                              "{offer.message.substring(0, 100)}{offer.message.length > 100 ? "..." : ""}"
                            </p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground shrink-0">
                            <p>{format(new Date(offer.sent_at), "MMM d, yyyy")}</p>
                            <p>{format(new Date(offer.sent_at), "h:mm a")}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="pb-20 md:pb-0" />
      </main>

      <BirthdayOfferModal
        open={offerModalOpen}
        onOpenChange={setOfferModalOpen}
        pet={selectedPetForOffer}
        businessId={businessId || ""}
        businessName={businessName}
        existingOffers={businessOffers}
        onSuccess={() => {
          setSelectedPetForOffer(null);
          // Refresh sent offers
          if (businessId) {
            supabase
              .from("sent_birthday_offers")
              .select("*")
              .eq("business_id", businessId)
              .order("sent_at", { ascending: false })
              .limit(50)
              .then(({ data }) => {
                if (data) setSentOffers(data);
              });
          }
        }}
      />

      <BusinessMobileNav />
    </>
  );
};

export default BusinessCustomerBirthdays;
