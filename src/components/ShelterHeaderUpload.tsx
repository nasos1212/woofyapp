import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, Image as ImageIcon, User } from "lucide-react";
import { validateImageFile } from "@/lib/fileValidation";

interface ShelterHeaderUploadProps {
  shelterId: string;
  currentLogoUrl: string | null;
  currentCoverUrl: string | null;
}

const ShelterHeaderUpload = ({ shelterId, currentLogoUrl, currentCoverUrl }: ShelterHeaderUploadProps) => {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'cover'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(reader.result as string);
      } else {
        setCoverFile(file);
        setCoverPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearSelection = (type: 'logo' | 'cover') => {
    if (type === 'logo') {
      setLogoFile(null);
      setLogoPreview(null);
    } else {
      setCoverFile(null);
      setCoverPreview(null);
    }
  };

  const handleUpload = async (type: 'logo' | 'cover') => {
    const file = type === 'logo' ? logoFile : coverFile;
    if (!file || !shelterId) return;

    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingCover;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${shelterId}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('shelter-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shelter-photos')
        .getPublicUrl(fileName);

      // Update shelter record
      const updateField = type === 'logo' ? 'logo_url' : 'cover_photo_url';
      const { error: dbError } = await supabase
        .from('shelters')
        .update({ [updateField]: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', shelterId);

      if (dbError) throw dbError;

      toast.success(`${type === 'logo' ? 'Logo' : 'Cover photo'} updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ['my-shelter'] });
      clearSelection(type);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || `Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (type: 'logo' | 'cover') => {
    const currentUrl = type === 'logo' ? currentLogoUrl : currentCoverUrl;
    if (!currentUrl) return;

    try {
      // Extract file path from URL
      const urlParts = currentUrl.split('/shelter-photos/');
      if (urlParts[1]) {
        await supabase.storage
          .from('shelter-photos')
          .remove([urlParts[1]]);
      }

      const updateField = type === 'logo' ? 'logo_url' : 'cover_photo_url';
      const { error } = await supabase
        .from('shelters')
        .update({ [updateField]: null, updated_at: new Date().toISOString() })
        .eq('id', shelterId);

      if (error) throw error;

      toast.success(`${type === 'logo' ? 'Logo' : 'Cover photo'} removed`);
      queryClient.invalidateQueries({ queryKey: ['my-shelter'] });
    } catch (error: any) {
      console.error('Remove error:', error);
      toast.error(`Failed to remove ${type}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cover Photo Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Cover Photo
          </CardTitle>
          <CardDescription>
            This appears as the banner at the top of your public profile (recommended: 1200x400px)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coverPreview ? (
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => clearSelection('cover')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() => handleUpload('cover')}
                disabled={uploadingCover}
                className="w-full"
              >
                {uploadingCover ? "Uploading..." : "Save Cover Photo"}
              </Button>
            </div>
          ) : currentCoverUrl ? (
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={currentCoverUrl}
                  alt="Current cover"
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <label className="flex-1">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Change Cover
                    </span>
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileSelect(e, 'cover')}
                  />
                </label>
                <Button variant="destructive" onClick={() => handleRemove('cover')}>
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> cover photo
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileSelect(e, 'cover')}
              />
            </label>
          )}
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Shelter Logo
          </CardTitle>
          <CardDescription>
            Your logo appears on your profile and in shelter listings (recommended: square, 200x200px)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-24 h-24 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => clearSelection('logo')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : currentLogoUrl ? (
              <img
                src={currentLogoUrl}
                alt="Current logo"
                className="w-24 h-24 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/30">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 space-y-2">
              {logoPreview ? (
                <Button
                  onClick={() => handleUpload('logo')}
                  disabled={uploadingLogo}
                  className="w-full"
                >
                  {uploadingLogo ? "Uploading..." : "Save Logo"}
                </Button>
              ) : (
                <>
                  <label className="w-full">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {currentLogoUrl ? "Change Logo" : "Upload Logo"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileSelect(e, 'logo')}
                    />
                  </label>
                  {currentLogoUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => handleRemove('logo')}
                    >
                      Remove Logo
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShelterHeaderUpload;
