import { useRef } from "react";
import { Bold, Italic, Underline } from "lucide-react";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props extends Omit<TextareaProps, "onChange" | "value"> {
  value: string;
  onChange: (val: string) => void;
}

const MarkdownTextarea = ({ value, onChange, ...rest }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);

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
      </div>
      <Textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
};

export default MarkdownTextarea;
