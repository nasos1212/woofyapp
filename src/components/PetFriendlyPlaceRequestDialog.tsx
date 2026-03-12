import { useState } from "react";
import { MapPin } from "lucide-react";
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
  { value: "store", label: "Store" },
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
        title: "Validation Error",
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
        google_maps_url: googleMapsUrl.trim(),
        submitted_by: submittedBy,
      });

      if (error) throw error;

      toast({
        title: "Request Submitted! 🎉",
        description: "We'll review your place and add it to the list shortly.",
      });
      setName("");
      setPlaceType("");
      setCity("");
      setArea("");
      setPhone("");
      setGoogleMapsUrl("");
      setSubmittedBy("owner");
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
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
          <span className="text-sm text-left text-foreground">Are you a pet-friendly place? <strong className="text-primary">Get listed for free!</strong></span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Get Listed on Our Directory
          </DialogTitle>
          <DialogDescription>
            No account needed! Fill in your details and we'll add your place after a quick verification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="place-name">Place Name *</Label>
            <Input
              id="place-name"
              placeholder="e.g. Sunny Beach Café"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="place-type">Type *</Label>
            <Select value={placeType} onValueChange={setPlaceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select place type" />
              </SelectTrigger>
              <SelectContent>
                {placeTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="place-city">City *</Label>
            <Select value={city} onValueChange={(v) => { setCity(v); setArea(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cyprusCityNames.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableAreas.length > 0 && (
            <div className="space-y-2">
              <Label>Area / Neighborhood</Label>
              <SearchableAreaSelect
                areas={availableAreas}
                value={area}
                onValueChange={setArea}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="place-phone">Phone *</Label>
            <Input
              id="place-phone"
              type="tel"
              placeholder="+357 XX XXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google-maps">Google Maps Link *</Label>
            <Input
              id="google-maps"
              placeholder="https://maps.google.com/..."
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              maxLength={500}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Who is submitting? *</Label>
            <RadioGroup value={submittedBy} onValueChange={(v) => setSubmittedBy(v as "owner" | "someone_else")} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="owner" id="req-owner" />
                <Label htmlFor="req-owner" className="font-normal cursor-pointer">I own/manage this place</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="someone_else" id="req-someone" />
                <Label htmlFor="req-someone" className="font-normal cursor-pointer">Recommending a place</Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            variant="hero"
            className="w-full"
            disabled={isSubmitting || !name.trim() || !placeType || !city || !phone.trim() || !googleMapsUrl.trim()}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PetFriendlyPlaceRequestDialog;
