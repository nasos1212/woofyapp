import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Dog, Mail, Lock, User, ArrowLeft, Building2, Eye, EyeOff, Home, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import DogLoader from "@/components/DogLoader";
import ContactPopover from "@/components/ContactPopover";
import PetFriendlyPlaceRequestDialog from "@/components/PetFriendlyPlaceRequestDialog";
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
  const [showAccountTypeSelection, setShowAccountTypeSelection] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const [rejectedDialog, setRejectedDialog] = useState<{ open: boolean; type: "business" | "shelter" | null }>({ open: false, type: null });
  const [isLoginInProgress, setIsLoginInProgress] = useState(false);
  const [isSignUpInProgress, setIsSignUpInProgress] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();

  // Check URL params for account type (for direct links)
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam === "business" || typeParam === "member" || typeParam === "shelter") {
      setAccountType(typeParam);
      setIsLogin(false);
      setShowAccountTypeSelection(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user) return;
      
      // Skip redirect during login or signup in progress
      if (isLoginInProgress || isSignUpInProgress) return;
      
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
      
      // CASE 3+4: Only apply account-type-based redirects for NEW signups, not existing logins
      // If user is logging in (isLogin=true) and has no records, send to free member dashboard
      // If user is signing up, use their selected accountType
      if (isLogin) {
        // Existing user with no records - default to free member
        showWelcomeToast();
        navigate("/member/free");
        return;
      }
      
      // New signup - use selected account type
      if (accountType === "shelter") {
        navigate("/shelter-onboarding");
        return;
      }
      
      if (accountType === "business") {
        const nameParam = userName !== "there" ? `?name=${encodeURIComponent(userName)}` : "";
        navigate(`/partner-register${nameParam}`);
        return;
      }
      
      if (accountType === "member") {
        showWelcomeToast();
        navigate("/member/free");
        return;
      }
      
      // No accountType selected yet - don't redirect, let user pick
    };
    
    checkAndRedirect();
  }, [user, navigate, accountType, toast, isLogin, isLoginInProgress, isSignUpInProgress]);

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
          description: "If this email is registered, you'll receive a password reset link shortly.",
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
        setIsLoginInProgress(true);
        const { error } = await signIn(email, password);
        setIsLoginInProgress(false);
        if (error) {
          const isVerificationError = error.message.includes("verify your email");
          toast({
            title: isVerificationError ? "Email Not Verified" : "Login Failed",
            description: isVerificationError 
              ? "Please check your inbox for the verification link and verify your email before signing in." 
              : error.message,
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

        setIsSignUpInProgress(true);
        const { error, data } = await signUp(email, password, fullName, accountType || "member");
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
          // Role is now assigned by the handle_new_user trigger based on account_type metadata
          // Just send the verification email
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            supabase.functions.invoke("send-verification-email", {
              body: { email: email.trim(), userId: userData.user.id, fullName: fullName.trim() }
            }).catch(err => console.error("Verification email error:", err));
          }
          
          // Sign out immediately after signup to enforce email verification
          // User must verify email before they can access any dashboard
          await supabase.auth.signOut({ scope: 'local' });
          
          toast({
            title: "Account Created! ✉️",
            description: "Please check your email to verify your account before signing in.",
            duration: 10000,
          });
          
          // Navigate to verify-email page which shows "Check Your Email" instructions
          navigate("/verify-email");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSignUpInProgress(false);
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

  // Account Type Selection View (only shown when signing up)
  if (showAccountTypeSelection && !accountType) {
    return (
      <>
        <RejectedDialog />
        <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Button
            variant="ghost"
            onClick={() => {
              setShowAccountTypeSelection(false);
              setIsLogin(true);
            }}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Button>

          <div className="bg-card rounded-2xl shadow-card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Dog className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Create an Account
              </h1>
              <p className="text-muted-foreground mt-2">
                What type of account would you like?
              </p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => { setAccountType("member"); setIsLogin(false); setShowAccountTypeSelection(false); }}
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
                onClick={() => { setAccountType("business"); setIsLogin(false); setShowAccountTypeSelection(false); }}
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
                onClick={() => { setAccountType("shelter"); setIsLogin(false); setShowAccountTypeSelection(false); }}
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

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowAccountTypeSelection(false);
                  setIsLogin(true);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Already have an account? <span className="font-semibold text-primary">Sign in</span>
              </button>
            </div>

            <PetFriendlyPlaceRequestDialog />
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
        {isLogin ? (
          <Button
            variant="ghost"
            onClick={() => navigate("/?stay=true")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={() => {
              setAccountType(null);
              setShowAccountTypeSelection(true);
            }}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Change Account Type
          </Button>
        )}

        <div className="bg-card rounded-2xl shadow-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 ${isLogin ? 'bg-gradient-hero' : getHeaderBgClass()} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              {isLogin ? <Dog className="w-8 h-8 text-primary-foreground" /> : getAccountIcon()}
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {isLogin ? "Welcome Back" : "Join Wooffy"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Sign in to your account" : getAccountDescription()}
            </p>
            {!isLogin && (
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
            )}
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
                    placeholder={accountType === "shelter" ? "The Asher House" : accountType === "business" ? "Pet Shop Ltd" : "Maria Georgiou"}
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
            {!isLogin && (
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <a href="https://www.wooffy.app/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                    Terms &amp; Conditions
                  </a>{" "}
                  and{" "}
                  <a href="https://www.wooffy.app/terms#privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={isLoading || (!isLogin && !acceptedTerms)}
            >
              {isLoading ? <DogLoader size="sm" /> : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                if (isLogin) {
                  // Sign In → go to account type selection for sign up
                  setShowAccountTypeSelection(true);
                  setAccountType(null);
                } else {
                  // Sign Up → go back to sign in
                  setIsLogin(true);
                  setAccountType(null);
                  setShowAccountTypeSelection(false);
                }
              }}
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
