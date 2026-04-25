import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Heart, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdoptionInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: {
    id: string;
    name: string;
    shelter_id: string;
  };
  shelterName: string;
}

const AdoptionInquiryDialog = ({ open, onOpenChange, pet, shelterName }: AdoptionInquiryDialogProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('adoption_inquiries')
        .insert({
          pet_id: pet.id,
          shelter_id: pet.shelter_id,
          inquirer_name: data.name,
          inquirer_email: data.email,
          inquirer_phone: data.phone || null,
          message: data.message,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("adoptionInquiryDialog.successToast"));
      setFormData({ name: "", email: "", phone: "", message: "" });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Submit error:', error);
      toast.error(t("adoptionInquiryDialog.errorToast"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error(t("adoptionInquiryDialog.fillRequired"));
      return;
    }
    submitMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {t("adoptionInquiryDialog.title", { name: pet.name })}
          </DialogTitle>
          <DialogDescription>
            {t("adoptionInquiryDialog.description", { shelter: shelterName, name: pet.name })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("adoptionInquiryDialog.yourName")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t("adoptionInquiryDialog.yourNamePlaceholder")}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">{t("adoptionInquiryDialog.emailAddress")}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder={t("adoptionInquiryDialog.emailPlaceholder")}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">{t("adoptionInquiryDialog.phoneNumber")}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder={t("adoptionInquiryDialog.phonePlaceholder")}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">{t("adoptionInquiryDialog.message")}</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder={t("adoptionInquiryDialog.messagePlaceholder", { shelter: shelterName, name: pet.name })}
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("adoptionInquiryDialog.cancel")}
            </Button>
            <Button type="submit" disabled={submitMutation.isPending} className="gap-2">
              <Send className="h-4 w-4" />
              {submitMutation.isPending ? t("adoptionInquiryDialog.sending") : t("adoptionInquiryDialog.sendInquiry")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdoptionInquiryDialog;
