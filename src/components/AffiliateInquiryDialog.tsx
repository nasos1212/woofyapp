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

interface AffiliateInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const affiliateSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone number is required").max(20, "Phone number must be less than 20 characters"),
  audience: z.string().min(1, "Please select your audience type"),
  message: z.string().trim().max(1000, "Message must be less than 1000 characters").optional(),
});

const AffiliateInquiryDialog = ({ open, onOpenChange }: AffiliateInquiryDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    audience: "",
    message: "",
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
      // Store directly in affiliate_inquiries table
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
        throw dbError;
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

      toast.success("Thank you! We'll be in touch soon.");
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
            <Users className="h-5 w-5 text-primary" />
            Become an Affiliate
          </DialogTitle>
          <DialogDescription>
            Earn rewards by introducing pet owners to Wooffy. Share with your network and earn commissions on every signup!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Full Name *
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
            <Label htmlFor="audience">Who would you refer? *</Label>
            <Select
              value={formData.audience}
              onValueChange={(value) => setFormData({ ...formData, audience: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friends_family">Friends & Family</SelectItem>
                <SelectItem value="social_media">Social Media Followers</SelectItem>
                <SelectItem value="pet_community">Pet Community / Groups</SelectItem>
                <SelectItem value="workplace">Colleagues / Workplace</SelectItem>
                <SelectItem value="clients">My Clients / Customers</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Tell us more (optional)
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="How do you plan to introduce pet owners to Wooffy?"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Join Affiliate Program"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AffiliateInquiryDialog;
