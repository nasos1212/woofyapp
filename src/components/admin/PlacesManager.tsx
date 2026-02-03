import { useState, useEffect } from "react";
import { 
  MapPin, 
  Check, 
  X, 
  ExternalLink, 
  Phone,
  Trash2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Place {
  id: string;
  name: string;
  place_type: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  verified: boolean | null;
  created_at: string;
}

const placeTypeLabels: Record<string, string> = {
  beach: "Beach",
  cafe: "Café",
  restaurant: "Restaurant",
  hotel: "Hotel",
  park: "Park",
  other: "Other",
};

const PlacesManager = () => {
  const { toast } = useToast();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "verified" | "all">("pending");

  const fetchPlaces = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("pet_friendly_places")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter === "pending") {
        query = query.or("verified.is.null,verified.eq.false");
      } else if (filter === "verified") {
        query = query.eq("verified", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPlaces(data || []);
    } catch (error) {
      console.error("Error fetching places:", error);
      toast({
        title: "Error",
        description: "Failed to load places.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [filter]);

  const handleVerify = async (placeId: string) => {
    try {
      const { error } = await supabase
        .from("pet_friendly_places")
        .update({ verified: true })
        .eq("id", placeId);

      if (error) throw error;

      toast({
        title: "Place verified ✓",
        description: "The place is now visible to all users.",
      });
      fetchPlaces();
    } catch (error) {
      console.error("Error verifying place:", error);
      toast({
        title: "Error",
        description: "Failed to verify place.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (placeId: string) => {
    try {
      // For now, we'll just delete rejected places
      // You could also add a "rejected" status if you want to keep them
      const { error } = await supabase
        .from("pet_friendly_places")
        .delete()
        .eq("id", placeId);

      if (error) throw error;

      toast({
        title: "Place removed",
        description: "The submission has been deleted.",
      });
      fetchPlaces();
    } catch (error) {
      console.error("Error rejecting place:", error);
      toast({
        title: "Error",
        description: "Failed to remove place.",
        variant: "destructive",
      });
    }
  };

  const pendingCount = places.filter(p => !p.verified).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Pet-Friendly Places
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchPlaces}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="gap-2">
              Pending Review
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : places.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No places to show</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {places.map((place) => (
                      <TableRow key={place.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{place.name}</p>
                            {place.address && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {place.address}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {placeTypeLabels[place.place_type] || place.place_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{place.city || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {place.phone && (
                              <a href={`tel:${place.phone}`} className="text-muted-foreground hover:text-foreground">
                                <Phone className="w-4 h-4" />
                              </a>
                            )}
                            {place.website && (
                              <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {!place.phone && !place.website && "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {place.verified ? (
                            <Badge className="bg-green-100 text-green-700">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!place.verified && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleVerify(place.id)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this place?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove "{place.name}" from the database.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleReject(place.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PlacesManager;
