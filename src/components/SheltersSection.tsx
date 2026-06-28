import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Home, LogIn, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ensureHttps } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface Shelter {
  id: string;
  shelter_name: string;
  location: string;
}

const shelterAccent = [
  { bg: "bg-warm-terracotta/10", text: "text-warm-terracotta", border: "border-warm-terracotta/15" },
  { bg: "bg-warm-sage/10", text: "text-warm-sage", border: "border-warm-sage/15" },
  { bg: "bg-warm-honey/15", text: "text-amber-700", border: "border-warm-honey/20" },
  { bg: "bg-warm-navy/10", text: "text-warm-navy", border: "border-warm-navy/15" },
];

const SheltersSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingShelter, setExistingShelter] = useState<{ id: string; verification_status: string } | null>(null);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [formData, setFormData] = useState({
    shelterName: "",
    contactName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    dogsCount: "",
    yearsOperating: "",
    description: "",
  });

  useEffect(() => {
    const fetchShelters = async () => {
      const { data, error } = await supabase
        .from("shelters_directory")
        .select("id, shelter_name, location")
        .order("shelter_name");

      if (!error && data) {
        setShelters(data);
      }
    };

    fetchShelters();
  }, []);

  useEffect(() => {
    const checkExistingShelter = async () => {
      if (!user) {
        setExistingShelter(null);
        return;
      }

      const { data } = await supabase
        .from("shelters")
        .select("id, verification_status")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setExistingShelter(data);
      }
    };

    checkExistingShelter();
  }, [user]);

  const handleApplyClick = () => {
    if (!user) {
      navigate('/auth?redirect=/#shelters&action=shelter-apply');
      return;
    }

    if (existingShelter) {
      navigate('/shelter-dashboard');
      return;
    }

    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(t("shelterApply.loginRequired"));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("shelters")
        .insert({
          shelter_name: formData.shelterName,
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone || null,
          location: formData.location,
          website: formData.website ? ensureHttps(formData.website) : null,
          dogs_in_care: formData.dogsCount,
          years_operating: formData.yearsOperating,
          description: formData.description,
          user_id: user.id,
        });

      if (error) {
        console.error("Error submitting shelter application:", error);
        toast.error(t("shelterApply.submitFailed"));
        return;
      }

      toast.success(t("shelterApply.submitted"));
      setIsDialogOpen(false);
      setFormData({
        shelterName: "",
        contactName: "",
        email: "",
        phone: "",
        location: "",
        website: "",
        dogsCount: "",
        yearsOperating: "",
        description: "",
      });
      navigate('/shelter-dashboard');
    } catch (err) {
      console.error("Error:", err);
      toast.error(t("shelterApply.unexpected"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="shelters" className="py-20 lg:py-32 bg-warm-stone/50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-warm-sage/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-6 border border-warm-stone shadow-sm">
            <Heart className="w-4 h-4 text-warm-terracotta" />
            <span className="text-sm font-medium text-warm-navy">{t("shelters.badge")}</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("shelters.titlePart")} <span className="text-warm-terracotta">{t("shelters.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("shelters.subtitle")}
          </p>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-16">
          <div className="bg-white rounded-2xl p-6 text-center border border-warm-stone shadow-sm">
            <div className="text-3xl md:text-4xl font-display font-bold text-warm-terracotta mb-2">
              {shelters.length > 0 ? shelters.length : "—"}
            </div>
            <p className="text-muted-foreground text-sm">{t("shelters.partnerShelters")}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center border border-warm-stone shadow-sm">
            <div className="text-3xl md:text-4xl font-display font-bold text-warm-sage mb-2">100%</div>
            <p className="text-muted-foreground text-sm">{t("shelters.transparent")}</p>
          </div>
        </div>

        {/* Whitelisted Shelters */}
        <div className="mb-12">
          <h3 className="font-display text-xl font-semibold text-foreground mb-6 text-center">
            {t("shelters.ourPartners")}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shelters.length > 0 ? (
              shelters.map((shelter, index) => {
                const accent = shelterAccent[index % shelterAccent.length];
                return (
                  <Link 
                    key={shelter.id}
                    to={`/shelter/${shelter.id}`}
                    className="bg-white rounded-2xl p-6 border border-warm-stone hover:border-warm-sage/30 hover:shadow-warm transition-all duration-300 group cursor-pointer"
                  >
                    <div className={`w-14 h-14 ${accent.bg} ${accent.border} border rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                      <Home className={`w-7 h-7 ${accent.text}`} />
                    </div>
                    <h4 className="font-display font-semibold text-foreground mb-1">{shelter.shelter_name}</h4>
                    <p className="text-muted-foreground text-sm mb-3">{shelter.location}</p>
                    <div className="flex items-center gap-1 text-sm text-warm-terracotta font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>View</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                );
              })
            ) : (
              [...Array(2)].map((_, index) => {
                const accent = shelterAccent[index % shelterAccent.length];
                return (
                  <div 
                    key={index}
                    className="bg-white rounded-2xl p-6 border border-warm-stone hover:shadow-warm transition-all duration-300 group"
                  >
                    <div className={`w-14 h-14 ${accent.bg} ${accent.border} border rounded-2xl flex items-center justify-center mb-4`}>
                      <Home className={`w-7 h-7 ${accent.text}`} />
                    </div>
                    <h4 className="font-display font-semibold text-foreground mb-1">{t("shelters.comingSoon")}</h4>
                    <p className="text-muted-foreground text-sm mb-3">Cyprus</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="w-4 h-4 text-warm-terracotta" />
                      <span className="text-foreground font-medium">{t("shelters.joinUs")}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {t("shelters.areYou")}
          </p>
          {existingShelter ? (
            <Button 
              onClick={() => navigate('/shelter-dashboard')}
              variant="outline"
              className="gap-2 border-warm-stone hover:bg-warm-cream"
            >
              <Home className="w-4 h-4" />
              {t("shelters.goDashboard")}
            </Button>
          ) : (
            <button 
              onClick={handleApplyClick}
              className="text-warm-terracotta font-medium hover:underline inline-flex items-center gap-2"
            >
              {user ? t("shelters.applyAuth") : t("shelters.loginApply")}
              {user ? <ArrowRight className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Shelter Application Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t("shelterApply.title")}</DialogTitle>
            <DialogDescription>
              {t("shelterApply.description")}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shelterName">{t("shelterApply.shelterName")}</Label>
                <Input
                  id="shelterName"
                  required
                  value={formData.shelterName}
                  onChange={(e) => setFormData(prev => ({ ...prev, shelterName: e.target.value }))}
                  placeholder={t("shelterApply.shelterNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">{t("shelterApply.contactPerson")}</Label>
                <Input
                  id="contactName"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder={t("shelterApply.contactPersonPlaceholder")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("shelterApply.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t("shelterApply.emailPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("shelterApply.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={t("shelterApply.phonePlaceholder")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">{t("shelterApply.location")}</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder={t("shelterApply.locationPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">{t("shelterApply.website")}</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder={t("shelterApply.websitePlaceholder")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dogsCount">{t("shelterApply.dogsCount")}</Label>
                <Select
                  value={formData.dogsCount}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dogsCount: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("shelterApply.dogsCountPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">{t("shelterApply.dogsRange1")}</SelectItem>
                    <SelectItem value="11-25">{t("shelterApply.dogsRange2")}</SelectItem>
                    <SelectItem value="26-50">{t("shelterApply.dogsRange3")}</SelectItem>
                    <SelectItem value="51-100">{t("shelterApply.dogsRange4")}</SelectItem>
                    <SelectItem value="100+">{t("shelterApply.dogsRange5")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsOperating">{t("shelterApply.operatingSince")}</Label>
                <Select
                  value={formData.yearsOperating}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, yearsOperating: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("shelterApply.yearPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("shelterApply.tellAbout")}</Label>
              <Textarea
                id="description"
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t("shelterApply.tellAboutPlaceholder")}
              />
            </div>

            <div className="bg-warm-cream rounded-lg p-4 text-sm text-muted-foreground border border-warm-stone">
              <strong className="text-foreground">{t("shelterApply.whatHappensNext")}</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{t("shelterApply.next1")}</li>
                <li>{t("shelterApply.next2")}</li>
                <li>{t("shelterApply.next3")}</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("shelterApply.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-foreground hover:bg-foreground/90">
                {isSubmitting ? t("shelterApply.submitting") : t("shelterApply.submit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default SheltersSection;
