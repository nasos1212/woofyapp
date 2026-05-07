import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Clock, ArrowRight, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import DogLoader from "@/components/DogLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost, BlogCategory, formatDate, localized } from "@/lib/blog";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";

const PAGE_SIZE = 12;
const CATEGORIES: ("all" | BlogCategory)[] = ["all", "interview", "guide", "news", "story"];

const Blog = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = (searchParams.get("category") as "all" | BlogCategory) || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const { user } = useAuth();
  const { isPaidMember } = useMembership();
  const [dashboardPath, setDashboardPath] = useState<string>("/member/free");

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featured, setFeatured] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const resolveDashboard = async () => {
      if (!user) return;
      const [shelterRes, businessRes] = await Promise.all([
        supabase.from("shelters").select("id, verification_status").eq("user_id", user.id).maybeSingle(),
        supabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle(),
      ]);
      if (shelterRes.data) {
        setDashboardPath("/shelter-dashboard");
      } else if (businessRes.data) {
        setDashboardPath("/business");
      } else {
        setDashboardPath(isPaidMember ? "/member" : "/member/free");
      }
    };
    resolveDashboard();
  }, [user, isPaidMember]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Featured (most recent published, prefer interviews) — always loaded
      const { data: featuredData } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("category", { ascending: true }) // interview comes first alphabetically
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setFeatured(featuredData as unknown as BlogPost | null);

      // Filtered list
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from("blog_posts")
        .select("*", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(from, to);

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      const { data, count } = await query;
      setPosts((data as unknown as BlogPost[]) || []);
      setTotalCount(count || 0);
      setLoading(false);
    };
    load();
  }, [activeCategory, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const setCategory = (cat: "all" | BlogCategory) => {
    const params = new URLSearchParams(searchParams);
    if (cat === "all") params.delete("category");
    else params.set("category", cat);
    params.delete("page");
    setSearchParams(params);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const visiblePosts = useMemo(() => {
    if (!featured) return posts;
    // Avoid showing the same featured card twice on page 1, all category
    if (page === 1 && activeCategory === "all" && totalCount > 2) {
      return posts.filter((p) => p.id !== featured.id);
    }
    return posts;
  }, [posts, featured, page, activeCategory, totalCount]);

  return (
    <>
      <Helmet>
        <title>{t("blog.metaTitle")}</title>
        <meta name="description" content={t("blog.metaDescription")} />
        <link rel="canonical" href="https://wooffy.app/blog" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-[calc(6rem+env(safe-area-inset-top))] pb-16 max-w-6xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (user ? navigate(dashboardPath) : navigate(-1))}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {user ? t("header.myDashboard") : t("common.back")}
          </Button>
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">{t("blog.title")}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("blog.subtitle")}</p>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat)}
              >
                {t(`blog.categories.${cat}`)}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <DogLoader size="lg" />
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured && page === 1 && activeCategory === "all" && totalCount > 2 && (
                <Card
                  className="mb-12 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/blog/${featured.slug}`)}
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    {featured.cover_image_url && (
                      <div className="aspect-video md:aspect-auto md:h-full bg-muted">
                        <img
                          src={featured.cover_image_url}
                          alt={localized(featured.title_en, featured.title_el)}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    )}
                    <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge>{t(`blog.categories.${featured.category}`)}</Badge>
                        <span className="text-xs text-muted-foreground">{t("blog.featured")}</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 line-clamp-3">
                        {localized(featured.title_en, featured.title_el)}
                      </h2>
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {localized(featured.excerpt_en, featured.excerpt_el)}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                        <span>{formatDate(featured.published_at)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {featured.reading_minutes} {t("blog.minRead")}
                        </span>
                      </div>
                      <Button variant="outline" className="self-start gap-2">
                        {t("blog.readMore")} <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              )}

              {/* Grid */}
              {visiblePosts.length === 0 ? (
                !(featured && page === 1 && activeCategory === "all") && (
                  <p className="text-center text-muted-foreground py-12">{t("blog.empty")}</p>
                )
              ) : (
                <div
                  className={
                    visiblePosts.length === 1
                      ? "grid grid-cols-1 gap-6 max-w-md mx-auto"
                      : visiblePosts.length === 2
                        ? "grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto"
                        : "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  }
                >
                  {visiblePosts.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                        {post.cover_image_url ? (
                          <div className="aspect-video bg-muted overflow-hidden">
                            <img
                              src={post.cover_image_url}
                              alt={localized(post.title_en, post.title_el)}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-wooffy-sky/20 to-wooffy-blue/20" />
                        )}
                        <CardContent className="p-5">
                          <Badge variant="secondary" className="mb-3">
                            {t(`blog.categories.${post.category}`)}
                          </Badge>
                          <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {localized(post.title_en, post.title_el)}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                            {localized(post.excerpt_en, post.excerpt_el)}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatDate(post.published_at)}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {post.reading_minutes} {t("blog.minRead")}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    {t("blog.prev")}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    {t("blog.next")}
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
        {!user && <Footer />}
        <BackToTop />
      </div>
    </>
  );
};

export default Blog;
