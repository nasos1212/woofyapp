import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Dog, Mail, Lock, User, ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      if (!user || !accountType) return;
      
      if (accountType === "business") {
        navigate("/partner-register");
        return;
      }
      
      // Small delay to ensure session is fully established for RLS
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if user already has a membership
      const { data: membership, error } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking membership:", error);
      }
      
      if (membership) {
        navigate("/member");
      } else {
        navigate("/member/onboarding");
      }
    };
    
    checkAndRedirect();
  }, [user, navigate, accountType]);

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
          // For member accounts, create a membership record
          if (accountType === "member" && data?.user) {
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            
            const { data: memberNumber } = await supabase.rpc('generate_member_number');
            
            await supabase.from('memberships').insert({
              user_id: data.user.id,
              member_number: memberNumber || `WF-${Date.now()}`,
              expires_at: expiryDate.toISOString(),
              is_active: true,
              pet_name: '',
              pet_breed: '',
            });
          }
          
          toast({
            title: "Account Created!",
            description: "Welcome to Woofy!",
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
                Welcome to Woofy
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

            <div className="mt-6 pt-6 border-t border-border text-center">
              <button
                type="button"
                onClick={() => navigate("/member/join-family")}
                className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Have a family share code?
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
              {isLogin ? "Welcome Back" : "Join Woofy"}
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
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

          {/* Family share code for members */}
          {!isBusiness && (
            <div className="mt-4 pt-4 border-t border-border text-center">
              <button
                type="button"
                onClick={() => navigate("/member/join-family")}
                className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Have a family share code?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
