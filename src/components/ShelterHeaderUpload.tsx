import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, Image as ImageIcon, User, Move } from "lucide-react";
import { validateImageFile } from "@/lib/fileValidation";
import { useTranslation } from "react-i18next";

interface ShelterHeaderUploadProps {
  shelterId: string;
  currentLogoUrl: string | null;
  currentCoverUrl: string | null;
  currentCoverPosition?: number | null;
}

const ShelterHeaderUpload = ({ shelterId, currentLogoUrl, currentCoverUrl, currentCoverPosition }: ShelterHeaderUploadProps) => {
  const { t } = useTranslation();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [savingPosition, setSavingPosition] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPosition, setCoverPosition] = useState(currentCoverPosition ?? 50);
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { toast.error(validation.error); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'logo') { setLogoFile(file); setLogoPreview(reader.result as string); }
      else { setCoverFile(file); setCoverPreview(reader.result as string); }
    };
    reader.readAsDataURL(file);
  };

  const clearSelection = (type: 'logo' | 'cover') => {
    if (type === 'logo') { setLogoFile(null); setLogoPreview(null); }
    else { setCoverFile(null); setCoverPreview(null); }
  };

  const handleUpload = async (type: 'logo' | 'cover') => {
    const file = type === 'logo' ? logoFile : coverFile;
    if (!file || !shelterId) return;
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingCover;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${shelterId}/${type}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('shelter-photos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('shelter-photos').getPublicUrl(fileName);
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (type === 'logo') updateData.logo_url = publicUrl;
      else { updateData.cover_photo_url = publicUrl; updateData.cover_photo_position = coverPosition; }
      const { error: dbError } = await supabase.from('shelters').update(updateData).eq('id', shelterId);
      if (dbError) throw dbError;
      toast.success(t(type === 'logo' ? "shelterHeader.toasts.logoUpdated" : "shelterHeader.toasts.coverUpdated"));
      queryClient.invalidateQueries({ queryKey: ['my-shelter'] });
      clearSelection(type);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || t(type === 'logo' ? "shelterHeader.toasts.logoUploadFailed" : "shelterHeader.toasts.coverUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (type: 'logo' | 'cover') => {
    const currentUrl = type === 'logo' ? currentLogoUrl : currentCoverUrl;
    if (!currentUrl) return;
    try {
      const urlParts = currentUrl.split('/shelter-photos/');
      if (urlParts[1]) await supabase.storage.from('shelter-photos').remove([urlParts[1]]);
      const updateField = type === 'logo' ? 'logo_url' : 'cover_photo_url';
      const { error } = await supabase.from('shelters').update({ [updateField]: null, updated_at: new Date().toISOString() }).eq('id', shelterId);
      if (error) throw error;
      toast.success(t(type === 'logo' ? "shelterHeader.toasts.logoRemoved" : "shelterHeader.toasts.coverRemoved"));
      queryClient.invalidateQueries({ queryKey: ['my-shelter'] });
    } catch (error: any) {
      console.error('Remove error:', error);
      toast.error(t(type === 'logo' ? "shelterHeader.toasts.logoRemoveFailed" : "shelterHeader.toasts.coverRemoveFailed"));
    }
  };

  const handleSavePosition = async () => {
    setSavingPosition(true);
    try {
      const { error } = await supabase.from('shelters').update({ cover_photo_position: coverPosition, updated_at: new Date().toISOString() }).eq('id', shelterId);
      if (error) throw error;
      toast.success(t("shelterHeader.toasts.positionSaved"));
      queryClient.invalidateQueries({ queryKey: ['my-shelter'] });
    } catch (error: any) {
      console.error('Position save error:', error);
      toast.error(t("shelterHeader.toasts.positionSaveFailed"));
    } finally {
      setSavingPosition(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            {t("shelterHeader.coverPhoto")}
          </CardTitle>
          <CardDescription>{t("shelterHeader.coverPhotoDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {coverPreview ? (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg h-40">
                <img src={coverPreview} alt={t("shelterHeader.coverPhoto")} className="w-full h-[200%] object-cover absolute left-0" style={{ top: `${-(coverPosition)}%` }} />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-10" onClick={() => clearSelection('cover')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Move className="h-4 w-4" />
                  {t("shelterHeader.adjustPosition")}
                </div>
                <div className="flex items-center gap-3 py-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{t("shelterHeader.top")}</span>
                  <Slider value={[coverPosition]} onValueChange={(value) => setCoverPosition(value[0])} min={0} max={100} step={1} className="flex-1 touch-pan-x" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{t("shelterHeader.bottom")}</span>
                </div>
              </div>
              <Button onClick={() => handleUpload('cover')} disabled={uploadingCover} className="w-full">
                {uploadingCover ? t("shelterHeader.uploading") : t("shelterHeader.saveCover")}
              </Button>
            </div>
          ) : currentCoverUrl ? (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg h-40">
                <img src={currentCoverUrl} alt={t("shelterHeader.coverPhoto")} className="w-full h-[200%] object-cover absolute left-0" style={{ top: `${-(coverPosition)}%` }} />
              </div>
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Move className="h-4 w-4" />
                  {t("shelterHeader.adjustPosition")}
                </div>
                <div className="flex items-center gap-3 py-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{t("shelterHeader.top")}</span>
                  <Slider value={[coverPosition]} onValueChange={(value) => setCoverPosition(value[0])} min={0} max={100} step={1} className="flex-1 touch-pan-x" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{t("shelterHeader.bottom")}</span>
                </div>
                <Button size="default" onClick={handleSavePosition} disabled={savingPosition || coverPosition === (currentCoverPosition ?? 50)} className="w-full">
                  {savingPosition ? t("shelterHeader.saving") : t("shelterHeader.savePosition")}
                </Button>
              </div>
              <div className="flex gap-2">
                <label className="flex-1">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {t("shelterHeader.changeCover")}
                    </span>
                  </Button>
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileSelect(e, 'cover')} />
                </label>
                <Button variant="destructive" onClick={() => handleRemove('cover')}>
                  {t("shelterHeader.remove")}
                </Button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">{t("shelterHeader.clickToUpload")}</span> {t("shelterHeader.clickToUploadCover")}
                </p>
              </div>
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileSelect(e, 'cover')} />
            </label>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            {t("shelterHeader.logoTitle")}
          </CardTitle>
          <CardDescription>{t("shelterHeader.logoDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {logoPreview ? (
              <div className="relative">
                <img src={logoPreview} alt={t("shelterHeader.logoTitle")} className="w-24 h-24 object-cover rounded-lg border" />
                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => clearSelection('logo')}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : currentLogoUrl ? (
              <img src={currentLogoUrl} alt={t("shelterHeader.logoTitle")} className="w-24 h-24 object-cover rounded-lg border" />
            ) : (
              <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/30">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 space-y-2">
              {logoPreview ? (
                <Button onClick={() => handleUpload('logo')} disabled={uploadingLogo} className="w-full">
                  {uploadingLogo ? t("shelterHeader.uploading") : t("shelterHeader.saveLogo")}
                </Button>
              ) : (
                <>
                  <label className="w-full">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {currentLogoUrl ? t("shelterHeader.changeLogo") : t("shelterHeader.uploadLogo")}
                      </span>
                    </Button>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileSelect(e, 'logo')} />
                  </label>
                  {currentLogoUrl && (
                    <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={() => handleRemove('logo')}>
                      {t("shelterHeader.removeLogo")}
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
