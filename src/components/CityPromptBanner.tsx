import { useState } from "react";
import { MapPin, X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cyprusCityNames } from "@/data/cyprusLocations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CityPromptBannerProps {
  userId: string;
  onCitySet: (city: string) => void;
  onDismiss: () => void;
}

const CityPromptBanner = ({ userId, onCitySet, onDismiss }: CityPromptBannerProps) => {
  const [saving, setSaving] = useState(false);

  const handleSelectCity = async (city: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_city: city })
        .eq("user_id", userId);

      if (error) throw error;

      onCitySet(city);
      toast.success(`City set to ${city}! 🐾`);
    } catch (error) {
      console.error("Error saving city:", error);
      toast.error("Failed to save city");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 rounded-2xl p-4 sm:p-5 border border-primary/20 mb-6 relative">
      <button 
        onClick={onDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pr-6">
        <div className="w-10 h-10 bg-primary/15 rounded-full flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm mb-0.5">
            Help us build your local pet community! 🐾
          </p>
          <p className="text-xs text-muted-foreground">
            Select your city to get location-based offers and recommendations.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 shrink-0" disabled={saving}>
              <MapPin className="w-3.5 h-3.5" />
              Select City
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[280px] max-h-[300px] overflow-y-auto bg-card z-50">
            {cyprusCityNames.map((city) => (
              <DropdownMenuItem
                key={city}
                onClick={() => handleSelectCity(city)}
                className="cursor-pointer"
              >
                {city}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default CityPromptBanner;
