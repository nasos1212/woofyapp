import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, X, Image as ImageIcon, Trash2 } from "lucide-react";
import { validateImageFile } from "@/lib/fileValidation";
import { useTranslation } from "react-i18next";

interface ShelterPhotoUploadProps {
  shelterId: string;
}

const ShelterPhotoUpload = ({ shelterId }: ShelterPhotoUploadProps) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const queryClient = useQueryClient();

  const { data: photos, isLoading } = useQuery({
    queryKey: ['shelter-photos', shelterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shelter_photos')
        .select('*')
        .eq('shelter_id', shelterId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!shelterId,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
  };

  const handleUpload = async () => {
    if (!selectedFile || !shelterId) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${shelterId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('shelter-photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shelter-photos')
        .getPublicUrl(fileName);

      const maxOrder = photos?.length ? Math.max(...photos.map(p => p.display_order || 0)) : 0;

      const { error: dbError } = await supabase
        .from('shelter_photos')
        .insert({
          shelter_id: shelterId,
          photo_url: publicUrl,
          caption: caption || null,
          display_order: maxOrder + 1,
        });

      if (dbError) throw dbError;

      toast.success(t("shelterGallery.toasts.uploaded", { count: 1 }));
      queryClient.invalidateQueries({ queryKey: ['shelter-photos', shelterId] });
      clearSelection();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || t("shelterGallery.toasts.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string, photoUrl: string) => {
    try {
      const urlParts = photoUrl.split('/shelter-photos/');
      if (urlParts[1]) {
        await supabase.storage
          .from('shelter-photos')
          .remove([urlParts[1]]);
      }

      const { error } = await supabase
        .from('shelter_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast.success(t("shelterGallery.toasts.deleted"));
      queryClient.invalidateQueries({ queryKey: ['shelter-photos', shelterId] });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(t("shelterGallery.toasts.deleteFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          {!preview ? (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">{t("shelterHeader.clickToUpload")}</span>
                </p>
                <p className="text-xs text-muted-foreground">{t("shelterGallery.fileHint")}</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={preview}
                  alt={t("shelterGallery.previewAlt")}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">{t("shelterGallery.addCaption")}</Label>
                <Input
                  id="caption"
                  placeholder={t("shelterGallery.addCaption")}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? t("shelterGallery.uploading") : t("shelterGallery.uploadCount", { count: 1 })}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          {t("shelterGallery.yourGallery", { count: photos?.length || 0 })}
        </h3>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.photo_url}
                  alt={photo.caption || t("shelterProfile.photoAlt")}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(photo.id, photo.photo_url)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {photo.caption && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t("shelterGallery.noPhotos")}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ShelterPhotoUpload;
