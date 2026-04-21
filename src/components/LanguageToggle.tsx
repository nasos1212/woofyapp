import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const LANGS: { code: "en" | "el"; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "el", label: "Ελληνικά", short: "ΕΛ" },
];

interface Props {
  className?: string;
  variant?: "ghost" | "outline";
}

const LanguageToggle = ({ className, variant = "ghost" }: Props) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const current = LANGS.find((l) => l.code === i18n.language) || LANGS[0];

  const handleSelect = async (code: "en" | "el") => {
    if (code === i18n.language) return;
    await i18n.changeLanguage(code);
    try {
      localStorage.setItem("wooffy_lang", code);
    } catch {}
    if (user) {
      // Best-effort persist; ignore errors so UX never breaks
      supabase
        .from("profiles")
        .update({ preferred_language: code })
        .eq("user_id", user.id)
        .then(() => {});
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className={className}>
          <Globe className="w-4 h-4 mr-1" />
          <span className="text-xs font-semibold">{current.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={i18n.language === lang.code ? "bg-muted font-medium" : ""}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageToggle;
