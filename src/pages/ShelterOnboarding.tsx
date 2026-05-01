import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Heart, Users, DollarSign, CheckCircle, ArrowRight, ArrowLeft, Mail, Phone, MapPin, Globe, FileText, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cyprusCityNames } from "@/data/cyprusLocations";
import { getCityDisplayName } from "@/lib/cityDisplay";
import { Dog, Loader2 as LoaderIcon } from "lucide-react";
import { ensureHttps } from "@/lib/utils";

const ShelterOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  
  // Form state
  const [shelterName, setShelterName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [missionStatement, setMissionStatement] = useState("");
  const [dogsInCare, setDogsInCare] = useState("");
  const [yearsOperating, setYearsOperating] = useState("");

  useEffect(() => {
    const checkExistingShelter = async () => {
      if (!user) {
        setIsCheckingStatus(false);
        return;
      }
      
      // Check if user already has a shelter
      const { data: shelter } = await supabase
        .from("shelters")
        .select("id, verification_status")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (shelter) {
        if (shelter.verification_status === "approved") {
          navigate("/shelter-dashboard");
        } else {
          // Already applied, show pending status
          setStep(4);
        }
      }
      
      // Pre-fill email from user
      if (user.email) {
        setEmail(user.email);
      }
      
      setIsCheckingStatus(false);
    };
    
    if (!authLoading) {
      checkExistingShelter();
    }
  }, [user, authLoading, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?type=shelter");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from("shelters").insert({
        user_id: user.id,
        shelter_name: shelterName,
        contact_name: contactName,
        email,
        phone: phone || null,
        city: city || null,
        location: city || "Cyprus",
        address: address || null,
        website: website ? ensureHttps(website) : null,
        description: description || null,
        mission_statement: missionStatement || null,
        dogs_in_care: dogsInCare || null,
        years_operating: yearsOperating || null,
        verification_status: "pending",
      });
      
      if (error) throw error;
      
      // Ensure shelter role exists for this user
      await supabase
        .from("user_roles")
        .upsert(
          { user_id: user.id, role: "shelter" as const },
          { onConflict: "user_id,role" }
        );
      
      toast({
        title: t("shelterOnboarding.successToastTitle"),
        description: t("shelterOnboarding.successToastDesc"),
      });
      
      setStep(4);
    } catch (error: any) {
      toast({
        title: t("shelterOnboarding.errorTitle"),
        description: error.message || t("shelterOnboarding.submitFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
        <div className="flex flex-col items-center gap-4">
          <Dog className="w-12 h-12 text-rose-500 animate-bounce" />
          <p className="text-muted-foreground">{t("shelterOnboarding.loading")}</p>
        </div>
      </div>
    );
  }

  // Step 4: Application submitted - pending review
  if (step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-display text-rose-700">
              {t("shelterOnboarding.applicationSubmitted")}
            </CardTitle>
            <CardDescription className="text-base">
              {t("shelterOnboarding.applicationSubmittedDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-rose-50 rounded-xl p-6 text-left space-y-4">
              <h3 className="font-semibold text-rose-800">{t("shelterOnboarding.whatHappensNext")}</h3>
              <ul className="space-y-3 text-sm text-rose-700">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-rose-700 font-semibold text-xs">1</span>
                  </div>
                  <span>{t("shelterOnboarding.step1")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-rose-700 font-semibold text-xs">2</span>
                  </div>
                  <span>{t("shelterOnboarding.step2")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-rose-700 font-semibold text-xs">3</span>
                  </div>
                  <span>{t("shelterOnboarding.step3")}</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-rose-500" />
                <div className="text-left">
                  <p className="font-semibold text-rose-800">{t("shelterOnboarding.contributionTitle")}</p>
                  <p className="text-sm text-rose-600">
                    {t("shelterOnboarding.contributionDesc")}
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => navigate("/")}
              className="w-full bg-rose-500 hover:bg-rose-600"
            >
              {t("shelterOnboarding.returnHome")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white py-8 px-4 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/?stay=true")}
          className="absolute top-4 left-4 text-white/80 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("shelterOnboarding.back")}
        </Button>
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">
            {t("shelterOnboarding.becomePartner")}
          </h1>
          <p className="text-rose-100">
            {t("shelterOnboarding.joinSubtitle")}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s 
                    ? "bg-rose-500 text-white" 
                    : "bg-rose-100 text-rose-400"
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 rounded ${step > s ? "bg-rose-500" : "bg-rose-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Benefits Banner */}
        {step === 1 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-rose-100">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-semibold text-rose-800 mb-1">{t("shelterOnboarding.benefit1Title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("shelterOnboarding.benefit1Desc")}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-rose-100">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-semibold text-rose-800 mb-1">{t("shelterOnboarding.benefit2Title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("shelterOnboarding.benefit2Desc")}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-rose-100">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mb-3">
                <Heart className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-semibold text-rose-800 mb-1">{t("shelterOnboarding.benefit3Title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("shelterOnboarding.benefit3Desc")}
              </p>
            </div>
          </div>
        )}

        {/* Form Steps */}
        <Card className="border-0 shadow-xl">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-rose-500" />
                  {t("shelterOnboarding.step1Title")}
                </CardTitle>
                <CardDescription>{t("shelterOnboarding.step1Subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="shelterName">{t("shelterOnboarding.shelterName")}</Label>
                    <Input
                      id="shelterName"
                      placeholder={t("shelterOnboarding.shelterNamePlaceholder")}
                      value={shelterName}
                      onChange={(e) => setShelterName(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city">{t("shelterOnboarding.city")}</Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("shelterOnboarding.selectCity")} />
                        </SelectTrigger>
                        <SelectContent>
                          {cyprusCityNames.map((c) => (
                            <SelectItem key={c} value={c}>{getCityDisplayName(c, i18n.language)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">{t("shelterOnboarding.address")}</Label>
                      <Input
                        id="address"
                        placeholder={t("shelterOnboarding.addressPlaceholder")}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">{t("shelterOnboarding.aboutLabel")}</Label>
                    <Textarea
                      id="description"
                      placeholder={t("shelterOnboarding.aboutPlaceholder")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => setStep(2)}
                    disabled={!shelterName || !city}
                    className="bg-rose-500 hover:bg-rose-600"
                  >
                    {t("shelterOnboarding.continue")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-rose-500" />
                  {t("shelterOnboarding.step2Title")}
                </CardTitle>
                <CardDescription>{t("shelterOnboarding.step2Subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contactName">{t("shelterOnboarding.contactName")}</Label>
                    <Input
                      id="contactName"
                      placeholder={t("shelterOnboarding.contactNamePlaceholder")}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">{t("shelterOnboarding.email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@shelter.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">{t("shelterOnboarding.phone")}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+357..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="website">{t("shelterOnboarding.website")}</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yourshelter.org"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                  >
                    {t("shelterOnboarding.back")}
                  </Button>
                  <Button 
                    onClick={() => setStep(3)}
                    disabled={!contactName || !email}
                    className="bg-rose-500 hover:bg-rose-600"
                  >
                    {t("shelterOnboarding.continue")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  {t("shelterOnboarding.step3Title")}
                </CardTitle>
                <CardDescription>{t("shelterOnboarding.step3Subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="missionStatement">{t("shelterOnboarding.missionLabel")}</Label>
                    <Textarea
                      id="missionStatement"
                      placeholder={t("shelterOnboarding.missionPlaceholder")}
                      value={missionStatement}
                      onChange={(e) => setMissionStatement(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dogsInCare">{t("shelterOnboarding.dogsInCareLabel")}</Label>
                      <Input
                        id="dogsInCare"
                        placeholder={t("shelterOnboarding.dogsInCarePlaceholder")}
                        value={dogsInCare}
                        onChange={(e) => setDogsInCare(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="yearsOperating">{t("shelterOnboarding.operatingSinceLabel")}</Label>
                      <Input
                        id="yearsOperating"
                        placeholder={t("shelterOnboarding.operatingSincePlaceholder")}
                        value={yearsOperating}
                        onChange={(e) => setYearsOperating(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Summary Preview */}
                <div className="bg-rose-50 rounded-xl p-4 mt-6">
                  <h4 className="font-semibold text-rose-800 mb-3">{t("shelterOnboarding.applicationSummary")}</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("shelterOnboarding.shelterField")}</span>
                      <span className="font-medium">{shelterName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("shelterOnboarding.locationField")}</span>
                      <span className="font-medium">{city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("shelterOnboarding.contactField")}</span>
                      <span className="font-medium">{contactName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("shelterOnboarding.emailField")}</span>
                      <span className="font-medium">{email}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(2)}
                  >
                    {t("shelterOnboarding.back")}
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !dogsInCare}
                    className="bg-rose-500 hover:bg-rose-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("shelterOnboarding.submitting")}
                      </>
                    ) : (
                      <>
                        {t("shelterOnboarding.submitApplication")}
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ShelterOnboarding;
