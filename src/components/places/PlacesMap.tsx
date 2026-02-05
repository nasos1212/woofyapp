import { useEffect, useRef, useState } from "react";
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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const getPlaceConfig = (type: string) => {
    return placeTypeConfig[type] || { label: "Other", color: "text-gray-600", bgColor: "bg-gray-100" };
  };

  useEffect(() => {
    let map: any = null;
    
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      
      try {
        // Import Leaflet CSS
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

        // Cyprus center coordinates and bounds
        const cyprusCenter: [number, number] = [35.1264, 33.4299];
        const cyprusBounds: [[number, number], [number, number]] = [
          [34.4, 32.2],  // Southwest corner
          [35.7, 34.6]   // Northeast corner
        ];
        
        // Initialize map with bounds restricted to Cyprus
        map = L.map(mapRef.current, {
          minZoom: 9,
          maxBounds: cyprusBounds,
          maxBoundsViscosity: 1.0,
        }).setView(cyprusCenter, 10);
        mapInstanceRef.current = map;
        
        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add markers for each place
        const markers: any[] = [];
        
        // Filter places to only show those within Cyprus bounds
        const cyprusPlaces = places.filter(place => 
          place.latitude >= 34.4 && place.latitude <= 35.7 &&
          place.longitude >= 32.2 && place.longitude <= 34.6
        );
        
        cyprusPlaces.forEach((place) => {
          const config = getPlaceConfig(place.place_type);
          
          const popupContent = `
            <div style="min-width: 200px; max-width: 280px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <strong style="font-size: 14px;">${place.name}</strong>
                ${place.verified ? '<span style="background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Verified</span>' : ''}
              </div>
              
              <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
                <span style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${config.label}</span>
                ${place.is_24_hour ? '<span style="background: #dbeafe; color: #2563eb; padding: 2px 8px; border-radius: 4px; font-size: 11px;">24h</span>' : ''}
                ${place.is_emergency ? '<span style="background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Emergency</span>' : ''}
              </div>
              
              ${place.description ? `<p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${place.description.substring(0, 100)}${place.description.length > 100 ? '...' : ''}</p>` : ''}
              
              ${(place.address || place.city) ? `
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                  📍 ${[place.address, place.city].filter(Boolean).join(", ")}
                </p>
              ` : ''}
              
              ${place.rating ? `
                <p style="font-size: 12px; margin-bottom: 8px;">
                  ⭐ ${place.rating.toFixed(1)}
                </p>
              ` : ''}
              
              <div style="display: flex; gap: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                ${place.phone ? `<a href="tel:${place.phone}" style="flex: 1; text-align: center; padding: 6px; background: #f3f4f6; border-radius: 6px; font-size: 12px; text-decoration: none; color: inherit;">📞 Call</a>` : ''}
                ${place.website ? `<a href="${place.website}" target="_blank" style="flex: 1; text-align: center; padding: 6px; background: #f3f4f6; border-radius: 6px; font-size: 12px; text-decoration: none; color: inherit;">🌐 Website</a>` : ''}
              </div>
            </div>
          `;
          
          const marker = L.marker([place.latitude, place.longitude])
            .addTo(map)
            .bindPopup(popupContent);
          
          markers.push(marker);
        });
        
        // Fit bounds if there are places, but stay within Cyprus
        if (places.length > 0 && markers.length > 0) {
          const group = L.featureGroup(markers);
          const bounds = group.getBounds();
          // Only fit if bounds are valid and within Cyprus
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
          }
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to initialize map:", error);
      }
    };

    initMap();
    
    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [places]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-soft bg-white relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <DogLoader size="md" />
        </div>
      )}
      <div 
        ref={mapRef} 
        style={{ height: "500px", width: "100%" }}
        className="z-0"
      />
    </div>
  );
};

export default PlacesMap;
