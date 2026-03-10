import { useState } from "react";
import { MapPin } from "lucide-react";
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

const placeTypes = [
  { value: "cafe", label: "Café" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "beach", label: "Beach" },
  { value: "park", label: "Park" },
  { value: "nature_trail", label: "Nature Trail" },
  { value: "other", label: "Other" },
];

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  placeType: z.string().min(1, "Please select a type"),
  googleMapsUrl: z.string().trim().min(1, "Google Maps link is required").max(500, "URL too long"),
  submittedBy: z.enum(["owner", "someone_else"]),
});

const PetFriendlyPlaceRequestDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = formSchema.safeParse({ name, placeType, googleMapsUrl });
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
        google_maps_url: googleMapsUrl.trim(),
      });

      if (error) throw error;

      toast({
        title: "Request Submitted! 🎉",
        description: "We'll review your place and add it to the map shortly.",
      });
      setName("");
      setPlaceType("");
      setGoogleMapsUrl("");
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
        <button className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors py-2">
          <MapPin className="w-4 h-4" />
          <span>Are you a pet-friendly place? <strong>Get listed for free!</strong></span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Get Listed on Our Map
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

          <Button
            type="submit"
            variant="hero"
            className="w-full"
            disabled={isSubmitting || !name.trim() || !placeType || !googleMapsUrl.trim()}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PetFriendlyPlaceRequestDialog;
