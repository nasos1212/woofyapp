import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dog, Menu, X, Building2, User, Tag, Shield, LogOut, Bell, BarChart3, History, Cake, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "./NotificationBell";

const BusinessHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchProfile();
      fetchBusiness();
    } else {
      setIsAdmin(false);
      setProfile(null);
      setBusinessName(null);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setProfile(data);
    }
  };

  const fetchBusiness = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("businesses")
      .select("business_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setBusinessName(data.business_name);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  };

  const navLinks = [
    { name: "Dashboard", href: "/business", icon: LayoutDashboard },
    { name: "Offers", href: "/business/offers", icon: Tag },
    { name: "Analytics", href: "/business/analytics", icon: BarChart3 },
    { name: "History", href: "/business/history", icon: History },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/business" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-wooffy-dark rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Dog className="w-6 h-6 text-wooffy-sky" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl text-foreground">Wooffy</span>
              <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:block">Partner Portal</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`font-medium transition-colors duration-300 flex items-center gap-1.5 ${
                  isActive(link.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side - user menu */}
          <div className="hidden md:flex items-center gap-3">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={businessName || "Business"} />
                    <AvatarFallback className="bg-slate-700 text-white text-sm font-medium">
                      <Building2 className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground hidden lg:block max-w-[120px] truncate">
                    {businessName || "Business"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{businessName || "Your Business"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/business")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/business/offers")}>
                  <Tag className="mr-2 h-4 w-4" />
                  Manage Offers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/business/analytics")}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/business/birthdays")}>
                  <Cake className="mr-2 h-4 w-4" />
                  Customer Birthdays
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/member")}>
                  <User className="mr-2 h-4 w-4" />
                  Member View
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="text-primary">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <NotificationBell />
            <button
              className="p-3 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-card border-b border-border animate-slide-up">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`font-medium transition-colors py-3 flex items-center gap-3 rounded-lg px-3 ${
                  isActive(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-muted"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </Link>
            ))}
            <Link
              to="/business/birthdays"
              className={`font-medium transition-colors py-3 flex items-center gap-3 rounded-lg px-3 ${
                isActive("/business/birthdays")
                  ? "text-primary bg-primary/10"
                  : "text-foreground hover:text-primary hover:bg-muted"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Cake className="w-5 h-5" />
              Birthdays
            </Link>
            <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
              <Link to="/member" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <User className="w-4 h-4" />
                  Member View
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-primary">
                    <Shield className="w-4 h-4" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default BusinessHeader;
