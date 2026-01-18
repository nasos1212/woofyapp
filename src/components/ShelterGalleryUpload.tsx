import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, X, Images, GripVertical, Trash2 } from "lucide-react";
import { validateImageFile } from "@/lib/fileValidation";

interface ShelterGalleryUploadProps {
  shelterId: string;
}

interface GalleryPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
  display_order: number | null;
}

const ShelterGalleryUpload = ({ shelterId }: ShelterGalleryUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState("");
  const queryClient = useQueryClient();

  // Fetch existing gallery photos
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['shelter-gallery', shelterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shelter_photos')
        .select('*')
        .eq('shelter_id', shelterId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as GalleryPhoto[];
    },
    enabled: !!shelterId,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach(file => {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === validFiles.length) {
            setPreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        toast.error(`${file.name}: ${validation.error}`);
      }
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removePreview = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;

    try {
      const maxOrder = photos.length > 0 
        ? Math.max(...photos.map(p => p.display_order || 0)) 
        : 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${shelterId}/gallery-${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('shelter-photos')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('shelter-photos')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from('shelter_photos')
          .insert({
            shelter_id: shelterId,
            photo_url: publicUrl,
            display_order: maxOrder + i + 1,
          });

        if (dbError) {
          console.error('DB error:', dbError);
          continue;
        }

        successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded!`);
        queryClient.invalidateQueries({ queryKey: ['shelter-gallery'] });
        setSelectedFiles([]);
        setPreviews([]);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error("Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo: GalleryPhoto) => {
    try {
      // Extract file path from URL
      const urlParts = photo.photo_url.split('/shelter-photos/');
      if (urlParts[1]) {
        await supabase.storage
          .from('shelter-photos')
          .remove([urlParts[1]]);
      }

      const { error } = await supabase
        .from('shelter_photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;

      toast.success("Photo deleted");
      queryClient.invalidateQueries({ queryKey: ['shelter-gallery'] });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error("Failed to delete photo");
    }
  };

  const handleUpdateCaption = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('shelter_photos')
        .update({ caption: captionValue || null })
        .eq('id', photoId);

      if (error) throw error;

      toast.success("Caption updated");
      queryClient.invalidateQueries({ queryKey: ['shelter-gallery'] });
      setEditingCaption(null);
      setCaptionValue("");
    } catch (error: any) {
      console.error('Caption update error:', error);
      toast.error("Failed to update caption");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Images className="h-4 w-4" />
          Photo Gallery
        </CardTitle>
        <CardDescription>
          Showcase your dogs and facilities. These photos appear on your public profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Upload className="w-5 h-5" />
              <span className="text-sm font-medium">Click to add photos</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, or WebP (max 5MB each)
            </p>
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
            />
          </label>

          {/* Preview of selected files */}
          {previews.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => removePreview(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : `Upload ${previews.length} Photo${previews.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
        </div>

        {/* Existing Gallery */}
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Loading gallery...
          </div>
        ) : photos.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Your Gallery ({photos.length} photos)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square">
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || "Gallery photo"}
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(photo)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>

                  {/* Caption */}
                  {editingCaption === photo.id ? (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70 rounded-b-lg">
                      <Input
                        value={captionValue}
                        onChange={(e) => setCaptionValue(e.target.value)}
                        placeholder="Add caption..."
                        className="h-8 text-xs mb-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateCaption(photo.id);
                          if (e.key === 'Escape') setEditingCaption(null);
                        }}
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="h-6 text-xs flex-1"
                          onClick={() => handleUpdateCaption(photo.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => setEditingCaption(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs truncate rounded-b-lg hover:bg-black/70 transition-colors"
                      onClick={() => {
                        setEditingCaption(photo.id);
                        setCaptionValue(photo.caption || "");
                      }}
                    >
                      {photo.caption || "Add caption..."}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No photos in your gallery yet. Add some to showcase your shelter!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ShelterGalleryUpload;
