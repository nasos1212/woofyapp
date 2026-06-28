import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Clock, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { localized, formatDate, type BlogPost } from "@/lib/blog";

const LatestFromBlog = () => {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(3);
      if (!error && data) setPosts(data as unknown as BlogPost[]);
      setLoading(false);
    };
    load();
  }, [i18n.language]);

  if (loading || posts.length === 0) return null;

  return (
    <section className="py-20 lg:py-28 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 bg-wooffy-sky/15 rounded-full px-4 py-2 border border-wooffy-sky/30 mb-6">
              <BookOpen className="w-4 h-4 text-wooffy-blue" />
              <span className="text-sm font-medium text-wooffy-dark">{t("blog.latest")}</span>
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
              {t("blog.latest")}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {t("blog.latestSubtitle")}
            </p>
          </div>
          <Link to="/blog">
            <Button className="gap-2 rounded-full bg-wooffy-dark text-white hover:bg-wooffy-dark/90">
              {t("blog.viewAll")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => {
            const title = localized(post.title_en, post.title_el);
            const excerpt = localized(post.excerpt_en, post.excerpt_el);
            return (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                <div className="h-full bg-card rounded-2xl overflow-hidden border border-border hover:border-wooffy-sky/60 hover:shadow-lg transition-all duration-300 flex flex-col">
                  {post.cover_image_url ? (
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      <img
                        src={post.cover_image_url}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-wooffy-sky/30 to-wooffy-blue/20" />
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-wooffy-blue bg-wooffy-sky/15 border border-wooffy-sky/30 rounded-full px-2.5 py-0.5">
                        {t(`blog.categories.${post.category}`)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.reading_minutes} {t("blog.minRead")}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-lg text-foreground line-clamp-2 group-hover:text-wooffy-blue transition-colors">
                      {title}
                    </h3>
                    {excerpt && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">
                        {excerpt}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-4">
                      {formatDate(post.published_at)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LatestFromBlog;
