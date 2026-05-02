import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              {t("blog.latest")}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {t("blog.latestSubtitle")}
            </p>
          </div>
          <Link to="/blog">
            <Button variant="outline" className="gap-2">
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
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
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
                    <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-wooffy-sky/20" />
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="capitalize">
                        {t(`blog.categories.${post.category}`)}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.reading_minutes} {t("blog.minRead")}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {title}
                    </h3>
                    {excerpt && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">
                        {excerpt}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">
                      {formatDate(post.published_at)}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LatestFromBlog;
