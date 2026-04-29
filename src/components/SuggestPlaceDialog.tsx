import { useState } from "react";
import SearchableAreaSelect from "@/components/SearchableAreaSelect";
import { MapPin, Plus } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cyprusCityNames, getAreasForCity, getCoordinatesForLocation } from "@/data/cyprusLocations";
import { getCityDisplayName } from "@/lib/cityDisplay";
import { useTranslation } from "react-i18next";
import { petFriendlyPlaceTypes } from "@/data/petFriendlyPlaceTypes";

const placeTypes = petFriendlyPlaceTypes;

interface SuggestPlaceDialogProps {
  onPlaceAdded?: () => void;
}

const SuggestPlaceDialog = ({ onPlaceAdded }: SuggestPlaceDialogProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    place_type: "",
    city: "",
    area: "",
    phone: "",
    website: "",
    description: "",
    google_maps_link: "",
    submitted_by: "someone_else" as "owner" | "someone_else",
  });

  const availableAreas = formData.city ? getAreasForCity(formData.city) : [];

  const isValidMapsLink = (url: string): boolean => {
    return url.includes("google.com/maps") ||
           url.includes("goo.gl/maps") ||
           url.includes("maps.google.com") ||
           url.includes("maps.app.goo.gl") ||
           url.includes("maps.apple.com") ||
           url.includes("share.google");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: t("suggestPlace.signInTitle"),
        description: t("suggestPlace.signInDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.place_type || !formData.city || !formData.google_maps_link) {
      toast({
        title: t("suggestPlace.missingTitle"),
        description: t("suggestPlace.missingDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!isValidMapsLink(formData.google_maps_link)) {
      toast({
        title: t("suggestPlace.invalidMapTitle"),
        description: t("suggestPlace.invalidMapDesc"),
        variant: "destructive",
      });
      return;
    }

    const fallbackCoords = getCoordinatesForLocation(formData.city, formData.area);
    const latitude = fallbackCoords.lat;
    const longitude = fallbackCoords.lng;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("pet_friendly_places").insert({
        name: formData.name,
        place_type: formData.place_type,
        city: formData.city,
        area: formData.area || null,
        phone: formData.phone || null,
        website: formData.website || null,
        description: formData.description || null,
        google_maps_url: formData.google_maps_link,
        added_by_user_id: user.id,
        verified: false,
        latitude,
        longitude,
        submitted_by: formData.submitted_by,
      });

      if (error) throw error;

      toast({
        title: t("suggestPlace.successTitle"),
        description: t("suggestPlace.successDesc"),
      });

      setFormData({
        name: "",
        place_type: "",
        city: "",
        area: "",
        phone: "",
        website: "",
        description: "",
        google_maps_link: "",
        submitted_by: "someone_else",
      });
      setOpen(false);
      onPlaceAdded?.();
    } catch (error) {
      console.error("Error submitting place:", error);
      toast({
        title: t("suggestPlace.errorTitle"),
        description: t("suggestPlace.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {t("suggestPlace.trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {t("suggestPlace.title")}
          </DialogTitle>
          <DialogDescription>
            {t("suggestPlace.description")}
            <span className="block text-[11px] italic opacity-70 mt-1">
              {t("suggestPlace.joke")}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("suggestPlace.placeName")} *</Label>
            <Input
              id="name"
              placeholder={t("suggestPlace.placeNamePh")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">{t("suggestPlace.type")} *</Label>
            <Select
              value={formData.place_type}
              onValueChange={(value) => setFormData({ ...formData, place_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("suggestPlace.typePh")} />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[40vh]">
                {placeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {t(`getListed.dialog.types.${type.value}`, type.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">{t("suggestPlace.city")} *</Label>
            <Select
              value={formData.city}
              onValueChange={(value) => setFormData({ ...formData, city: value, area: "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("suggestPlace.cityPh")} />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[40vh]">
                {cyprusCityNames.map((city) => (
                  <SelectItem key={city} value={city}>
                    {getCityDisplayName(city, i18n.language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Area */}
          {availableAreas.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="area">{t("suggestPlace.area")}</Label>
              <SearchableAreaSelect
                areas={availableAreas}
                value={formData.area}
                onValueChange={(value) => setFormData({ ...formData, area: value })}
              />
              <p className="text-xs text-muted-foreground">
                {t("suggestPlace.areaHelp")}
              </p>
            </div>
          )}

          {/* Google Maps Link */}
          <div className="space-y-2">
            <Label htmlFor="google_maps_link">{t("suggestPlace.googleMaps")} *</Label>
            <Input
              id="google_maps_link"
              type="url"
              placeholder={t("suggestPlace.googleMapsPh")}
              value={formData.google_maps_link}
              onChange={(e) => setFormData({ ...formData, google_maps_link: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              {t("suggestPlace.googleMapsHelp")}
            </p>
          </div>

          {/* Submitted By */}
          <div className="space-y-2">
            <Label>{t("suggestPlace.whoSubmitting")} *</Label>
            <RadioGroup
              value={formData.submitted_by}
              onValueChange={(v) => setFormData({ ...formData, submitted_by: v as "owner" | "someone_else" })}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="owner" id="suggest-owner" />
                <Label htmlFor="suggest-owner" className="font-normal cursor-pointer">{t("suggestPlace.owner")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="someone_else" id="suggest-someone" />
                <Label htmlFor="suggest-someone" className="font-normal cursor-pointer">{t("suggestPlace.recommend")}</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">{t("suggestPlace.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+357 XX XXXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">{t("suggestPlace.website")}</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://..."
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("suggestPlace.descLabel")}</Label>
            <Textarea
              id="description"
              placeholder={t("suggestPlace.descPh")}
              value={formData.description}
              onChange={(e) => {
                if (e.target.value.length <= 140) {
                  setFormData({ ...formData, description: e.target.value });
                }
              }}
              maxLength={140}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.description.length}/140
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              {t("suggestPlace.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? t("suggestPlace.submitting") : t("suggestPlace.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestPlaceDialog;
