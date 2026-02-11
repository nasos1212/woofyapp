import { useState, useEffect } from "react";
import {
  MapPin, 
  Check, 
  ExternalLink, 
  Phone,
  Trash2,
  RefreshCw,
  Pencil,
  Plus,
  Eye,
  Clock,
  AlertTriangle,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cyprusCityNames, getAreasForCity, getCoordinatesForLocation } from "@/data/cyprusLocations";

interface Place {
  id: string;
  name: string;
  place_type: string;
  city: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  verified: boolean | null;
  latitude: number;
  longitude: number;
  is_24_hour: boolean | null;
  is_emergency: boolean | null;
  created_at: string;
  google_maps_url: string | null;
}

interface PlaceFormData {
  name: string;
  place_type: string;
  city: string;
  area: string;
  phone: string;
  website: string;
  description: string;
  google_maps_link: string;
  is_24_hour: boolean;
  is_emergency: boolean;
  verified: boolean;
}

const placeTypeLabels: Record<string, string> = {
  beach: "Beach",
  cafe: "Café",
  restaurant: "Restaurant",
  hotel: "Hotel",
  park: "Park",
  other: "Other",
};

const defaultFormData: PlaceFormData = {
  name: "",
  place_type: "cafe",
  city: "",
  area: "",
  phone: "",
  website: "",
  description: "",
  google_maps_link: "",
  is_24_hour: false,
  is_emergency: false,
  verified: true,
};

const PlacesManager = () => {
  const { toast } = useToast();
  const [places, setPlaces] = useState<Place[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "verified" | "all">("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [formData, setFormData] = useState<PlaceFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingPlace, setViewingPlace] = useState<Place | null>(null);

  const fetchPlaces = async () => {
    setIsLoading(true);
    try {
      // Always fetch pending count first
      const { count: pending } = await supabase
        .from("pet_friendly_places")
        .select("*", { count: "exact", head: true })
        .or("verified.is.null,verified.eq.false");
      
      setPendingCount(pending || 0);

      // Then fetch filtered places
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

  const handleEdit = (place: Place) => {
    setEditingPlace(place);
    setFormData({
      name: place.name,
      place_type: place.place_type,
      city: place.city || "",
      area: place.area || "",
      phone: place.phone || "",
      website: place.website || "",
      description: place.description || "",
      google_maps_link: place.google_maps_url || "",
      is_24_hour: place.is_24_hour || false,
      is_emergency: place.is_emergency || false,
      verified: place.verified || false,
    });
    setEditDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingPlace(null);
    setFormData(defaultFormData);
    setEditDialogOpen(true);
  };

  const handleView = (place: Place) => {
    setViewingPlace(place);
    setViewDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const fallbackCoords = getCoordinatesForLocation(formData.city, formData.area);
      const placeData = {
        name: formData.name.trim(),
        place_type: formData.place_type,
        city: formData.city || null,
        area: formData.area || null,
        phone: formData.phone || null,
        website: formData.website || null,
        description: formData.description || null,
        google_maps_url: formData.google_maps_link || null,
        latitude: fallbackCoords.lat,
        longitude: fallbackCoords.lng,
        is_24_hour: formData.is_24_hour,
        is_emergency: formData.is_emergency,
        verified: formData.verified,
      };

      if (editingPlace) {
        // Update existing
        const { error } = await supabase
          .from("pet_friendly_places")
          .update(placeData)
          .eq("id", editingPlace.id);

        if (error) throw error;

        toast({
          title: "Place updated ✓",
          description: `"${formData.name}" has been updated.`,
        });
      } else {
        // Create new
        const { error } = await supabase
          .from("pet_friendly_places")
          .insert(placeData);

        if (error) throw error;

        toast({
          title: "Place added ✓",
          description: `"${formData.name}" has been created.`,
        });
      }

      setEditDialogOpen(false);
      fetchPlaces();
    } catch (error) {
      console.error("Error saving place:", error);
      toast({
        title: "Error",
        description: "Failed to save place.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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

  

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MapPin className="w-5 h-5 shrink-0" />
              Pet-Friendly Places
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchPlaces} className="flex-1 sm:flex-none">
                <RefreshCw className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button size="sm" onClick={handleAddNew} className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Place</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="mb-4 w-full sm:w-auto grid grid-cols-3 sm:flex">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="verified" className="text-xs sm:text-sm">Verified</TabsTrigger>
              <TabsTrigger value="pending" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <span className="hidden sm:inline">Pending Review</span>
                <span className="sm:hidden">Pending</span>
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
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
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleView(place)}
                                  title="View details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(place)}
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
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

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {places.map((place) => (
                      <div
                        key={place.id}
                        className="p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{place.name}</p>
                            {place.address && (
                              <p className="text-xs text-muted-foreground truncate">
                                {place.address}
                              </p>
                            )}
                          </div>
                          {place.verified ? (
                            <Badge className="bg-green-100 text-green-700 shrink-0 text-xs">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              Pending
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {placeTypeLabels[place.place_type] || place.place_type}
                          </Badge>
                          {place.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {place.city}
                            </span>
                          )}
                          {place.phone && (
                            <a href={`tel:${place.phone}`} className="flex items-center gap-1 hover:text-foreground">
                              <Phone className="w-3 h-3" />
                              Call
                            </a>
                          )}
                          {place.website && (
                            <a href={place.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                              <ExternalLink className="w-3 h-3" />
                              Website
                            </a>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(place)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(place)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {!place.verified && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
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
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="mx-4 max-w-[calc(100%-2rem)]">
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
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {viewingPlace?.name}
            </DialogTitle>
            <DialogDescription>
              Full details for this pet-friendly place
            </DialogDescription>
          </DialogHeader>

          {viewingPlace && (
            <div className="space-y-4 py-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                {viewingPlace.verified ? (
                  <Badge className="bg-green-100 text-green-700">Verified</Badge>
                ) : (
                  <Badge variant="secondary">Pending Review</Badge>
                )}
              </div>

              {/* Type & City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Type</span>
                  <p className="mt-1">
                    <Badge variant="outline">
                      {placeTypeLabels[viewingPlace.place_type] || viewingPlace.place_type}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">City</span>
                  <p className="mt-1">{viewingPlace.city || "Not specified"}</p>
                </div>
              </div>

              {/* Area */}
              <div>
                <span className="text-sm font-medium text-muted-foreground">Area / Neighborhood</span>
                <p className="mt-1">{viewingPlace.area || "Not specified"}</p>
              </div>

              {/* Address */}
              <div>
                <span className="text-sm font-medium text-muted-foreground">Address</span>
                <p className="mt-1">{viewingPlace.address || "Not provided"}</p>
              </div>

              {/* Description */}
              <div>
                <span className="text-sm font-medium text-muted-foreground">Description</span>
                <p className="mt-1 text-sm">{viewingPlace.description || "No description provided"}</p>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Phone</span>
                  <p className="mt-1">
                    {viewingPlace.phone ? (
                      <a href={`tel:${viewingPlace.phone}`} className="text-primary hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {viewingPlace.phone}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Website</span>
                  <p className="mt-1">
                    {viewingPlace.website ? (
                      <a 
                        href={viewingPlace.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline flex items-center gap-1 break-all"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{viewingPlace.website}</span>
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                </div>
              </div>

              {/* Google Maps Link */}
              <div>
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  Location
                </span>
                {viewingPlace.google_maps_url ? (
                  <a
                    href={viewingPlace.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in Google Maps →
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">No map link provided</p>
                )}
              </div>

              {/* Special Flags */}
              <div className="flex flex-wrap gap-2">
                {viewingPlace.is_24_hour && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Open 24 Hours
                  </Badge>
                )}
                {viewingPlace.is_emergency && (
                  <Badge variant="outline" className="flex items-center gap-1 text-red-600 border-red-200">
                    <AlertTriangle className="w-3 h-3" />
                    Emergency Service
                  </Badge>
                )}
              </div>

              {/* Submission Date */}
              <div>
                <span className="text-sm font-medium text-muted-foreground">Submitted</span>
                <p className="mt-1 text-sm">
                  {new Date(viewingPlace.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {viewingPlace && !viewingPlace.verified && (
              <Button
                onClick={() => {
                  handleVerify(viewingPlace.id);
                  setViewDialogOpen(false);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve Place
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (viewingPlace) handleEdit(viewingPlace);
                setViewDialogOpen(false);
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="ghost" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Add Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlace ? "Edit Place" : "Add New Place"}
            </DialogTitle>
            <DialogDescription>
              {editingPlace 
                ? "Update the details below." 
                : "Fill in the details to add a new pet-friendly place."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Paws & Coffee"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.place_type} 
                  onValueChange={(v) => setFormData({ ...formData, place_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(placeTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Select 
                  value={formData.city} 
                  onValueChange={(v) => setFormData({ ...formData, city: v, area: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cyprusCityNames.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Area - only show if city is selected */}
            {formData.city && getAreasForCity(formData.city).length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="area">Area / Neighborhood</Label>
                <Select 
                  value={formData.area} 
                  onValueChange={(v) => setFormData({ ...formData, area: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAreasForCity(formData.city).map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Helps place the pin more accurately</p>
              </div>
            )}

            {/* Google Maps Link */}
            <div className="grid gap-2">
              <Label htmlFor="google_maps_link">Google Maps Link *</Label>
              <Input
                id="google_maps_link"
                type="url"
                placeholder="e.g. https://maps.app.goo.gl/YSWaKyiCztHkoiXa7"
                value={formData.google_maps_link}
                onChange={(e) => setFormData({ ...formData, google_maps_link: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Open the place in Google Maps, click "Share" and paste the link here
              </p>
            </div>

            {/* Phone */}
            <div className="grid gap-2">
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
            <div className="grid gap-2">
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
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell us what makes this place pet-friendly..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="verified">Verified</Label>
                <Switch
                  id="verified"
                  checked={formData.verified}
                  onCheckedChange={(checked) => setFormData({ ...formData, verified: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_24_hour">Open 24 Hours</Label>
                <Switch
                  id="is_24_hour"
                  checked={formData.is_24_hour}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_24_hour: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : editingPlace ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlacesManager;
