import { useState, useEffect } from "react";
import { Dog, Cat, HelpCircle, Upload, X, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LocationSelector from "@/components/LocationSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatLocation, cyprusCityNames } from "@/data/cyprusLocations";

type AlertType = "lost" | "found";
type PetType = "dog" | "cat" | "other";

interface AlertData {
  id: string;
  pet_name: string;
  pet_description: string;
  pet_breed: string | null;
  pet_type: PetType;
  alert_type: AlertType;
  last_seen_location: string;
  last_seen_date: string;
  contact_phone: string | null;
  contact_email: string | null;
  reward_offered: string | null;
}

interface ExistingPhoto {
  id: string;
  photo_url: string;
  display_order: number;
  photo_position: number | null;
}

interface EditAlertDialogProps {
  alert: AlertData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const EditAlertDialog = ({ alert, open, onOpenChange, onSaved }: EditAlertDialogProps) => {
  const [petName, setPetName] = useState("");
  const [petDescription, setPetDescription] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petType, setPetType] = useState<PetType>("dog");
  const [lastSeenCity, setLastSeenCity] = useState("");
  const [lastSeenArea, setLastSeenArea] = useState("");
  const [lastSeenDetails, setLastSeenDetails] = useState("");
  const [lastSeenDate, setLastSeenDate] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [rewardOffered, setRewardOffered] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Existing photos from DB
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [photosToRemove, setPhotosToRemove] = useState<string[]>([]);
  // New photos to add
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [newPhotoPositions, setNewPhotoPositions] = useState<number[]>([]);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const MAX_PHOTOS = 3;

  useEffect(() => {
    if (alert && open) {
      setPetName(alert.pet_name);
      setPetDescription(alert.pet_description);
      setPetBreed(alert.pet_breed || "");
      setPetType(alert.pet_type || "dog");
      setContactPhone(alert.contact_phone || "");
      setContactEmail(alert.contact_email || "");
      setRewardOffered(alert.reward_offered || "");

      // Parse location
      const locationParts = alert.last_seen_location.split(" - ");
      const mainLocation = locationParts[0] || "";
      const details = locationParts.slice(1).join(" - ");
      setLastSeenDetails(details);

      // Try to parse city/area from the main location
      const parsed = parseLocation(mainLocation);
      setLastSeenCity(parsed.city);
      setLastSeenArea(parsed.area || "");

      // Parse date
      const date = new Date(alert.last_seen_date);
      setLastSeenDate(date.toISOString().split("T")[0]);

      // Fetch existing photos
      fetchExistingPhotos(alert.id);

      // Reset new photo state
      setNewPhotos([]);
      setNewPhotoPreviews([]);
      setNewPhotoPositions([]);
      setPhotosToRemove([]);
      setEditingPhotoIndex(null);
    }
  }, [alert, open]);

  const fetchExistingPhotos = async (alertId: string) => {
    const { data } = await supabase
      .from("lost_pet_alert_photos")
      .select("id, photo_url, display_order, photo_position")
      .eq("alert_id", alertId)
      .order("display_order");
    setExistingPhotos((data || []) as ExistingPhoto[]);
  };

  const handleNewPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const currentTotal = existingPhotos.filter(p => !photosToRemove.includes(p.id)).length + newPhotos.length;
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      if (currentTotal + newFiles.length >= MAX_PHOTOS) {
        toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
        break;
      }
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setNewPhotos(prev => [...prev, ...newFiles]);
    setNewPhotoPreviews(prev => [...prev, ...newPreviews]);
    setNewPhotoPositions(prev => [...prev, ...newFiles.map(() => 50)]);
    e.target.value = "";
  };

  const removeExistingPhoto = (photoId: string) => {
    setPhotosToRemove(prev => [...prev, photoId]);
  };

  const removeNewPhoto = (index: number) => {
    URL.revokeObjectURL(newPhotoPreviews[index]);
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    setNewPhotoPositions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alert) return;

    if (alert.alert_type === "lost" && !petName) {
      toast.error("Please enter the pet's name");
      return;
    }
    if (!petDescription || !lastSeenCity || !lastSeenDate || !contactPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    const remainingExisting = existingPhotos.filter(p => !photosToRemove.includes(p.id)).length;
    if (remainingExisting + newPhotos.length === 0) {
      toast.error("Please keep at least one photo");
      return;
    }

    setIsSaving(true);
    try {
      const locationParts = [formatLocation(lastSeenCity, lastSeenArea === "all-areas" ? "" : lastSeenArea)];
      if (lastSeenDetails.trim()) locationParts.push(lastSeenDetails.trim());
      const lastSeenLocation = locationParts.join(" - ");

      const dateObj = new Date(alert.last_seen_date);
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const lastSeenDateTime = new Date(`${lastSeenDate}T${hours}:${minutes}:00`);

      // Update the alert
      const { error } = await supabase
        .from("lost_pet_alerts")
        .update({
          pet_name: petName || `Found ${petType === "dog" ? "Dog" : petType === "cat" ? "Cat" : "Pet"}`,
          pet_description: petDescription,
          pet_breed: petBreed || null,
          pet_type: petType,
          last_seen_location: lastSeenLocation,
          last_seen_date: lastSeenDateTime.toISOString(),
          contact_phone: contactPhone,
          contact_email: contactEmail || null,
          reward_offered: alert.alert_type === "lost" ? rewardOffered || null : null,
        })
        .eq("id", alert.id);

      if (error) throw error;

      // Remove deleted photos
      if (photosToRemove.length > 0) {
        await supabase
          .from("lost_pet_alert_photos")
          .delete()
          .in("id", photosToRemove);
      }

      // Upload new photos
      if (newPhotos.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const startOrder = remainingExisting;
        for (let i = 0; i < newPhotos.length; i++) {
          const photo = newPhotos[i];
          const fileExt = photo.name.split(".").pop();
          const fileName = `${user.id}-${Date.now()}-${i}.${fileExt}`;
          const filePath = `lost-pets/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("lost-pet-photos")
            .upload(filePath, photo);
          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("lost-pet-photos")
            .getPublicUrl(filePath);

          await supabase.from("lost_pet_alert_photos").insert({
            alert_id: alert.id,
            photo_url: urlData.publicUrl,
            display_order: startOrder + i,
            photo_position: newPhotoPositions[i] ?? 50,
          });
        }
      }

      // Update main photo_url if the first photo changed
      const keptPhotos = existingPhotos.filter(p => !photosToRemove.includes(p.id));
      if (keptPhotos.length > 0) {
        await supabase
          .from("lost_pet_alerts")
          .update({ pet_photo_url: keptPhotos[0].photo_url })
          .eq("id", alert.id);
      } else if (newPhotos.length > 0) {
        // The first new photo becomes main — refetch to get URL
        const { data: photos } = await supabase
          .from("lost_pet_alert_photos")
          .select("photo_url")
          .eq("alert_id", alert.id)
          .order("display_order")
          .limit(1);
        if (photos && photos[0]) {
          await supabase
            .from("lost_pet_alerts")
            .update({ pet_photo_url: photos[0].photo_url })
            .eq("id", alert.id);
        }
      }

      toast.success("Alert updated successfully!");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error("Error updating alert:", error);
      toast.error("Failed to update alert");
    } finally {
      setIsSaving(false);
    }
  };

  const visibleExistingPhotos = existingPhotos.filter(p => !photosToRemove.includes(p.id));
  const totalPhotos = visibleExistingPhotos.length + newPhotos.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Alert</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-4">
          {/* Pet Type */}
          <div className="space-y-2">
            <Label>Type of Pet</Label>
            <div className="flex gap-2">
              <Button type="button" variant={petType === "dog" ? "default" : "outline"} size="sm" onClick={() => setPetType("dog")} className="gap-1">
                <Dog className="w-4 h-4" /> Dog
              </Button>
              <Button type="button" variant={petType === "cat" ? "default" : "outline"} size="sm" onClick={() => setPetType("cat")} className="gap-1">
                <Cat className="w-4 h-4" /> Cat
              </Button>
              <Button type="button" variant={petType === "other" ? "default" : "outline"} size="sm" onClick={() => setPetType("other")} className="gap-1">
                <HelpCircle className="w-4 h-4" /> Other
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{alert?.alert_type === "lost" ? "Pet Name *" : "Pet Name (if known)"}</Label>
            <Input value={petName} onChange={(e) => setPetName(e.target.value)} required={alert?.alert_type === "lost"} />
          </div>

          <div className="space-y-2">
            <Label>Breed (if known)</Label>
            <Input value={petBreed} onChange={(e) => setPetBreed(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea value={petDescription} onChange={(e) => setPetDescription(e.target.value)} required />
          </div>

          <LocationSelector
            selectedCity={lastSeenCity}
            selectedArea={lastSeenArea}
            onCityChange={setLastSeenCity}
            onAreaChange={setLastSeenArea}
            showAreaSelector={true}
            required={true}
            cityLabel={alert?.alert_type === "lost" ? "Last Seen City" : "Found Location City"}
            areaLabel="Area"
          />

          <div className="space-y-2">
            <Label>Additional Location Details</Label>
            <Input value={lastSeenDetails} onChange={(e) => setLastSeenDetails(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{alert?.alert_type === "lost" ? "Last Seen Date *" : "Date Found *"}</Label>
            <Input
              type="date"
              value={lastSeenDate}
              onChange={(e) => {
                const today = new Date().toISOString().split('T')[0];
                if (e.target.value > today) {
                  toast.error("Date cannot be in the future");
                  return;
                }
                setLastSeenDate(e.target.value);
              }}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos (up to {MAX_PHOTOS})</Label>

            {(visibleExistingPhotos.length > 0 || newPhotoPreviews.length > 0) && (
              <div className="grid grid-cols-3 gap-3 mb-2">
                {visibleExistingPhotos.map((photo, idx) => (
                  <div key={photo.id} className="relative group">
                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-border bg-muted">
                      <img
                        src={photo.photo_url}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: `center ${photo.photo_position ?? 50}%` }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1.5 right-1.5 h-6 w-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        onClick={() => removeExistingPhoto(photo.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      {idx === 0 && newPhotoPreviews.length === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-medium px-1.5 py-0.5 rounded-md shadow">Main</span>
                      )}
                    </div>
                  </div>
                ))}
                {newPhotoPreviews.map((preview, idx) => (
                  <div key={`new-${idx}`} className="relative group">
                    <div
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-primary/40 bg-muted cursor-pointer"
                      onClick={() => setEditingPhotoIndex(editingPhotoIndex === idx ? null : idx)}
                    >
                      <img
                        src={preview}
                        alt={`New photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: `center ${newPhotoPositions[idx] ?? 50}%` }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1.5 right-1.5 h-6 w-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        onClick={(e) => { e.stopPropagation(); removeNewPhoto(idx); }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <span className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md shadow">New</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Position adjuster for new photos */}
            {editingPhotoIndex !== null && newPhotoPreviews[editingPhotoIndex] && (
              <div className="p-4 bg-muted/50 border rounded-xl mb-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-primary flex-shrink-0">
                    <img src={newPhotoPreviews[editingPhotoIndex]} alt="Editing" className="w-full h-full object-cover" style={{ objectPosition: `center ${newPhotoPositions[editingPhotoIndex] ?? 50}%` }} />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Adjust New Photo</Label>
                    <p className="text-xs text-muted-foreground">Slide to adjust visible area</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setNewPhotoPositions(prev => { const n = [...prev]; n[editingPhotoIndex!] = Math.max(0, (n[editingPhotoIndex!] ?? 50) - 10); return n; })}>
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <input type="range" min="0" max="100" value={newPhotoPositions[editingPhotoIndex] ?? 50} onChange={(e) => { const v = parseInt(e.target.value); setNewPhotoPositions(prev => { const n = [...prev]; n[editingPhotoIndex!] = v; return n; }); }} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setNewPhotoPositions(prev => { const n = [...prev]; n[editingPhotoIndex!] = Math.min(100, (n[editingPhotoIndex!] ?? 50) + 10); return n; })}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <Button type="button" variant="ghost" size="sm" className="w-full mt-3 text-muted-foreground" onClick={() => setEditingPhotoIndex(null)}>Done adjusting</Button>
              </div>
            )}

            {totalPhotos < MAX_PHOTOS && (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">
                  Add more ({totalPhotos}/{MAX_PHOTOS})
                </span>
                <input type="file" accept="image/*" multiple onChange={handleNewPhotoSelect} className="hidden" />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Phone *</Label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
          </div>

          {alert?.alert_type === "lost" && (
            <div className="space-y-2">
              <Label>Reward Offered (optional)</Label>
              <Input value={rewardOffered} onChange={(e) => setRewardOffered(e.target.value)} />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAlertDialog;
