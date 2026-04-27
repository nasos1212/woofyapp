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

const LANGS: { code: "en" | "el"; label: string; short: string; flag: string }[] = [
  { code: "en", label: "English", short: "EN", flag: "https://flagcdn.com/gb.svg" },
  { code: "el", label: "Ελληνικά", short: "ΕΛ", flag: "https://flagcdn.com/gr.svg" },
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
        <Button
          variant={variant}
          size="sm"
          className={`px-2 sm:px-3 h-9 gap-1 sm:gap-1.5 ${className ?? ""}`}
        >
          <img
            src={current.flag}
            alt={current.label}
            className="w-5 h-[14px] sm:w-6 sm:h-[18px] object-cover rounded-[2px] border border-border/40"
          />
          <span className="text-[11px] sm:text-xs font-semibold">{current.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={`gap-2 ${i18n.language === lang.code ? "bg-muted font-medium" : ""}`}
          >
            <img src={lang.flag} alt={lang.label} className="w-5 h-[14px] object-cover rounded-[2px] border border-border/40" />
            <span>{lang.label}</span>
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={`gap-2 ${i18n.language === lang.code ? "bg-muted font-medium" : ""}`}
          >
            <span className="text-base leading-none" aria-hidden>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageToggle;
