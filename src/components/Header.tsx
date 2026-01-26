import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dog, Menu, X, Building2, User, Tag, Shield, LogOut, Bell, MessageCircle, History } from "lucide-react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [isShelter, setIsShelter] = useState(false);
  const [hasShelterRecord, setHasShelterRecord] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
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
    setIsMenuOpen(false);
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
    { name: "Pricing", href: "#pricing" },
  ];

  // Logo links to dashboard when logged in, home when not
  const logoDestination = user ? dashboardPath : "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
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
            {user && (
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
                  <DropdownMenuItem onClick={() => { navigate(dashboardPath); setIsMenuOpen(false); }}>
                    <User className="mr-2 h-4 w-4" />
                    My Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { navigate("/member/offers"); setIsMenuOpen(false); }}>
                    <Tag className="mr-2 h-4 w-4" />
                    Browse Offers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { navigate("/community"); setIsMenuOpen(false); }}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Community Hub
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { navigate("/member/history"); setIsMenuOpen(false); }}>
                    <History className="mr-2 h-4 w-4" />
                    Redemption History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { navigate("/member/notifications"); setIsMenuOpen(false); }}>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { navigate("/admin"); setIsMenuOpen(false); }} className="text-primary">
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
            )}
            <button
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="font-medium text-foreground hover:text-primary transition-colors py-2 flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
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
                    className="font-medium text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={`/${link.href}`}
                    className="font-medium text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              )
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-primary">
                    <Shield className="w-4 h-4" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              <Link to={dashboardPath} onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <User className="w-4 h-4" />
                  My Account
                </Button>
              </Link>
              {!user && (
                <Link to="/partner-register" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Building2 className="w-4 h-4" />
                    For Business
                  </Button>
                </Link>
              )}
              {user ? (
                <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              ) : (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="hero" className="w-full">Join Now</Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
