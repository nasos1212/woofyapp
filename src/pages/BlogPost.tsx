import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Clock, Share2, Facebook, Twitter, MessageCircle, Link as LinkIcon, Building2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import DogLoader from "@/components/DogLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost, formatDate, isGreek, localized } from "@/lib/blog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface BusinessLite {
  id: string;
  business_name: string;
  logo_url: string | null;
  category: string | null;
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessLite | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (!data) {
        setPost(null);
        setLoading(false);
        return;
      }
      const p = data as unknown as BlogPost;
      setPost(p);
      setLoading(false);

      // Linked business
      if (p.business_id) {
        const { data: b } = await supabase
          .from("businesses")
          .select("id, business_name, logo_url, category")
          .eq("id", p.business_id)
          .maybeSingle();
        if (b) setBusiness(b as BusinessLite);
      }

      // Related
      const { data: rel } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .eq("category", p.category)
        .neq("id", p.id)
        .order("published_at", { ascending: false })
        .limit(3);
      setRelated((rel as unknown as BlogPost[]) || []);

      // View count (once per session)
      const key = `wooffy-blog-view-${p.slug}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        supabase.rpc("increment_blog_view", { _slug: p.slug });
      }
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-32">
          <DogLoader size="lg" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-16 text-center">
          <h1 className="text-2xl font-bold mb-2">{t("blog.notFound")}</h1>
          <Button onClick={() => navigate("/blog")} className="mt-4">
            {t("blog.backToBlog")}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const title = localized(post.title_en, post.title_el);
  const excerpt = localized(post.excerpt_en, post.excerpt_el);
  const content = localized(post.content_en, post.content_el);
  const seoTitle = localized(post.seo_title_en, post.seo_title_el) || title;
  const seoDescription = localized(post.seo_description_en, post.seo_description_el) || excerpt;
  const url = `https://wooffy.app/blog/${post.slug}`;

  const share = (network: "facebook" | "twitter" | "whatsapp") => {
    const links = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
    };
    return links[network];
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t("blog.linkCopied") });
    } catch {
      toast({ title: t("blog.linkCopyError"), variant: "destructive" });
    }
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: seoDescription,
    image: post.cover_image_url || undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: post.author_name ? { "@type": "Person", name: post.author_name } : undefined,
    publisher: {
      "@type": "Organization",
      name: "Wooffy",
      logo: { "@type": "ImageObject", url: "https://wooffy.app/favicon.svg" },
    },
    mainEntityOfPage: url,
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle} | Wooffy Blog</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content={isGreek() ? "el_GR" : "en_US"} />
        {post.cover_image_url && <meta property="og:image" content={post.cover_image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-[calc(5rem+env(safe-area-inset-top))] pb-16 max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-6 gap-1" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            {t("blog.back")}
          </Button>

          <div className="mb-6">
            <Badge className="mb-4">{t(`blog.categories.${post.category}`)}</Badge>
            <h1 className="text-3xl md:text-5xl font-display font-bold mb-4 leading-tight">{title}</h1>
            {excerpt && <p className="text-lg text-muted-foreground mb-4">{excerpt}</p>}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {post.author_name && (
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={post.author_avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{post.author_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{post.author_name}</span>
                </div>
              )}
              <span>{formatDate(post.published_at)}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.reading_minutes} {t("blog.minRead")}
              </span>
            </div>
          </div>

          {post.cover_image_url && (
            <div className="aspect-video bg-muted rounded-xl overflow-hidden mb-8">
              <img src={post.cover_image_url} alt={title} className="w-full h-full object-cover" />
            </div>
          )}

          <article className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>

          {/* Partner card */}
          {business && post.category === "interview" && (
            <Card className="mt-10">
              <CardContent className="p-6 flex items-center gap-4">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.business_name}
                    className="w-16 h-16 rounded-lg object-cover bg-muted"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    {t("blog.meetThePartner")}
                  </p>
                  <h3 className="font-semibold truncate">{business.business_name}</h3>
                </div>
                <Button onClick={() => navigate(`/business/${business.id}`)}>{t("blog.visitProfile")}</Button>
              </CardContent>
            </Card>
          )}

          {/* Share */}
          <div className="mt-10 pt-6 border-t">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-medium flex items-center gap-2">
                <Share2 className="w-4 h-4" /> {t("blog.share")}:
              </span>
              <a href={share("facebook")} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" aria-label="Facebook">
                  <Facebook className="w-4 h-4" />
                </Button>
              </a>
              <a href={share("twitter")} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" aria-label="X / Twitter">
                  <Twitter className="w-4 h-4" />
                </Button>
              </a>
              <a href={share("whatsapp")} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" aria-label="WhatsApp">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </a>
              <Button variant="outline" size="icon" onClick={copyLink} aria-label="Copy link">
                <LinkIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-display font-bold mb-6">{t("blog.related")}</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link key={r.id} to={`/blog/${r.slug}`} className="group">
                    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                      {r.cover_image_url && (
                        <div className="aspect-video bg-muted overflow-hidden">
                          <img
                            src={r.cover_image_url}
                            alt={localized(r.title_en, r.title_el)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {localized(r.title_en, r.title_el)}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
        <Footer />
        <BackToTop />
      </div>
    </>
  );
};

export default BlogPostPage;
