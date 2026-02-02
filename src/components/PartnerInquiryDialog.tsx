import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Handshake, Building2, Mail, Phone, Globe, MessageSquare } from "lucide-react";
import { z } from "zod";

interface PartnerInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const partnerSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(100, "Business name must be less than 100 characters"),
  contactName: z.string().trim().min(1, "Contact name is required").max(100, "Contact name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone number is required").max(20, "Phone number must be less than 20 characters"),
  website: z.string().trim().max(255, "Website must be less than 255 characters").optional(),
  partnerType: z.string().min(1, "Please select a partner type"),
  message: z.string().trim().max(1000, "Message must be less than 1000 characters").optional(),
});

const PartnerInquiryDialog = ({ open, onOpenChange }: PartnerInquiryDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    partnerType: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = partnerSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a support conversation for the partner inquiry
      const { error } = await supabase.from("support_conversations").insert({
        user_id: null, // Anonymous submission
        subject: `Partner Inquiry: ${formData.businessName}`,
        status: "open",
      });

      if (error) throw error;

      // Send notification email
      await supabase.functions.invoke("send-support-notification", {
        body: {
          type: "partner_inquiry",
          businessName: formData.businessName,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          partnerType: formData.partnerType,
          message: formData.message,
        },
      });

      toast.success("Thank you! We'll be in touch soon.");
      onOpenChange(false);
      setFormData({
        businessName: "",
        contactName: "",
        email: "",
        phone: "",
        website: "",
        partnerType: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting partner inquiry:", error);
      toast.error("Failed to submit. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Become a Partner
          </DialogTitle>
          <DialogDescription>
            Join our network and offer exclusive deals to Wooffy members. Fill in your details and we'll get back to you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName" className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Business Name *
            </Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="Your business name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name *</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Phone *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+357 99 123456"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Website (optional)
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://yourbusiness.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partnerType">Partner Type *</Label>
            <Select
              value={formData.partnerType}
              onValueChange={(value) => setFormData({ ...formData, partnerType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select partner type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pet_shop">Pet Shop</SelectItem>
                <SelectItem value="grooming">Grooming Salon</SelectItem>
                <SelectItem value="veterinary">Veterinary Clinic</SelectItem>
                <SelectItem value="training">Pet Training</SelectItem>
                <SelectItem value="boarding">Pet Boarding/Hotel</SelectItem>
                <SelectItem value="cafe_restaurant">Pet-Friendly Café/Restaurant</SelectItem>
                <SelectItem value="other">Other Pet Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Message (optional)
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us about your business and what you'd like to offer..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Inquiry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerInquiryDialog;
