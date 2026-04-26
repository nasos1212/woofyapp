import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Users, User, Mail, Phone, MessageSquare } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";

interface AffiliateInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AffiliateInquiryDialog = ({ open, onOpenChange }: AffiliateInquiryDialogProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    audience: "",
    message: "",
  });

  const affiliateSchema = z.object({
    fullName: z.string().trim().min(1, t("affiliateInquiry.validation.fullNameRequired")).max(100, t("affiliateInquiry.validation.fullNameMax")),
    email: z.string().trim().email(t("affiliateInquiry.validation.emailInvalid")).max(255, t("affiliateInquiry.validation.emailMax")),
    phone: z.string().trim().min(1, t("affiliateInquiry.validation.phoneRequired")).max(20, t("affiliateInquiry.validation.phoneMax")),
    audience: z.string().min(1, t("affiliateInquiry.validation.audienceRequired")),
    message: z.string().trim().max(1000, t("affiliateInquiry.validation.messageMax")).optional(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = affiliateSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: dbError } = await supabase
        .from("affiliate_inquiries")
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          audience: formData.audience,
          message: formData.message || null,
        });

      if (dbError) {
        console.error("Error storing affiliate inquiry:", dbError);
        throw new Error(dbError.message || "Failed to submit inquiry");
      }

      // Send notification email
      await supabase.functions.invoke("send-support-notification", {
        body: {
          type: "affiliate_inquiry",
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          audience: formData.audience,
          message: formData.message,
        },
      });

      toast.success(t("affiliateInquiry.thanks"));
      onOpenChange(false);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        audience: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting affiliate inquiry:", error);
      toast.error(t("affiliateInquiry.submitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t("affiliateInquiry.title")}
          </DialogTitle>
          <DialogDescription>
            {t("affiliateInquiry.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {t("affiliateInquiry.fullName")}
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder={t("affiliateInquiry.fullNamePlaceholder")}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {t("affiliateInquiry.email")}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t("affiliateInquiry.emailPlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {t("affiliateInquiry.phone")}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t("affiliateInquiry.phonePlaceholder")}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">{t("affiliateInquiry.audience")}</Label>
            <Select
              value={formData.audience}
              onValueChange={(value) => setFormData({ ...formData, audience: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("affiliateInquiry.audiencePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friends_family">{t("affiliateInquiry.audienceFriends")}</SelectItem>
                <SelectItem value="social_media">{t("affiliateInquiry.audienceSocial")}</SelectItem>
                <SelectItem value="pet_community">{t("affiliateInquiry.audiencePet")}</SelectItem>
                <SelectItem value="workplace">{t("affiliateInquiry.audienceWork")}</SelectItem>
                <SelectItem value="clients">{t("affiliateInquiry.audienceClients")}</SelectItem>
                <SelectItem value="other">{t("affiliateInquiry.audienceOther")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              {t("affiliateInquiry.message")}
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={t("affiliateInquiry.messagePlaceholder")}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("affiliateInquiry.submitting") : t("affiliateInquiry.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AffiliateInquiryDialog;
