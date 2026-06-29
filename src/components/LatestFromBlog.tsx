import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { localized, formatDate, type BlogPost } from "@/lib/blog";

const AUTOPLAY_INTERVAL = 5000;

const LatestFromBlog = () => {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

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

  const goTo = useCallback(
    (idx: number) => {
      if (posts.length === 0) return;
      setCurrent((idx + posts.length) % posts.length);
    },
    [posts.length]
  );

  const next = useCallback(() => goTo(current + 1), [goTo, current]);
  const prev = useCallback(() => goTo(current - 1), [goTo, current]);

  useEffect(() => {
    if (posts.length <= 1 || isPaused) return;
    const id = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(id);
  }, [posts.length, isPaused, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? next() : prev();
    }
    touchStartX.current = null;
  };

  if (loading || posts.length === 0) return null;

  const post = posts[current];
  const title = localized(post.title_en, post.title_el);
  const excerpt = localized(post.excerpt_en, post.excerpt_el);

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

        <div
          className="relative overflow-hidden rounded-2xl bg-card border shadow-sm"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="md:w-3/5 aspect-[16/10] md:aspect-auto md:min-h-[340px] overflow-hidden relative">
              {post.cover_image_url ? (
                <img
                  key={post.id}
                  src={post.cover_image_url}
                  alt={title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-wooffy-sky/20" />
              )}
            </div>

            {/* Content */}
            <div className="md:w-2/5 p-6 md:p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="capitalize">
                  {t(`blog.categories.${post.category}`)}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.reading_minutes} {t("blog.minRead")}
                </span>
              </div>
              <h3 className="font-display font-bold text-xl md:text-2xl text-foreground mb-3">
                {title}
              </h3>
              {excerpt && (
                <p className="text-sm md:text-base text-muted-foreground line-clamp-3 mb-4">
                  {excerpt}
                </p>
              )}
              <p className="text-xs text-muted-foreground mb-6">
                {formatDate(post.published_at)}
              </p>
              <Link to={`/blog/${post.slug}`}>
                <Button className="w-fit gap-2">
                  {t("blog.readMore")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Arrows */}
          {posts.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm flex items-center justify-center text-foreground hover:bg-background transition-colors z-10"
                aria-label={t("blog.prev")}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm flex items-center justify-center text-foreground hover:bg-background transition-colors z-10"
                aria-label={t("blog.next")}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {posts.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {posts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === current
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestFromBlog;
