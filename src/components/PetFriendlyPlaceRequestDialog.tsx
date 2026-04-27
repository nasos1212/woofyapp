import { useState } from "react";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { cyprusCityNames, getAreasForCity } from "@/data/cyprusLocations";
import SearchableAreaSelect from "@/components/SearchableAreaSelect";

const placeTypes = [
  { value: "cafe", label: "Café" },
  { value: "restaurant", label: "Restaurant" },
  { value: "bar", label: "Bar" },
  { value: "hotel", label: "Hotel" },
  { value: "beach", label: "Beach" },
  { value: "park", label: "Park" },
  { value: "nature_trail", label: "Nature Trail" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "store", label: "Retail Store" },
  { value: "office", label: "Office" },
  { value: "other", label: "Other" },
];

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  placeType: z.string().min(1, "Please select a type"),
  city: z.string().min(1, "Please select a city"),
  phone: z.string().trim().max(20, "Phone too long").optional().or(z.literal("")),
  googleMapsUrl: z.string().trim().min(1, "Google Maps link is required").max(500, "URL too long"),
  website: z.string().trim().max(500, "URL too long").optional().or(z.literal("")),
  description: z.string().trim().max(140, "Description too long").optional().or(z.literal("")),
  submittedBy: z.enum(["owner", "someone_else"]),
});

const PetFriendlyPlaceRequestDialog = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [submittedBy, setSubmittedBy] = useState<"owner" | "someone_else">("owner");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const availableAreas = city ? getAreasForCity(city) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = formSchema.safeParse({ name, placeType, city, phone, googleMapsUrl, website, description, submittedBy });
    if (!result.success) {
      toast({
        title: t("getListed.dialog.validationError"),
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("pet_friendly_place_requests" as any).insert({
        place_name: name.trim(),
        place_type: placeType,
        city: city,
        area: area || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        description: description.trim() || null,
        google_maps_url: googleMapsUrl.trim(),
        submitted_by: submittedBy,
      });

      if (error) throw error;

      toast({
        title: t("getListed.dialog.successTitle"),
        description: t("getListed.dialog.successDesc"),
      });
      setName("");
      setPlaceType("");
      setCity("");
      setArea("");
      setPhone("");
      setWebsite("");
      setDescription("");
      setGoogleMapsUrl("");
      setSubmittedBy("owner");
      setOpen(false);
    } catch (error: any) {
      toast({
        title: t("getListed.dialog.errorTitle"),
        description: error.message || t("getListed.dialog.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="mt-6 w-full flex items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 px-4 py-3 transition-colors">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm text-left text-foreground">{t("getListed.ctaQuestion")} <strong className="text-primary">{t("getListed.ctaAction")}</strong></span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {t("getListed.dialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("getListed.dialog.description")}
            <span className="block text-[11px] italic opacity-70 mt-1">
              {t("getListed.dialog.joke")}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="place-name">{t("getListed.dialog.placeName")} *</Label>
            <Input
              id="place-name"
              placeholder={t("getListed.dialog.placeNamePh")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="place-type">{t("getListed.dialog.type")} *</Label>
            <Select value={placeType} onValueChange={setPlaceType}>
              <SelectTrigger>
                <SelectValue placeholder={t("getListed.dialog.typePh")} />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[40vh]">
                {placeTypes.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="place-city">{t("getListed.dialog.city")} *</Label>
            <Select value={city} onValueChange={(v) => { setCity(v); setArea(""); }}>
              <SelectTrigger>
                <SelectValue placeholder={t("getListed.dialog.cityPh")} />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[40vh]">
                {cyprusCityNames.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableAreas.length > 0 && (
            <div className="space-y-2">
              <Label>{t("getListed.dialog.area")}</Label>
              <SearchableAreaSelect
                areas={availableAreas}
                value={area}
                onValueChange={setArea}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="google-maps">{t("getListed.dialog.googleMaps")} *</Label>
            <Input
              id="google-maps"
              placeholder="https://maps.google.com/..."
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              maxLength={500}
              required
            />
            <p className="text-xs text-muted-foreground">
              {t("getListed.dialog.googleMapsHelp")}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("getListed.dialog.whoSubmitting")} *</Label>
            <RadioGroup value={submittedBy} onValueChange={(v) => setSubmittedBy(v as "owner" | "someone_else")} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="owner" id="req-owner" />
                <Label htmlFor="req-owner" className="font-normal cursor-pointer">{t("getListed.dialog.owner")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="someone_else" id="req-someone" />
                <Label htmlFor="req-someone" className="font-normal cursor-pointer">{t("getListed.dialog.recommend")}</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="place-phone">{t("getListed.dialog.phone")}</Label>
            <Input
              id="place-phone"
              type="tel"
              placeholder="+357 XX XXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="place-website">{t("getListed.dialog.website")}</Label>
            <Input
              id="place-website"
              type="url"
              placeholder="https://..."
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="place-description">{t("getListed.dialog.descLabel")}</Label>
            <Textarea
              id="place-description"
              placeholder={t("getListed.dialog.descPh")}
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 140) {
                  setDescription(e.target.value);
                }
              }}
              maxLength={140}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/140
            </p>
          </div>

          <Button
            type="submit"
            variant="hero"
            className="w-full"
            disabled={isSubmitting || !name.trim() || !placeType || !city || !googleMapsUrl.trim()}
          >
            {isSubmitting ? t("getListed.dialog.submitting") : t("getListed.dialog.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PetFriendlyPlaceRequestDialog;
