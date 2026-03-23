import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Globe, Search, Filter } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/SocialIcons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ensureHttps } from "@/lib/utils";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import { businessCategories, getCategoryLabel } from "@/data/businessCategories";

interface Partner {
  id: string;
  business_name: string;
  description: string | null;
  category: string;
  categories: string[] | null;
  city: string | null;
  logo_url: string | null;
  website: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
}

const MemberPartners = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { trackDirectoryImpression, trackSocialClick } = useAnalyticsTracking();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const trackedImpressions = useRef(new Set<string>());

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("id, business_name, description, category, categories, city, logo_url, website, instagram_url, facebook_url, tiktok_url")
          .eq("verification_status", "approved")
          .order("business_name");

        if (error) throw error;
        setPartners(data || []);
      } catch (error) {
        console.error("Error fetching partners:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchPartners();
  }, [user]);

  // Track directory impressions for visible partners (once per session)
  const filtered = partners.filter((p) => {
    const matchesSearch =
      !search ||
      p.business_name.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      !categoryFilter ||
      p.category === categoryFilter ||
      p.categories?.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (!isLoading && filtered.length > 0) {
      filtered.forEach((partner) => {
        if (!trackedImpressions.current.has(partner.id)) {
          trackedImpressions.current.add(partner.id);
          trackDirectoryImpression(partner.id, partner.business_name);
        }
      });
    }
  }, [filtered, isLoading, trackDirectoryImpression]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Our Partners | Wooffy</title>
        <meta name="description" content="Browse all Wooffy partner businesses. From pet shops to vets, groomers and more — discover who accepts your Wooffy card." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background overflow-x-hidden">
        <Header />

        <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))] box-border">
          <Link to="/member" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Our Partners
                </h1>
                <p className="text-muted-foreground">
                  {partners.length} trusted {partners.length === 1 ? 'partner' : 'partners'} offering services for you and your pet
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 shrink-0">
                  <Filter className="w-4 h-4" />
                  {categoryFilter ? getCategoryLabel(categoryFilter) : "All Categories"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-[50vh] overflow-y-auto bg-card [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-primary/80 [&::-webkit-scrollbar-thumb]:min-h-[40px]" style={{ scrollbarWidth: 'auto', scrollbarColor: 'hsl(var(--primary)) hsl(var(--muted))' }}>
                <DropdownMenuItem onClick={() => setCategoryFilter(null)}>
                  All Categories
                </DropdownMenuItem>
                {businessCategories.map((cat) => (
                  <DropdownMenuItem key={cat.value} onClick={() => setCategoryFilter(cat.value)}>
                    {cat.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Partners Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <DogLoader size="md" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {search || categoryFilter ? "No partners match your search" : "No partners available yet"}
                </p>
                {(search || categoryFilter) && (
                  <Button
                    variant="link"
                    onClick={() => { setSearch(""); setCategoryFilter(null); }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((partner) => (
                <Card
                  key={partner.id}
                  className="h-full hover:shadow-lg transition-all overflow-hidden group cursor-pointer"
                  onClick={() => navigate(`/business/${partner.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4 mb-3">
                      {/* Logo */}
                      <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                        {partner.logo_url ? (
                          <img
                            src={partner.logo_url}
                            alt={partner.business_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {partner.business_name}
                        </h3>
                        {partner.city && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{partner.city}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(partner.categories && partner.categories.length > 0
                        ? partner.categories
                        : [partner.category]
                      ).slice(0, 3).map((cat) => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {getCategoryLabel(cat)}
                        </Badge>
                      ))}
                    </div>

                    {partner.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {partner.description}
                      </p>
                    )}

                    {/* Social & Website */}
                    <div className="flex items-center gap-2 pt-3 border-t">
                      {partner.instagram_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            trackSocialClick(partner.id, partner.business_name, "instagram");
                            window.open(ensureHttps(partner.instagram_url!), "_blank");
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                          <InstagramIcon className="w-4 h-4" />
                        </button>
                      )}
                      {partner.facebook_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            trackSocialClick(partner.id, partner.business_name, "facebook");
                            window.open(ensureHttps(partner.facebook_url!), "_blank");
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                          <FacebookIcon className="w-4 h-4" />
                        </button>
                      )}
                      {partner.tiktok_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            trackSocialClick(partner.id, partner.business_name, "tiktok");
                            window.open(ensureHttps(partner.tiktok_url!), "_blank");
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                          <TikTokIcon className="w-4 h-4" />
                        </button>
                      )}
                      {partner.website && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            trackSocialClick(partner.id, partner.business_name, "website");
                            window.open(ensureHttps(partner.website!), "_blank");
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors ml-auto"
                        >
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default MemberPartners;
