import { MapPin, X, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cyprusCities, CyprusArea } from "@/data/cyprusLocations";

interface CityMultiSelectorProps {
  selectedLocations: string[]; // Format: "City" or "City > Area"
  onLocationsChange: (locations: string[]) => void;
  label?: string;
  description?: string;
}

const CityMultiSelector = ({
  selectedLocations,
  onLocationsChange,
  label = "Select Cities/Areas",
  description,
}: CityMultiSelectorProps) => {
  const isLocationSelected = (city: string, area?: string): boolean => {
    if (area) {
      return selectedLocations.includes(`${city} > ${area}`);
    }
    // Check if the whole city is selected
    return selectedLocations.includes(city);
  };

  const isCityFullySelected = (city: CyprusArea): boolean => {
    return selectedLocations.includes(city.name);
  };

  const toggleCity = (cityName: string) => {
    if (selectedLocations.includes(cityName)) {
      // Remove city and all its areas
      const filtered = selectedLocations.filter(
        (loc) => loc !== cityName && !loc.startsWith(`${cityName} > `)
      );
      onLocationsChange(filtered);
    } else {
      // Add the whole city, remove individual areas
      const filtered = selectedLocations.filter(
        (loc) => !loc.startsWith(`${cityName} > `)
      );
      onLocationsChange([...filtered, cityName]);
    }
  };

  const toggleArea = (cityName: string, areaName: string) => {
    const areaKey = `${cityName} > ${areaName}`;

    // If whole city is selected, we don't toggle individual areas
    if (selectedLocations.includes(cityName)) {
      return;
    }

    if (selectedLocations.includes(areaKey)) {
      onLocationsChange(selectedLocations.filter((loc) => loc !== areaKey));
    } else {
      onLocationsChange([...selectedLocations, areaKey]);
    }
  };

  const removeLocation = (location: string) => {
    onLocationsChange(selectedLocations.filter((loc) => loc !== location));
  };

  const getDisplayName = (location: string): string => {
    if (location.includes(" > ")) {
      const [city, area] = location.split(" > ");
      // Shorten city name for display
      const shortCity = city.split(" (")[0];
      return `${area}, ${shortCity}`;
    }
    return location.split(" (")[0]; // Just city name without English name
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="flex items-center gap-2 text-base font-medium">
          <MapPin className="w-4 h-4" />
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Selected locations badges */}
      {selectedLocations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLocations.map((location) => (
            <Badge
              key={location}
              variant="secondary"
              className="pl-3 pr-1 py-1.5 flex items-center gap-1"
            >
              {getDisplayName(location)}
              <button
                onClick={() => removeLocation(location)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* City/Area selection accordion */}
      <div className="border rounded-lg overflow-hidden">
        <Accordion type="multiple" className="w-full">
          {cyprusCities.map((city) => (
            <AccordionItem key={city.name} value={city.name} className="border-b last:border-b-0">
              <div className="flex items-center gap-2 px-4">
                <Checkbox
                  id={`city-${city.name}`}
                  checked={isCityFullySelected(city)}
                  onCheckedChange={() => toggleCity(city.name)}
                  className="data-[state=checked]:bg-primary"
                />
                <AccordionTrigger className="flex-1 py-3 hover:no-underline">
                  <span className="text-sm font-medium">{city.name}</span>
                </AccordionTrigger>
              </div>
              <AccordionContent className="pb-3 pt-0">
                <div className="grid grid-cols-2 gap-2 px-4 pl-10">
                  {city.areas.map((area) => (
                    <label
                      key={area}
                      className={`flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-muted/50 ${
                        isCityFullySelected(city) ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <Checkbox
                        checked={isLocationSelected(city.name, area) || isCityFullySelected(city)}
                        onCheckedChange={() => toggleArea(city.name, area)}
                        disabled={isCityFullySelected(city)}
                        className="data-[state=checked]:bg-primary"
                      />
                      {area}
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {selectedLocations.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No locations selected. Select at least one city or area.
        </p>
      )}
    </div>
  );
};

export default CityMultiSelector;
