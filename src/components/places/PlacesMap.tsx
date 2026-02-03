import { useEffect, useState, useRef } from "react";
import { MapPin, Phone, Globe, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DogLoader from "@/components/DogLoader";

interface Place {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  place_type: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  is_24_hour: boolean | null;
  is_emergency: boolean | null;
  verified: boolean | null;
  latitude: number;
  longitude: number;
}

interface PlacesMapProps {
  places: Place[];
  placeTypeConfig: Record<string, { label: string; color: string; bgColor: string }>;
}

const PlacesMap = ({ places, placeTypeConfig }: PlacesMapProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapComponents, setMapComponents] = useState<any>(null);
  const [leaflet, setLeaflet] = useState<any>(null);
  
  // Cyprus center coordinates
  const cyprusCenter: [number, number] = [35.1264, 33.4299];

  useEffect(() => {
    // Dynamically import Leaflet and react-leaflet
    const loadMapDependencies = async () => {
      try {
        // Import CSS
        await import("leaflet/dist/leaflet.css");
        
        // Import Leaflet
        const L = await import("leaflet");
        
        // Fix for default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
        
        // Import react-leaflet components
        const reactLeaflet = await import("react-leaflet");
        
        setLeaflet(L);
        setMapComponents(reactLeaflet);
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load map dependencies:", error);
      }
    };

    loadMapDependencies();
  }, []);

  const getPlaceConfig = (type: string) => {
    return placeTypeConfig[type] || { label: "Other", color: "text-gray-600", bgColor: "bg-gray-100" };
  };

  if (!isLoaded || !mapComponents || !leaflet) {
    return (
      <div className="flex items-center justify-center py-12 bg-white rounded-2xl shadow-soft h-[500px]">
        <DogLoader size="md" />
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, useMap } = mapComponents;

  // Component to fit bounds
  const FitBounds = ({ places }: { places: Place[] }) => {
    const map = useMap();
    
    useEffect(() => {
      if (places.length > 0) {
        const bounds = leaflet.latLngBounds(
          places.map((p: Place) => [p.latitude, p.longitude] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }, [places, map]);
    
    return null;
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-soft bg-white">
      <MapContainer
        center={cyprusCenter}
        zoom={9}
        style={{ height: "500px", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds places={places} />
        
        {places.map((place) => {
          const config = getPlaceConfig(place.place_type);
          
          return (
            <Marker key={place.id} position={[place.latitude, place.longitude]}>
              <Popup className="place-popup" maxWidth={300}>
                <div className="p-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {place.name}
                    </h3>
                    {place.verified && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    <Badge variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                    {place.is_24_hour && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                        <Clock className="w-3 h-3 mr-1" />
                        24h
                      </Badge>
                    )}
                    {place.is_emergency && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Emergency
                      </Badge>
                    )}
                  </div>
                  
                  {place.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {place.description}
                    </p>
                  )}
                  
                  {(place.address || place.city) && (
                    <div className="flex items-start gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {[place.address, place.city].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                  
                  {place.rating && (
                    <div className="flex items-center gap-1 text-xs mb-2">
                      <span className="text-yellow-500">★</span>
                      <span>{place.rating.toFixed(1)}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-1 pt-2 border-t">
                    {place.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => window.open(`tel:${place.phone}`, "_self")}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    )}
                    {place.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => window.open(place.website!, "_blank")}
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        Website
                      </Button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default PlacesMap;
