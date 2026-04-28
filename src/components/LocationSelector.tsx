import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cyprusCities, getAreasForCity } from "@/data/cyprusLocations";
import { getCityDisplayName } from "@/lib/cityDisplay";

interface LocationSelectorProps {
  selectedCity: string;
  selectedArea: string;
  onCityChange: (city: string) => void;
  onAreaChange: (area: string) => void;
  showAreaSelector?: boolean;
  required?: boolean;
  cityLabel?: string;
  areaLabel?: string;
}

const LocationSelector = ({
  selectedCity,
  selectedArea,
  onCityChange,
  onAreaChange,
  showAreaSelector = true,
  required = false,
  cityLabel = "City",
  areaLabel = "Area",
}: LocationSelectorProps) => {
  const { t, i18n } = useTranslation();
  const [areas, setAreas] = useState<string[]>([]);

  useEffect(() => {
    if (selectedCity) {
      const cityAreas = getAreasForCity(selectedCity);
      setAreas(cityAreas);
      // Reset area when city changes
      if (!cityAreas.includes(selectedArea)) {
        onAreaChange("");
      }
    } else {
      setAreas([]);
      onAreaChange("");
    }
  }, [selectedCity]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {cityLabel} {required && "*"}
        </Label>
        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger>
            <SelectValue placeholder={t("locationSelector.selectCityPlaceholder", "Select a city...")} />
          </SelectTrigger>
          <SelectContent>
            {cyprusCities.map((city) => (
              <SelectItem key={city.name} value={city.name}>
                {getCityDisplayName(city.name, i18n.language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showAreaSelector && selectedCity && areas.length > 0 && (
        <div className="space-y-2">
          <Label>{areaLabel}</Label>
          <Select value={selectedArea} onValueChange={onAreaChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("locationSelector.selectAreaPlaceholder", "Select an area (optional)...")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-areas">{t("locationSelector.allAreas", "All areas")}</SelectItem>
              {areas.map((area) => (
                <SelectItem key={area} value={area}>
                  {getCityDisplayName(area, i18n.language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
