import { Plus, Trash2, MapPin, Phone, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cyprusCities } from "@/data/cyprusLocations";

export interface BusinessLocation {
  id?: string;
  city: string;
  address: string;
  phone: string;
  google_maps_url: string;
}

interface BusinessLocationManagerProps {
  locations: BusinessLocation[];
  onLocationsChange: (locations: BusinessLocation[]) => void;
  primaryLocation?: {
    city: string;
    address: string;
    phone: string;
    google_maps_url: string;
  };
  onPrimaryLocationChange?: (location: {
    city: string;
    address: string;
    phone: string;
    google_maps_url: string;
  }) => void;
}

const BusinessLocationManager = ({
  locations,
  onLocationsChange,
  primaryLocation,
  onPrimaryLocationChange,
}: BusinessLocationManagerProps) => {
  const addLocation = () => {
    onLocationsChange([
      ...locations,
      { city: "", address: "", phone: "", google_maps_url: "" },
    ]);
  };

  const updateLocation = (index: number, field: keyof BusinessLocation, value: string) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    onLocationsChange(updated);
  };

  const removeLocation = (index: number) => {
    onLocationsChange(locations.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Primary Location */}
      {primaryLocation && onPrimaryLocationChange && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <Label className="font-semibold">Primary Location</Label>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">City *</Label>
                <Select
                  value={primaryLocation.city}
                  onValueChange={(city) =>
                    onPrimaryLocationChange({ ...primaryLocation, city })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cyprusCities.map((city) => (
                      <SelectItem key={city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Street address"
                      value={primaryLocation.address}
                      onChange={(e) =>
                        onPrimaryLocationChange({ ...primaryLocation, address: e.target.value })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="+353 1 234 5678"
                      value={primaryLocation.phone}
                      onChange={(e) =>
                        onPrimaryLocationChange({ ...primaryLocation, phone: e.target.value })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Google Maps Link</Label>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="https://maps.google.com/..."
                    value={primaryLocation.google_maps_url}
                    onChange={(e) =>
                      onPrimaryLocationChange({ ...primaryLocation, google_maps_url: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Locations */}
      {locations.map((location, index) => (
        <Card key={index} className="relative">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  {primaryLocation ? index + 2 : index + 1}
                </div>
                <Label className="font-semibold">
                  {primaryLocation ? "Additional Location" : `Location ${index + 1}`}
                </Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLocation(index)}
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">City *</Label>
                <Select
                  value={location.city}
                  onValueChange={(city) => updateLocation(index, "city", city)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cyprusCities.map((city) => (
                      <SelectItem key={city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Street address"
                      value={location.address}
                      onChange={(e) => updateLocation(index, "address", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="+353 1 234 5678"
                      value={location.phone}
                      onChange={(e) => updateLocation(index, "phone", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Google Maps Link</Label>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="https://maps.google.com/..."
                    value={location.google_maps_url}
                    onChange={(e) => updateLocation(index, "google_maps_url", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Location Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addLocation}
        className="w-full border-dashed gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Another Store Location
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        Have multiple stores? Add each location with its specific address and phone number.
      </p>
    </div>
  );
};

export default BusinessLocationManager;
