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
      toast.success("Inquiry sent! The shelter will contact you soon.");
      setFormData({ name: "", email: "", phone: "", message: "" });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Submit error:', error);
      toast.error("Failed to send inquiry. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
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
            Inquire About {pet.name}
          </DialogTitle>
          <DialogDescription>
            Send a message to {shelterName} about adopting {pet.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Your phone number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder={`Tell ${shelterName} why you're interested in adopting ${pet.name}...`}
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
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending} className="gap-2">
              <Send className="h-4 w-4" />
              {submitMutation.isPending ? "Sending..." : "Send Inquiry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdoptionInquiryDialog;