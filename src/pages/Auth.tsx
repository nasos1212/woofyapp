import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Dog, Mail, Lock, User, ArrowLeft, Building2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import DogLoader from "@/components/DogLoader";

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
  const [accountType, setAccountType] = useState<"member" | "business" | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();

  // Check URL params for account type
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam === "business" || typeParam === "member") {
      setAccountType(typeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user) return;
      
      // Small delay to ensure session is fully established for RLS
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check both business and membership status in parallel
      const [businessResult, membershipResult] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, verification_status")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("memberships")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()
      ]);
      
      const { data: business, error: businessError } = businessResult;
      const { data: membership, error: membershipError } = membershipResult;
      
      if (businessError) {
        console.error("Error checking business:", businessError);
      }
      if (membershipError) {
        console.error("Error checking membership:", membershipError);
      }
      
      const hasBusiness = !!business;
      const hasMembership = !!membership;
      
      // CASE 1: User has a business account - always redirect to business
      if (hasBusiness) {
        navigate("/business");
        return;
      }
      
      // CASE 2: User has a membership (pet owner) - always redirect to member dashboard
      // This handles the case where someone clicks "business" but is actually a pet owner
      if (hasMembership) {
        if (accountType === "business") {
          // User clicked business but they're a pet owner - inform them
          toast({
            title: "Pet Owner Account Found",
            description: "You're registered as a pet owner. Redirecting to your dashboard.",
          });
        }
        navigate("/member");
        return;
      }
      
      // CASE 3: User has neither business nor membership - they're new
      // If they selected business type but have no business, show error
      if (accountType === "business") {
        toast({
          title: "No Business Account Found",
          description: "This email is not registered as a business partner. Please register your business or log in as a pet owner.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        setAccountType(null);
        return;
      }
      
      // If they selected member type and have no membership, go to free member dashboard
      if (accountType === "member") {
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

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
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
          // For member accounts, DON'T create membership automatically
          // User will be a "free member" with community access only
          // They can upgrade to paid membership later via onboarding
          
          toast({
            title: "Account Created!",
            description: "Welcome to Wooffy! Explore our community hub.",
          });
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

  // Account Type Selection View
  if (!accountType) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
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
            </div>
          </div>
        </div>
      </div>
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
            <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4">
              {isBusiness ? (
                <Building2 className="w-8 h-8 text-primary-foreground" />
              ) : (
                <Dog className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {isLogin ? "Welcome Back" : "Join Wooffy"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isBusiness 
                ? "Partner with us to reach pet owners"
                : "Your premium pet membership awaits"
              }
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm text-secondary-foreground">
              {isBusiness ? (
                <>
                  <Building2 className="w-4 h-4" />
                  Business Account
                </>
              ) : (
                <>
                  <Dog className="w-4 h-4" />
                  Pet Owner Account
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
                    placeholder="John Doe"
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
    </div>
  );
};

export default Auth;
