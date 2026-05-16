import { useRef, useState } from "react";
import { Bold, Italic, Underline, ImagePlus, Loader2 } from "lucide-react";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateImageFile } from "@/lib/fileValidation";

interface Props extends Omit<TextareaProps, "onChange" | "value"> {
  value: string;
  onChange: (val: string) => void;
}

const MarkdownTextarea = ({ value, onChange, ...rest }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const wrap = (before: string, after: string = before) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + before.length + selected.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertAtCursor = (text: string) => {
    const ta = ref.current;
    const start = ta?.selectionStart ?? value.length;
    const end = ta?.selectionEnd ?? value.length;
    const needsLeadingNl = start > 0 && value[start - 1] !== "\n";
    const needsTrailingNl = end < value.length && value[end] !== "\n";
    const block = `${needsLeadingNl ? "\n\n" : ""}${text}${needsTrailingNl ? "\n\n" : ""}`;
    const next = value.slice(0, start) + block + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta?.focus();
      const pos = start + block.length;
      ta?.setSelectionRange(pos, pos);
    });
  };

  const handleSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid image");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `content/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("blog-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (error) throw error;
      const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
      insertAtCursor(`![](${data.publicUrl})`);
      toast.success("Image inserted");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/30 w-fit">
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => wrap("<strong>", "</strong>")} aria-label="Bold" title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => wrap("<em>", "</em>")} aria-label="Italic" title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => wrap("<u>", "</u>")} aria-label="Underline" title="Underline">
          <Underline className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Insert image"
          title="Insert image at cursor"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          <span className="ml-1 text-xs">Image</span>
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={handleSelectImage}
        />
      </div>
      <Textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
};

export default MarkdownTextarea;
