import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Home, PawPrint, LogIn } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ensureHttps } from "@/lib/utils";

interface Shelter {
  id: string;
  shelter_name: string;
  location: string;
  dogs_helped_count: number;
}

const SheltersSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingShelter, setExistingShelter] = useState<{ id: string; verification_status: string } | null>(null);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [formData, setFormData] = useState({
    shelterName: "",
    contactName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    dogsCount: "",
    yearsOperating: "",
    description: "",
  });

  // Fetch approved shelters from database
  useEffect(() => {
    const fetchShelters = async () => {
      const { data, error } = await supabase
        .from("shelters")
        .select("id, shelter_name, location, dogs_helped_count")
        .eq("verification_status", "approved")
        .order("dogs_helped_count", { ascending: false });

      if (!error && data) {
        setShelters(data);
      }
    };

    fetchShelters();
  }, []);

  // Check if user already has a shelter application
  useEffect(() => {
    const checkExistingShelter = async () => {
      if (!user) {
        setExistingShelter(null);
        return;
      }

      const { data } = await supabase
        .from("shelters")
        .select("id, verification_status")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setExistingShelter(data);
      }
    };

    checkExistingShelter();
  }, [user]);

  const handleApplyClick = () => {
    if (!user) {
      // Redirect to auth with return URL
      navigate('/auth?redirect=/#shelters&action=shelter-apply');
      return;
    }

    if (existingShelter) {
      // User already has a shelter, redirect to dashboard
      navigate('/shelter-dashboard');
      return;
    }

    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to submit an application");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("shelters")
        .insert({
          shelter_name: formData.shelterName,
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone || null,
          location: formData.location,
          website: formData.website ? ensureHttps(formData.website) : null,
          dogs_in_care: formData.dogsCount,
          years_operating: formData.yearsOperating,
          description: formData.description,
          user_id: user.id, // Link to user account
        });

      if (error) {
        console.error("Error submitting shelter application:", error);
        toast.error("Failed to submit application. Please try again.");
        return;
      }

      toast.success("Application submitted! We'll review your application and get back to you within 5 business days.");
      setIsDialogOpen(false);
      // Redirect to shelter dashboard
      navigate('/shelter-dashboard');

      if (error) {
        console.error("Error submitting shelter application:", error);
        toast.error("Failed to submit application. Please try again.");
        return;
      }

      toast.success("Application submitted! We'll review your application and get back to you within 5 business days.");
      setIsDialogOpen(false);
      setFormData({
        shelterName: "",
        contactName: "",
        email: "",
        phone: "",
        location: "",
        website: "",
        dogsCount: "",
        yearsOperating: "",
        description: "",
      });
    } catch (err) {
      console.error("Error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total stats
  const totalDogsHelped = shelters.reduce((sum, s) => sum + (s.dogs_helped_count || 0), 0);

  return (
    <section id="shelters" className="py-20 bg-gradient-to-b from-wooffy-soft to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-600 px-4 py-2 rounded-full mb-6">
            <Heart className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">Giving Back</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            10% Goes to <span className="text-rose-500">Dog Shelters</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every Wooffy membership directly supports whitelisted dog shelters. 
            Together, we're making a difference for dogs in need.
          </p>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 text-center shadow-soft">
            <div className="text-3xl md:text-4xl font-display font-bold text-rose-500 mb-2">€47K+</div>
            <p className="text-muted-foreground text-sm">Donated This Year</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-soft">
            <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">
              {totalDogsHelped > 0 ? `${totalDogsHelped.toLocaleString()}+` : "3,400+"}
            </div>
            <p className="text-muted-foreground text-sm">Dogs Rehomed</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-soft">
            <div className="text-3xl md:text-4xl font-display font-bold text-yellow-500 mb-2">
              {shelters.length > 0 ? shelters.length : 12}
            </div>
            <p className="text-muted-foreground text-sm">Partner Shelters</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-soft">
            <div className="text-3xl md:text-4xl font-display font-bold text-green-500 mb-2">100%</div>
            <p className="text-muted-foreground text-sm">Transparent Giving</p>
          </div>
        </div>

        {/* Whitelisted Shelters */}
        <div className="mb-12">
          <h3 className="font-display text-xl font-semibold text-foreground mb-6 text-center">
            Our Whitelisted Shelter Partners
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shelters.length > 0 ? (
              shelters.map((shelter) => (
                <Link 
                  key={shelter.id}
                  to={`/shelter/${shelter.id}`}
                  className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Home className="w-8 h-8 text-rose-500" />
                  </div>
                  <h4 className="font-display font-semibold text-foreground mb-1">{shelter.shelter_name}</h4>
                  <p className="text-muted-foreground text-sm mb-3">{shelter.location}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <PawPrint className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-medium">{shelter.dogs_helped_count || 0} dogs helped</span>
                  </div>
                </Link>
              ))
            ) : (
              // Show placeholder cards if no shelters yet
              [...Array(4)].map((_, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 group"
                >
                  <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Home className="w-8 h-8 text-rose-500" />
                  </div>
                  <h4 className="font-display font-semibold text-foreground mb-1">Coming Soon</h4>
                  <p className="text-muted-foreground text-sm mb-3">Cyprus</p>
                  <div className="flex items-center gap-2 text-sm">
                    <PawPrint className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-medium">Join us!</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Are you a registered dog shelter? Apply to join our whitelist.
          </p>
          {existingShelter ? (
            <Button 
              onClick={() => navigate('/shelter-dashboard')}
              variant="outline"
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Shelter Dashboard
            </Button>
          ) : (
            <button 
              onClick={handleApplyClick}
              className="text-rose-500 font-medium hover:underline inline-flex items-center gap-2"
            >
              {user ? "Apply as a Shelter Partner" : "Login to Apply as Shelter Partner"}
              {user ? <span>→</span> : <LogIn className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Shelter Application Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Apply as a Shelter Partner</DialogTitle>
            <DialogDescription>
              Join our whitelist and share in 10% of all Wooffy membership proceeds, split amongst our shelter partners. Fill out the form below and we'll review your application.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shelterName">Shelter Name *</Label>
                <Input
                  id="shelterName"
                  required
                  value={formData.shelterName}
                  onChange={(e) => setFormData(prev => ({ ...prev, shelterName: e.target.value }))}
                  placeholder="Happy Tails Rescue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Person *</Label>
                <Input
                  id="contactName"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@shelter.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+357 99 123 456"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Nicosia, Cyprus"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://shelter.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dogsCount">Dogs Currently in Care *</Label>
                <Select
                  value={formData.dogsCount}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dogsCount: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 dogs</SelectItem>
                    <SelectItem value="11-25">11-25 dogs</SelectItem>
                    <SelectItem value="26-50">26-50 dogs</SelectItem>
                    <SelectItem value="51-100">51-100 dogs</SelectItem>
                    <SelectItem value="100+">100+ dogs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsOperating">Years Operating *</Label>
                <Select
                  value={formData.yearsOperating}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, yearsOperating: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<1">Less than 1 year</SelectItem>
                    <SelectItem value="1-3">1-3 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="5-10">5-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Tell us about your shelter *</Label>
              <Textarea
                id="description"
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your mission, services, and why you'd like to partner with Wooffy..."
              />
            </div>

            <div className="bg-rose-50 rounded-lg p-4 text-sm text-rose-700">
              <strong>What happens next?</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>We'll review your application within 5 business days</li>
                <li>If approved, you'll share in 10% of all membership proceeds (split amongst all partner shelters)</li>
                <li>Your shelter will be featured on our website</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-rose-500 hover:bg-rose-600">
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default SheltersSection;