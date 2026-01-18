import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { validateImageFile, MAX_IMAGE_SIZE } from "@/lib/fileValidation";
import { Plus, Trash2, Edit2, PawPrint, Upload, X } from "lucide-react";

interface AdoptablePet {
  id: string;
  name: string;
  pet_type: string;
  breed: string | null;
  age: string | null;
  gender: string | null;
  description: string | null;
  photo_url: string | null;
  is_available: boolean;
}

interface ShelterAdoptablePetsProps {
  shelterId: string;
}

const ShelterAdoptablePets = ({ shelterId }: ShelterAdoptablePetsProps) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<AdoptablePet | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    pet_type: "dog",
    breed: "",
    age: "",
    gender: "",
    description: "",
    photo_url: "",
  });

  const { data: pets, isLoading } = useQuery({
    queryKey: ['shelter-adoptable-pets', shelterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shelter_adoptable_pets')
        .select('*')
        .eq('shelter_id', shelterId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AdoptablePet[];
    },
    enabled: !!shelterId,
  });

  const addPetMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('shelter_adoptable_pets')
        .insert({
          shelter_id: shelterId,
          name: data.name,
          pet_type: data.pet_type,
          breed: data.breed || null,
          age: data.age || null,
          gender: data.gender || null,
          description: data.description || null,
          photo_url: data.photo_url || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelter-adoptable-pets'] });
      toast.success("Pet added successfully!");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Add pet error:', error);
      toast.error("Failed to add pet");
    },
  });

  const updatePetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AdoptablePet> }) => {
      const { error } = await supabase
        .from('shelter_adoptable_pets')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelter-adoptable-pets'] });
      toast.success("Pet updated successfully!");
      resetForm();
      setIsDialogOpen(false);
      setEditingPet(null);
    },
    onError: (error) => {
      console.error('Update pet error:', error);
      toast.error("Failed to update pet");
    },
  });

  const deletePetMutation = useMutation({
    mutationFn: async (petId: string) => {
      const { error } = await supabase
        .from('shelter_adoptable_pets')
        .delete()
        .eq('id', petId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelter-adoptable-pets'] });
      toast.success("Pet removed successfully!");
    },
    onError: (error) => {
      console.error('Delete pet error:', error);
      toast.error("Failed to remove pet");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      pet_type: "dog",
      breed: "",
      age: "",
      gender: "",
      description: "",
      photo_url: "",
    });
    setEditingPet(null);
  };

  const handleEdit = (pet: AdoptablePet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      pet_type: pet.pet_type,
      breed: pet.breed || "",
      age: pet.age || "",
      gender: pet.gender || "",
      description: pet.description || "",
      photo_url: pet.photo_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a name for the pet");
      return;
    }

    if (editingPet) {
      updatePetMutation.mutate({ id: editingPet.id, data: formData });
    } else {
      addPetMutation.mutate(formData);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${shelterId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('shelter-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shelter-photos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, photo_url: publicUrl }));
      toast.success("Photo uploaded!");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const toggleAvailability = (pet: AdoptablePet) => {
    updatePetMutation.mutate({ 
      id: pet.id, 
      data: { is_available: !pet.is_available } 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Pets Available for Adoption</h3>
          <p className="text-sm text-muted-foreground">
            Add pets that are looking for their forever homes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Pet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingPet ? "Edit Pet" : "Add New Pet"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photo</Label>
                <div className="flex items-center gap-4">
                  {formData.photo_url ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                      <img 
                        src={formData.photo_url} 
                        alt="Pet" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, photo_url: "" }))}
                        className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                    </label>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Max 5MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Buddy"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pet_type">Type</Label>
                  <Select
                    value={formData.pet_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, pet_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                    placeholder="e.g., Labrador"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="e.g., 2 years"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell potential adopters about this pet's personality..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addPetMutation.isPending || updatePetMutation.isPending}
                >
                  {editingPet ? "Save Changes" : "Add Pet"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pet List */}
      {pets && pets.length > 0 ? (
        <div className="grid gap-4">
          {pets.map((pet) => (
            <Card key={pet.id} className={!pet.is_available ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Photo */}
                  <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {pet.photo_url ? (
                      <img 
                        src={pet.photo_url} 
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PawPrint className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium">{pet.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {pet.pet_type}
                          </Badge>
                          {pet.breed && (
                            <Badge variant="outline" className="text-xs">
                              {pet.breed}
                            </Badge>
                          )}
                          {pet.age && (
                            <Badge variant="outline" className="text-xs">
                              {pet.age}
                            </Badge>
                          )}
                          {pet.gender && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {pet.gender}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`available-${pet.id}`} className="text-xs text-muted-foreground">
                            Available
                          </Label>
                          <Switch
                            id={`available-${pet.id}`}
                            checked={pet.is_available}
                            onCheckedChange={() => toggleAvailability(pet)}
                          />
                        </div>
                      </div>
                    </div>
                    {pet.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {pet.description}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(pet)}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to remove this pet?")) {
                            deletePetMutation.mutate(pet.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <PawPrint className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium mb-1">No pets added yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add pets that are available for adoption to showcase them on your profile
            </p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Pet
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShelterAdoptablePets;