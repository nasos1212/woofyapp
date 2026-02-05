import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
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

const placeTypes = [
  { value: "beach", label: "Beach" },
  { value: "cafe", label: "Café" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "park", label: "Park" },
  { value: "other", label: "Other" },
];

interface SuggestPlaceDialogProps {
  onPlaceAdded?: () => void;
}

const SuggestPlaceDialog = ({ onPlaceAdded }: SuggestPlaceDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    place_type: "",
    city: "",
    area: "",
    address: "",
    phone: "",
    website: "",
    description: "",
    google_maps_link: "",
  });

  // Get available areas based on selected city
  const availableAreas = formData.city ? getAreasForCity(formData.city) : [];

  // Extract coordinates from Google Maps link
  const extractCoordinates = (url: string): { lat: number; lng: number } | null => {
    try {
      // Pattern 1: @lat,lng format (e.g., @35.1234,33.4567)
      const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const atMatch = url.match(atPattern);
      if (atMatch) {
        return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
      }

      // Pattern 2: ?q=lat,lng format
      const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const qMatch = url.match(qPattern);
      if (qMatch) {
        return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
      }

      // Pattern 3: /place/lat,lng format
      const placePattern = /\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const placeMatch = url.match(placePattern);
      if (placeMatch) {
        return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
      }

      // Pattern 4: ll=lat,lng format
      const llPattern = /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const llMatch = url.match(llPattern);
      if (llMatch) {
        return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
      }

      return null;
    } catch {
      return null;
    }
  };

  const isValidMapsLink = (url: string): boolean => {
    return url.includes("google.com/maps") || 
           url.includes("goo.gl/maps") || 
           url.includes("maps.google.com") ||
           url.includes("maps.app.goo.gl") ||
           url.includes("maps.apple.com");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to suggest a place.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.place_type || !formData.city || !formData.google_maps_link) {
      toast({
        title: "Missing information",
        description: "Please fill in the required fields (name, type, city, map link).",
        variant: "destructive",
      });
      return;
    }

    if (!isValidMapsLink(formData.google_maps_link)) {
      toast({
        title: "Invalid map link",
        description: "Please paste a valid Google Maps or Apple Maps link.",
        variant: "destructive",
      });
      return;
    }

    // Try to extract coordinates from the link, fallback to city/area coordinates
    const coords = extractCoordinates(formData.google_maps_link);
    const fallbackCoords = getCoordinatesForLocation(formData.city, formData.area);
    const latitude = coords?.lat ?? fallbackCoords.lat;
    const longitude = coords?.lng ?? fallbackCoords.lng;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("pet_friendly_places").insert({
        name: formData.name,
        place_type: formData.place_type,
        city: formData.city,
        area: formData.area || null,
        address: formData.address || null,
        phone: formData.phone || null,
        website: formData.website || null,
        description: formData.description || null,
        added_by_user_id: user.id,
        verified: false,
        latitude,
        longitude,
      });

      if (error) throw error;

      toast({
        title: "Thank you! 🎉",
        description: "Your suggestion has been submitted for review.",
      });

      setFormData({
        name: "",
        place_type: "",
        city: "",
        area: "",
        address: "",
        phone: "",
        website: "",
        description: "",
        google_maps_link: "",
      });
      setOpen(false);
      onPlaceAdded?.();
    } catch (error) {
      console.error("Error submitting place:", error);
      toast({
        title: "Error",
        description: "Failed to submit your suggestion. Please try again.",
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
          Suggest a Place
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Suggest a Pet-Friendly Place
          </DialogTitle>
          <DialogDescription>
            Know a place that welcomes pets? Share it with the community!
            Your suggestion will be reviewed before being published.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Place Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Sunny Beach Café"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.place_type}
              onValueChange={(value) => setFormData({ ...formData, place_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {placeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Select
              value={formData.city}
              onValueChange={(value) => setFormData({ ...formData, city: value, area: "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cyprusCityNames.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Area */}
          {availableAreas.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="area">Area / Neighborhood</Label>
              <Select
                value={formData.area}
                onValueChange={(value) => setFormData({ ...formData, area: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {availableAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This helps us place the pin more accurately on the map
              </p>
            </div>
          )}

          {/* Google Maps Link */}
          <div className="space-y-2">
            <Label htmlFor="google_maps_link">Google Maps Link *</Label>
            <Input
              id="google_maps_link"
              type="url"
              placeholder="Paste Google Maps or Apple Maps link..."
              value={formData.google_maps_link}
              onChange={(e) => setFormData({ ...formData, google_maps_link: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Open the place in Google Maps, click "Share" and paste the link here
            </p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="e.g. 123 Main Street"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
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
            <Label htmlFor="website">Website</Label>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell us what makes this place pet-friendly..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestPlaceDialog;
