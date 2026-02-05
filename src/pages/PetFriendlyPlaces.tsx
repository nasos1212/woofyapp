import { useState, useEffect, lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, Link } from "react-router-dom";
import { 
  MapPin, 
  ArrowLeft, 
  Search, 
  UtensilsCrossed, 
  Waves, 
  Hotel, 
  Coffee,
  TreePine,
  Building2,
  Phone,
  Globe,
  Clock,
  AlertCircle,
  Filter,
  List,
  Map,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import SuggestPlaceDialog from "@/components/SuggestPlaceDialog";
import PlaceRating from "@/components/PlaceRating";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cyprusCityNames } from "@/data/cyprusLocations";

// Lazy load the map component to avoid loading Leaflet until needed
const PlacesMap = lazy(() => import("@/components/places/PlacesMap"));

interface PetFriendlyPlace {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
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

const placeTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  beach: { label: "Beach", icon: Waves, color: "text-cyan-600", bgColor: "bg-cyan-100" },
  cafe: { label: "Café", icon: Coffee, color: "text-amber-600", bgColor: "bg-amber-100" },
  restaurant: { label: "Restaurant", icon: UtensilsCrossed, color: "text-orange-600", bgColor: "bg-orange-100" },
  hotel: { label: "Hotel", icon: Hotel, color: "text-purple-600", bgColor: "bg-purple-100" },
  park: { label: "Park", icon: TreePine, color: "text-green-600", bgColor: "bg-green-100" },
  other: { label: "Other", icon: Building2, color: "text-gray-600", bgColor: "bg-gray-100" },
};

const PetFriendlyPlaces = () => {
  const { user, loading } = useAuth();
  const [places, setPlaces] = useState<PetFriendlyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const fetchPlaces = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("pet_friendly_places")
        .select("*")
        .eq("verified", true)
        .order("name", { ascending: true });

      if (error) throw error;
      setPlaces(data || []);
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  // Filter places based on search, type, and city
  const filteredPlaces = places.filter((place) => {
    const matchesSearch = 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === "all" || place.place_type === selectedType;
    
    const matchesCity = selectedCity === "all" || 
      place.city?.toLowerCase().includes(selectedCity.toLowerCase().split(" (")[0]);

    return matchesSearch && matchesType && matchesCity;
  });

  // Get unique place types from data
  const availableTypes = [...new Set(places.map(p => p.place_type))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getPlaceConfig = (type: string) => {
    return placeTypeConfig[type] || placeTypeConfig.other;
  };

  return (
    <>
      <Helmet>
        <title>Pet-Friendly Places | Wooffy</title>
        <meta name="description" content="Discover pet-friendly beaches, cafés, hotels, and more in Cyprus." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-wooffy-light to-background overflow-x-hidden">
        <Header />

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-[calc(6rem+env(safe-area-inset-top))] box-border">
          {/* Header */}
          <div className="mb-8">
            <Link to="/member" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    Pet-Friendly Places
                  </h1>
                  <p className="text-muted-foreground">
                    Discover where your furry friend is welcome in Cyprus
                  </p>
                </div>
              </div>
              <SuggestPlaceDialog onPlaceAdded={fetchPlaces} />
            </div>
          </div>

          {/* Filters and View Toggle */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-soft mb-6">
            {/* View Toggle */}
            <div className="flex justify-end mb-4">
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && setViewMode(value as "list" | "map")}
                className="bg-muted rounded-lg p-1"
              >
                <ToggleGroupItem value="list" aria-label="List view" className="px-3 data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-foreground">
                  <List className="w-4 h-4 mr-2" />
                  List
                </ToggleGroupItem>
                <ToggleGroupItem value="map" aria-label="Map view" className="px-3 data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-foreground">
                  <Map className="w-4 h-4 mr-2" />
                  Map
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search places..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {availableTypes.map((type) => {
                    const config = getPlaceConfig(type);
                    return (
                      <SelectItem key={type} value={type}>
                        {config.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* City Filter */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cyprusCityNames.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <DogLoader size="md" />
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-soft text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {places.length === 0 ? "No places yet" : "No places found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {places.length === 0 
                  ? "Pet-friendly places will be added soon. Check back later!"
                  : "Try adjusting your filters or search query."}
              </p>
              {places.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedType("all");
                    setSelectedCity("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : viewMode === "map" ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {filteredPlaces.length} {filteredPlaces.length === 1 ? "place" : "places"} on map
              </p>
              <Suspense fallback={
                <div className="flex items-center justify-center py-12 bg-white rounded-2xl shadow-soft">
                  <DogLoader size="md" />
                </div>
              }>
                <PlacesMap places={filteredPlaces} placeTypeConfig={placeTypeConfig} />
              </Suspense>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {filteredPlaces.length} {filteredPlaces.length === 1 ? "place" : "places"}
              </p>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlaces.map((place) => {
                  const config = getPlaceConfig(place.place_type);
                  const IconComponent = config.icon;
                  
                  return (
                    <div
                      key={place.id}
                      className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-md transition-shadow"
                    >
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className={`w-6 h-6 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {place.name}
                            </h3>
                            {place.verified && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 flex-shrink-0">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
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
                        </div>
                      </div>

                      {/* Description */}
                      {place.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {place.description}
                        </p>
                      )}

                      {/* Location */}
                      {(place.address || place.area || place.city) && (
                        <a 
                          href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 text-sm text-muted-foreground mb-3 hover:text-primary transition-colors group"
                        >
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:text-primary" />
                          <span className="line-clamp-2 group-hover:underline">
                            {[place.address, place.area, place.city].filter(Boolean).join(", ")}
                          </span>
                        </a>
                      )}

                      {/* Rating */}
                      <div className="mb-3">
                        <PlaceRating 
                          placeId={place.id} 
                          currentRating={place.rating} 
                          onRatingChange={fetchPlaces}
                          size="sm"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t flex-wrap">
                        {/* Google Maps Button - always show */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(`https://www.google.com/maps?q=${place.latitude},${place.longitude}`, "_blank")}
                        >
                          <Navigation className="w-4 h-4 mr-1" />
                          Directions
                        </Button>
                        {place.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(`tel:${place.phone}`, "_self")}
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                        )}
                        {place.website && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(place.website!, "_blank")}
                          >
                            <Globe className="w-4 h-4 mr-1" />
                            Website
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default PetFriendlyPlaces;
