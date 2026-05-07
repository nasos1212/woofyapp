import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import MarkdownTextarea from "@/components/admin/MarkdownTextarea";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BlogCategory, BlogPost, computeReadingMinutes, slugify } from "@/lib/blog";
import { validateImageFile } from "@/lib/fileValidation";

interface BusinessOption {
  id: string;
  business_name: string;
}
interface ShelterOption {
  id: string;
  shelter_name: string;
}

const emptyForm = {
  id: null as string | null,
  slug: "",
  status: "draft" as "draft" | "published",
  category: "interview" as BlogCategory,
  title_en: "",
  title_el: "",
  excerpt_en: "",
  excerpt_el: "",
  content_en: "",
  content_el: "",
  cover_image_url: "",
  author_name: "",
  author_avatar_url: "",
  business_id: "",
  shelter_id: "",
  seo_title_en: "",
  seo_title_el: "",
  seo_description_en: "",
  seo_description_el: "",
};

const BlogManager = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [shelters, setShelters] = useState<ShelterOption[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(0, 199);
    if (error) {
      toast.error(error.message);
    }
    setPosts((data as unknown as BlogPost[]) || []);
    setLoading(false);
  };

  const fetchOptions = async () => {
    const [{ data: bs }, { data: sh }] = await Promise.all([
      supabase.from("businesses").select("id, business_name").order("business_name").range(0, 999),
      supabase.from("shelters").select("id, shelter_name").order("shelter_name").range(0, 499),
    ]);
    setBusinesses((bs as BusinessOption[]) || []);
    setShelters((sh as ShelterOption[]) || []);
  };

  useEffect(() => {
    fetchPosts();
    fetchOptions();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: BlogPost) => {
    setForm({
      id: p.id,
      slug: p.slug,
      status: p.status,
      category: p.category,
      title_en: p.title_en || "",
      title_el: p.title_el || "",
      excerpt_en: p.excerpt_en || "",
      excerpt_el: p.excerpt_el || "",
      content_en: p.content_en || "",
      content_el: p.content_el || "",
      cover_image_url: p.cover_image_url || "",
      author_name: p.author_name || "",
      author_avatar_url: p.author_avatar_url || "",
      business_id: p.business_id || "",
      shelter_id: p.shelter_id || "",
      seo_title_en: p.seo_title_en || "",
      seo_title_el: p.seo_title_el || "",
      seo_description_en: p.seo_description_en || "",
      seo_description_el: p.seo_description_el || "",
    });
    setOpen(true);
  };

  const handleTitleEnChange = (val: string) => {
    setForm((f) => ({
      ...f,
      title_en: val,
      slug: f.id ? f.slug : slugify(val),
    }));
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateImageFile(file);
    if (!v.valid) {
      toast.error(v.error || "Invalid file");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("blog-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
      setForm((f) => ({ ...f, cover_image_url: data.publicUrl }));
      toast.success(t("blogAdmin.uploadSuccess"));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    if (!form.title_en.trim() || !form.content_en.trim()) {
      toast.error(t("blogAdmin.requiredFields"));
      return;
    }
    const finalSlug = form.slug.trim() || slugify(form.title_en);
    setSaving(true);
    const payload = {
      slug: finalSlug,
      status: form.status,
      category: form.category,
      title_en: form.title_en.trim(),
      title_el: form.title_el.trim() || null,
      excerpt_en: form.excerpt_en.trim() || null,
      excerpt_el: form.excerpt_el.trim() || null,
      content_en: form.content_en,
      content_el: form.content_el.trim() || null,
      cover_image_url: form.cover_image_url || null,
      author_name: form.author_name.trim() || null,
      author_avatar_url: form.author_avatar_url || null,
      business_id: form.business_id || null,
      shelter_id: form.shelter_id || null,
      seo_title_en: form.seo_title_en.trim() || null,
      seo_title_el: form.seo_title_el.trim() || null,
      seo_description_en: form.seo_description_en.trim() || null,
      seo_description_el: form.seo_description_el.trim() || null,
      reading_minutes: computeReadingMinutes(form.content_en),
      published_at:
        form.status === "published" ? new Date().toISOString() : null,
    };

    let error;
    if (form.id) {
      // Preserve existing published_at if already published
      const existing = posts.find((p) => p.id === form.id);
      if (existing?.status === "published" && form.status === "published" && existing.published_at) {
        (payload as any).published_at = existing.published_at;
      }
      ({ error } = await supabase.from("blog_posts").update(payload).eq("id", form.id));
    } else {
      ({ error } = await supabase
        .from("blog_posts")
        .insert({ ...payload, created_by: user?.id }));
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("blogAdmin.saved"));
    setOpen(false);
    fetchPosts();
  };

  const togglePublish = async (p: BlogPost) => {
    const newStatus = p.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("blog_posts")
      .update({
        status: newStatus,
        published_at: newStatus === "published" ? p.published_at || new Date().toISOString() : p.published_at,
      })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else fetchPosts();
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) toast.error(error.message);
    else {
      toast.success(t("blogAdmin.deleted"));
      fetchPosts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("blogAdmin.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("blogAdmin.subtitle")}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> {t("blogAdmin.newPost")}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">{t("blogAdmin.empty")}</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center gap-4">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} className="w-20 h-14 object-cover rounded" alt="" />
                ) : (
                  <div className="w-20 h-14 rounded bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={p.status === "published" ? "default" : "secondary"}>
                      {t(`blogAdmin.status.${p.status}`)}
                    </Badge>
                    <Badge variant="outline">{t(`blog.categories.${p.category}`)}</Badge>
                    <span className="text-xs text-muted-foreground">{p.view_count} {t("blogAdmin.views")}</span>
                  </div>
                  <p className="font-medium truncate">{p.title_en}</p>
                  <p className="text-xs text-muted-foreground truncate">/{p.slug}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {p.status === "published" && (
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" aria-label="View">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => togglePublish(p)} aria-label="Toggle">
                    {p.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} aria-label="Delete">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? t("blogAdmin.editPost") : t("blogAdmin.newPost")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Meta row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>{t("blogAdmin.category")}</Label>
                <Select
                  value={form.category}
                  onValueChange={(v: BlogCategory) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" className="max-h-[40vh]">
                    {(["interview", "guide", "news", "story"] as BlogCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>{t(`blog.categories.${c}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("blogAdmin.statusLabel")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(v: "draft" | "published") => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" className="max-h-[40vh]">
                    <SelectItem value="draft">{t("blogAdmin.status.draft")}</SelectItem>
                    <SelectItem value="published">{t("blogAdmin.status.published")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("blogAdmin.slug")}</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="my-post"
                />
              </div>
            </div>

            {/* Cover */}
            <div>
              <Label>{t("blogAdmin.coverImage")}</Label>
              <div className="flex items-center gap-3 mt-2">
                {form.cover_image_url ? (
                  <img src={form.cover_image_url} alt="" className="w-32 h-20 object-cover rounded" />
                ) : (
                  <div className="w-32 h-20 bg-muted rounded" />
                )}
                <label>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadCover} />
                  <Button type="button" variant="outline" disabled={uploading} asChild>
                    <span className="cursor-pointer">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span className="ml-2">{t("blogAdmin.upload")}</span>
                    </span>
                  </Button>
                </label>
                {form.cover_image_url && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, cover_image_url: "" }))}>
                    {t("blogAdmin.remove")}
                  </Button>
                )}
              </div>
            </div>

            {/* Author + linked entity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>{t("blogAdmin.authorName")}</Label>
                <Input value={form.author_name} onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))} />
              </div>
              <div>
                <Label>{t("blogAdmin.linkedBusiness")}</Label>
                <Select
                  value={form.business_id || "none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, business_id: v === "none" ? "" : v }))}
                >
                  <SelectTrigger><SelectValue placeholder={t("blogAdmin.none")} /></SelectTrigger>
                  <SelectContent position="popper" className="max-h-[40vh]">
                    <SelectItem value="none">{t("blogAdmin.none")}</SelectItem>
                    {businesses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.business_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("blogAdmin.linkedShelter")}</Label>
                <Select
                  value={form.shelter_id || "none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, shelter_id: v === "none" ? "" : v }))}
                >
                  <SelectTrigger><SelectValue placeholder={t("blogAdmin.none")} /></SelectTrigger>
                  <SelectContent position="popper" className="max-h-[40vh]">
                    <SelectItem value="none">{t("blogAdmin.none")}</SelectItem>
                    {shelters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.shelter_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* EN / EL tabs */}
            <Tabs defaultValue="en">
              <TabsList>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="el">Ελληνικά</TabsTrigger>
                <TabsTrigger value="preview">{t("blogAdmin.preview")}</TabsTrigger>
              </TabsList>
              <TabsContent value="en" className="space-y-3">
                <div>
                  <Label>{t("blogAdmin.titleField")} *</Label>
                  <Input value={form.title_en} onChange={(e) => handleTitleEnChange(e.target.value)} />
                </div>
                <div>
                  <Label>{t("blogAdmin.excerpt")}</Label>
                  <Textarea rows={2} value={form.excerpt_en} onChange={(e) => setForm((f) => ({ ...f, excerpt_en: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("blogAdmin.content")} (Markdown) *</Label>
                  <MarkdownTextarea rows={14} value={form.content_en} onChange={(v) => setForm((f) => ({ ...f, content_en: v }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>SEO title</Label>
                    <Input value={form.seo_title_en} onChange={(e) => setForm((f) => ({ ...f, seo_title_en: e.target.value }))} />
                  </div>
                  <div>
                    <Label>SEO description</Label>
                    <Input value={form.seo_description_en} onChange={(e) => setForm((f) => ({ ...f, seo_description_en: e.target.value }))} />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="el" className="space-y-3">
                <div>
                  <Label>{t("blogAdmin.titleField")}</Label>
                  <Input value={form.title_el} onChange={(e) => setForm((f) => ({ ...f, title_el: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("blogAdmin.excerpt")}</Label>
                  <Textarea rows={2} value={form.excerpt_el} onChange={(e) => setForm((f) => ({ ...f, excerpt_el: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("blogAdmin.content")} (Markdown)</Label>
                  <MarkdownTextarea rows={14} value={form.content_el} onChange={(v) => setForm((f) => ({ ...f, content_el: v }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>SEO title</Label>
                    <Input value={form.seo_title_el} onChange={(e) => setForm((f) => ({ ...f, seo_title_el: e.target.value }))} />
                  </div>
                  <div>
                    <Label>SEO description</Label>
                    <Input value={form.seo_description_el} onChange={(e) => setForm((f) => ({ ...f, seo_description_el: e.target.value }))} />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="preview">
                <div className="rounded border p-4 max-h-[500px] overflow-y-auto">
                  <h2 className="font-bold text-2xl mb-2">{form.title_en}</h2>
                  <article className="prose prose-slate dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{form.content_en || ""}</ReactMarkdown>
                  </article>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("blogAdmin.confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("blogAdmin.confirmDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogManager;
