-- Blog category enum
CREATE TYPE public.blog_category AS ENUM ('interview', 'guide', 'news', 'story');
CREATE TYPE public.blog_status AS ENUM ('draft', 'published');

-- Blog posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  status public.blog_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  category public.blog_category NOT NULL DEFAULT 'interview',
  title_en TEXT NOT NULL,
  title_el TEXT,
  excerpt_en TEXT,
  excerpt_el TEXT,
  content_en TEXT NOT NULL,
  content_el TEXT,
  cover_image_url TEXT,
  author_name TEXT,
  author_avatar_url TEXT,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  shelter_id UUID REFERENCES public.shelters(id) ON DELETE SET NULL,
  reading_minutes INT NOT NULL DEFAULT 1,
  view_count INT NOT NULL DEFAULT 0,
  seo_title_en TEXT,
  seo_title_el TEXT,
  seo_description_en TEXT,
  seo_description_el TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_status_published ON public.blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX idx_blog_posts_business ON public.blog_posts(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX idx_blog_posts_shelter ON public.blog_posts(shelter_id) WHERE shelter_id IS NOT NULL;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read only published posts
CREATE POLICY "Published posts are viewable by everyone"
ON public.blog_posts FOR SELECT
USING (status = 'published' AND published_at IS NOT NULL AND published_at <= now());

-- Admins can do everything
CREATE POLICY "Admins can view all blog posts"
ON public.blog_posts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert blog posts"
ON public.blog_posts FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blog posts"
ON public.blog_posts FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blog posts"
ON public.blog_posts FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Increment view count RPC (public, safe — only increments published posts)
CREATE OR REPLACE FUNCTION public.increment_blog_view(_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET view_count = view_count + 1
  WHERE slug = _slug
    AND status = 'published';
END;
$$;

-- Storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Blog images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blog images"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));