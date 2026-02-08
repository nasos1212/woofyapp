import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dog, Building2, User, Tag, Shield, LogOut, Bell, MessageCircle, History, Menu, X } from "lucide-react";
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
import { useMembership } from "@/hooks/useMembership";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [isShelter, setIsShelter] = useState(false);
  const [hasShelterRecord, setHasShelterRecord] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { hasMembership } = useMembership();
  const isHomePage = location.pathname === "/";
  const isAdminPage = location.pathname.startsWith("/admin");
  
  // Determine correct dashboard path based on role and membership status
  // CRITICAL: Check shelter first, then business, then member
  const dashboardPath = isShelter 
    ? (hasShelterRecord ? "/shelter-dashboard" : "/shelter-onboarding")
    : isBusiness 
      ? "/business" 
      : (hasMembership ? "/member" : "/member/free");

  const handleSignOut = async () => {
    await signOut();
    // signOut already handles redirect via window.location.href
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
      checkBusinessStatus();
      checkShelterStatus();
      fetchProfile();
    } else {
      setIsAdmin(false);
      setIsBusiness(false);
      setIsShelter(false);
      setHasShelterRecord(false);
      setProfile(null);
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

  const checkBusinessStatus = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "business",
      });
      setIsBusiness(!!data);
    } catch {
      setIsBusiness(false);
    }
  };

  const checkShelterStatus = async () => {
    if (!user) return;
    try {
      // Check shelter role
      const { data: roleData } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "shelter",
      });
      setIsShelter(!!roleData);
      
      // Check if shelter record exists
      const { data: shelterData } = await supabase
        .from("shelters")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setHasShelterRecord(!!shelterData);
    } catch {
      setIsShelter(false);
      setHasShelterRecord(false);
    }
  };

  // Hide all links except Dashboard on admin pages
  const navLinks = isAdminPage ? [
    { name: "Dashboard", href: dashboardPath, isRoute: true },
  ] : user ? [
    { name: "Dashboard", href: dashboardPath, isRoute: true },
    { name: "Offers", href: "/member/offers", isRoute: true },
    { name: "Community", href: "/community", isRoute: true },
] : [
    { name: "Partners", href: "#partners" },
    { name: "Offers", href: "/member/offers", isRoute: true },
    { name: "Community", href: "/community", isRoute: true },
    { name: "Shelters", href: "#shelters" },
    { name: "Pricing", href: "#freemium" },
  ];

  // Logo links to dashboard when logged in, home when not
  const logoDestination = user ? dashboardPath : "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border pt-[env(safe-area-inset-top)]">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to={logoDestination} className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-wooffy-dark rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Dog className="w-6 h-6 text-wooffy-sky" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">Wooffy</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="font-medium text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-1"
                >
                  {link.name === "Dashboard" && <User className="w-4 h-4" />}
                  {link.name === "Offers" && <Tag className="w-4 h-4" />}
                  {link.name === "Community" && <MessageCircle className="w-4 h-4" />}
                  {link.name}
                </Link>
              ) : (
                isHomePage ? (
                  <a
                    key={link.name}
                    href={link.href}
                    className="font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={`/${link.href}`}
                    className="font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                )
              )
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user && <NotificationBell />}
            {!user && (
              <Link to="/partner-register">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  For Business
                </Button>
              </Link>
            )}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {profile?.full_name ? getInitials(profile.full_name) : user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                    <User className="mr-2 h-4 w-4" />
                    My Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/member/offers")}>
                    <Tag className="mr-2 h-4 w-4" />
                    Browse Offers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/community")}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Community Hub
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/member/history")}>
                    <History className="mr-2 h-4 w-4" />
                    Redemption History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/member/notifications")}>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
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
            ) : (
              <Link to="/auth">
                <Button variant="hero" size="default">Join Now</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-1">
            {user && <NotificationBell />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                        {profile?.full_name ? getInitials(profile.full_name) : user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                    <User className="mr-2 h-4 w-4" />
                    My Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/member/offers")}>
                    <Tag className="mr-2 h-4 w-4" />
                    Browse Offers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/community")}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Community Hub
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/member/history")}>
                    <History className="mr-2 h-4 w-4" />
                    Redemption History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/member/notifications")}>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
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
            ) : (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                className="w-10 h-10 rounded-xl bg-wooffy-sky flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200 shadow-md"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-wooffy-dark" />
                ) : (
                  <Menu className="h-5 w-5 text-wooffy-dark" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu for non-logged-in users */}
        {mobileMenuOpen && !user && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block px-4 py-2 font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ) : (
                isHomePage ? (
                  <a
                    key={link.name}
                    href={link.href}
                    className="block px-4 py-2 font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={`/${link.href}`}
                    className="block px-4 py-2 font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              )
            ))}
            <div className="px-4 pt-2 space-y-2">
              <Link to="/partner-register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <Building2 className="w-4 h-4" />
                  For Business
                </Button>
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="hero" size="default" className="w-full">
                  Join Now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
