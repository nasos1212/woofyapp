import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Dog, Mail, Lock, User, ArrowLeft, Building2, Eye, EyeOff, Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import DogLoader from "@/components/DogLoader";
import ContactPopover from "@/components/ContactPopover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const authSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email too long"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
  fullName: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
    .optional(),
});

const Auth = () => {
  const [accountType, setAccountType] = useState<"member" | "business" | "shelter" | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [rejectedDialog, setRejectedDialog] = useState<{ open: boolean; type: "business" | "shelter" | null }>({ open: false, type: null });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();

  // Check URL params for account type
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam === "business" || typeParam === "member" || typeParam === "shelter") {
      setAccountType(typeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user) return;
      
      // Small delay to ensure session is fully established for RLS
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check business role, business record, membership status, and shelter in parallel
      const [businessRoleResult, shelterRoleResult, businessResult, membershipResult, shelterResult, profileResult] = await Promise.all([
        supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "business")
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "shelter")
          .maybeSingle(),
        supabase
          .from("businesses")
          .select("id, verification_status")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("memberships")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("shelters")
          .select("id, verification_status")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle()
      ]);
      
      const { data: businessRole, error: roleError } = businessRoleResult;
      const { data: shelterRole, error: shelterRoleError } = shelterRoleResult;
      const { data: business, error: businessError } = businessResult;
      const { data: membership, error: membershipError } = membershipResult;
      const { data: shelter, error: shelterError } = shelterResult;
      const { data: profile } = profileResult;
      
      if (roleError) {
        console.error("Error checking business role:", roleError);
      }
      if (shelterRoleError) {
        console.error("Error checking shelter role:", shelterRoleError);
      }
      if (businessError) {
        console.error("Error checking business:", businessError);
      }
      if (membershipError) {
        console.error("Error checking membership:", membershipError);
      }
      if (shelterError) {
        console.error("Error checking shelter:", shelterError);
      }
      
      const hasBusinessRole = !!businessRole;
      const hasShelterRole = !!shelterRole;
      const hasBusiness = !!business;
      const hasMembership = !!membership;
      const hasShelter = !!shelter;
      const userName = profile?.full_name || "there";
      
      // Helper to show welcome toast
      const showWelcomeToast = () => {
        toast({
          title: `Hello ${userName}! 👋`,
          description: "Great to have you here!",
        });
      };
      
      // CASE 0: Check for rejected accounts - show dialog (sign out happens when dialog closes)
      if (business?.verification_status === "rejected") {
        setRejectedDialog({ open: true, type: "business" });
        await supabase.auth.signOut();
        return;
      }
      
      if (shelter?.verification_status === "rejected") {
        setRejectedDialog({ open: true, type: "shelter" });
        await supabase.auth.signOut();
        return;
      }
      
      // CASE 1: User has a shelter OR shelter role - redirect appropriately
      if (hasShelter) {
        showWelcomeToast();
        navigate("/shelter-dashboard");
        return;
      }
      
      // User has shelter role but no shelter record - redirect to onboarding
      if (hasShelterRole) {
        navigate("/shelter-onboarding");
        return;
      }
      
      // CASE 2: User has business role OR business account - redirect to business
      // This catches users who started business registration but didn't complete it
      if (hasBusinessRole || hasBusiness) {
        if (!hasBusiness) {
          const nameParam = userName !== "there" ? `?name=${encodeURIComponent(userName)}` : "";
          navigate(`/partner-register${nameParam}`);
        } else {
          showWelcomeToast();
          navigate("/business");
        }
        return;
      }
      
      // CASE 2: User has a membership (pet owner) - redirect to member dashboard
      if (hasMembership) {
        if (accountType === "business") {
          toast({
            title: "Pet Owner Account Found",
            description: "You're registered as a pet owner. Redirecting to your dashboard.",
          });
        } else {
          showWelcomeToast();
        }
        navigate("/member");
        return;
      }
      
      // CASE 3: User selected shelter type - redirect to shelter onboarding
      if (accountType === "shelter") {
        navigate("/shelter-onboarding");
        return;
      }
      
      // CASE 4: User has neither business role nor membership - they're new
      // If they selected business type, add role and redirect to partner registration
      if (accountType === "business") {
        const nameParam = userName !== "there" ? `?name=${encodeURIComponent(userName)}` : "";
        navigate(`/partner-register${nameParam}`);
        return;
      }
      
      // If they selected member type and have no membership, go to free member dashboard
      if (accountType === "member") {
        showWelcomeToast();
        navigate("/member/free");
        return;
      }
      
      // No accountType selected yet - don't redirect, let user pick
    };
    
    checkAndRedirect();
  }, [user, navigate, accountType, toast]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const emailValidation = z.string().trim().email("Please enter a valid email address").safeParse(email);
      
      if (!emailValidation.success) {
        toast({
          title: "Validation Error",
          description: emailValidation.error.errors[0].message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Call our edge function which generates the reset link and sends branded email
      // This avoids calling supabase.auth.resetPasswordForEmail which sends the default email
      const { data, error } = await supabase.functions.invoke("send-password-reset", {
        body: { email: email.trim() }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to send reset email",
          variant: "destructive",
        });
      } else if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      } else {
        setResetEmailSent(true);
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validationResult = authSchema.safeParse({
        email,
        password,
        fullName: isLogin ? undefined : fullName,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        }
        // Note: Welcome toast is now shown after rejection check in checkAndRedirect
        // to avoid showing "Hello!" followed immediately by rejection dialog
      } else {
        // Check if email already exists with a different account type
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", email.trim().toLowerCase())
          .maybeSingle();

        if (existingProfile) {
          // Check what type of account exists
          const [businessResult, membershipResult] = await Promise.all([
            supabase
              .from("businesses")
              .select("id")
              .eq("user_id", existingProfile.user_id)
              .maybeSingle(),
            supabase
              .from("memberships")
              .select("id")
              .eq("user_id", existingProfile.user_id)
              .maybeSingle()
          ]);

          const hasBusiness = !!businessResult.data;
          const hasMembership = !!membershipResult.data;

          if (accountType === "member" && hasBusiness) {
            toast({
              title: "Email Already Registered",
              description: "This email is registered as a Business Partner. Please use a different email or log in to your business account.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }

          if (accountType === "business" && hasMembership) {
            toast({
              title: "Email Already Registered",
              description: "This email is registered as a Pet Owner. Please use a different email or log in to your pet owner account.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }

          // If email exists but no specific account type, they should just log in
          toast({
            title: "Account Exists",
            description: "This email is already registered. Try logging in instead.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const { error, data } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Try logging in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign Up Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          // For business accounts, update role to business (replacing member role from trigger)
          if (accountType === "business") {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              // First delete the member role that was auto-assigned by trigger
              await supabase
                .from("user_roles")
                .delete()
                .eq("user_id", userData.user.id)
                .eq("role", "member");
              
              // Then insert business role
              await supabase
                .from("user_roles")
                .insert({
                  user_id: userData.user.id,
                  role: "business" as const,
                });
              
              // Send verification email from hello@wooffy.app
              supabase.functions.invoke("send-verification-email", {
                body: { email: email.trim(), userId: userData.user.id, fullName: fullName.trim() }
              }).catch(err => console.error("Verification email error:", err));
            }
            
            toast({
              title: "Account Created!",
              description: "Please check your email to verify your account, then complete your business registration.",
            });
            // Pass the full name to pre-fill business name
            navigate(`/partner-register?name=${encodeURIComponent(fullName)}`);
          } else if (accountType === "shelter") {
            // For shelter accounts, update role to shelter (replacing member role from trigger)
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              // First delete the member role that was auto-assigned by trigger
              await supabase
                .from("user_roles")
                .delete()
                .eq("user_id", userData.user.id)
                .eq("role", "member");
              
              // Then insert shelter role
              const { error: roleError } = await supabase
                .from("user_roles")
                .insert({
                  user_id: userData.user.id,
                  role: "shelter" as const,
                });
              
              if (roleError) {
                console.error("Error adding shelter role:", roleError);
              }
              
              // Send verification email from hello@wooffy.app
              supabase.functions.invoke("send-verification-email", {
                body: { email: email.trim(), userId: userData.user.id, fullName: fullName.trim() }
              }).catch(err => console.error("Verification email error:", err));
            }
            
            toast({
              title: "Account Created!",
              description: "Please check your email to verify your account, then complete your shelter application.",
            });
            // Navigate to shelter onboarding
            navigate("/shelter-onboarding");
          } else {
            // For member accounts, add member role and redirect to free dashboard
            // User will be a "free member" with community access only
            // They can upgrade to paid membership later via onboarding
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              await supabase
                .from("user_roles")
                .upsert(
                  { user_id: userData.user.id, role: "member" as const },
                  { onConflict: "user_id,role" }
                );
              
              // Send verification email from hello@wooffy.app
              supabase.functions.invoke("send-verification-email", {
                body: { email: email.trim(), userId: userData.user.id, fullName: fullName.trim() }
              }).catch(err => console.error("Verification email error:", err));
            }
            
            toast({
              title: "Account Created!",
              description: "Please check your email to verify your account.",
            });
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Rejected Account Dialog Component
  const RejectedDialog = () => (
    <Dialog open={rejectedDialog.open} onOpenChange={(open) => setRejectedDialog({ ...rejectedDialog, open })}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-red-800">Application Not Approved</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <DialogDescription className="text-base py-4">
          Unfortunately, your {rejectedDialog.type === "business" ? "business" : "shelter"} application was not approved at this time.
          <br /><br />
          If you believe this was a mistake or would like more information, please reach out:
          <div className="mt-3">
            <ContactPopover 
              triggerText="Contact us" 
              triggerVariant="default"
              showIcon={true}
            />
          </div>
        </DialogDescription>
        <DialogFooter>
          <Button 
            onClick={() => setRejectedDialog({ open: false, type: null })}
            className="w-full"
          >
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Account Type Selection View
  if (!accountType) {
    return (
      <>
        <RejectedDialog />
        <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Button
            variant="ghost"
            onClick={() => navigate("/?stay=true")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>

          <div className="bg-card rounded-2xl shadow-card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Dog className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Welcome to Wooffy
              </h1>
              <p className="text-muted-foreground mt-2">
                How would you like to continue?
              </p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => setAccountType("member")}
                className="group p-6 rounded-xl border-2 border-border hover:border-primary bg-card hover:bg-secondary/50 transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-hero flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Dog className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-foreground">
                      I'm a Pet Owner
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get exclusive discounts and benefits for your furry friend
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setAccountType("business")}
                className="group p-6 rounded-xl border-2 border-border hover:border-primary bg-card hover:bg-secondary/50 transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-gradient-hero">
                    <Building2 className="w-7 h-7 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-foreground">
                      I'm a Business Partner
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Partner with us to reach thousands of pet owners
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setAccountType("shelter")}
                className="group p-6 rounded-xl border-2 border-border hover:border-rose-400 bg-card hover:bg-rose-50 transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-rose-500">
                    <Home className="w-7 h-7 text-rose-500 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-foreground">
                      I'm a Shelter
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Join Wooffy and share in 10% of membership proceeds
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Forgot Password View
  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => {
              setIsForgotPassword(false);
              setResetEmailSent(false);
            }}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Button>

          <div className="bg-card rounded-2xl shadow-card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Dog className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {resetEmailSent ? "Check Your Email" : "Forgot Password?"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {resetEmailSent 
                  ? "We've sent a password reset link to your email address."
                  : "Enter your email and we'll send you a reset link"
                }
              </p>
            </div>

            {resetEmailSent ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-xl">
                  <Mail className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-foreground">
                    Check your inbox for <strong>{email}</strong>
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResetEmailSent(false);
                    setEmail("");
                  }}
                  className="w-full"
                >
                  Try a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? <DogLoader size="sm" /> : "Send Reset Link"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isBusiness = accountType === "business";
  const isShelter = accountType === "shelter";

  const getAccountIcon = () => {
    if (isBusiness) return <Building2 className="w-8 h-8 text-primary-foreground" />;
    if (isShelter) return <Home className="w-8 h-8 text-white" />;
    return <Dog className="w-8 h-8 text-primary-foreground" />;
  };

  const getAccountLabel = () => {
    if (isBusiness) return "Business Account";
    if (isShelter) return "Shelter Account";
    return "Pet Owner Account";
  };

  const getAccountDescription = () => {
    if (isBusiness) return "Partner with us to reach pet owners";
    if (isShelter) return "Join Wooffy and share in 10% of membership proceeds";
    return "Your premium pet membership awaits";
  };

  const getHeaderBgClass = () => {
    if (isShelter) return "bg-rose-500";
    return "bg-gradient-hero";
  };

  const getBadgeBgClass = () => {
    if (isShelter) return "bg-rose-100 text-rose-700";
    return "bg-secondary text-secondary-foreground";
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => setAccountType(null)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Change Account Type
        </Button>

        <div className="bg-card rounded-2xl shadow-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 ${getHeaderBgClass()} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              {getAccountIcon()}
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {isLogin ? "Welcome to Wooffy" : "Join Wooffy"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {getAccountDescription()}
            </p>
            <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${getBadgeBgClass()}`}>
              {isBusiness ? (
                <>
                  <Building2 className="w-4 h-4" />
                  {getAccountLabel()}
                </>
              ) : isShelter ? (
                <>
                  <Home className="w-4 h-4" />
                  {getAccountLabel()}
                </>
              ) : (
                <>
                  <Dog className="w-4 h-4" />
                  {getAccountLabel()}
                </>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Maria Georgiou"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-normal text-muted-foreground cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <DogLoader size="sm" /> : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? (
                <>Don't have an account? <span className="font-semibold text-primary">Sign up</span></>
              ) : (
                <>Already have an account? <span className="font-semibold text-primary">Sign in</span></>
              )}
            </button>
          </div>

        </div>
      </div>
      
      {/* Rejected Account Dialog - Always rendered */}
      <RejectedDialog />
    </div>
  );
};

export default Auth;
