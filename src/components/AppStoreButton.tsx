import { Capacitor } from "@capacitor/core";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

export default function AppStoreButton() {
  const { t } = useTranslation();
  if (Capacitor.isNativePlatform()) return null;

  return (
    <Button
      asChild
      variant="outline"
      className="h-16 w-[216px] max-w-full gap-2.5 rounded-full border-app-store-foreground/20 bg-app-store px-6 text-app-store-foreground shadow-card hover:bg-app-store hover:text-app-store-foreground hover:shadow-soft [&_svg]:size-8"
    >
      <a
        href="https://apps.apple.com/cy/app/wooffy/id6819098781"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("hero.appStoreAria")}
      >
        <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0 fill-current" aria-hidden="true">
          <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.97-3.46-1.07-1.57-2.74-1.78-3.33-1.8-1.42-.14-2.77.83-3.49.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.29-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.59-.75 2.99-.75 1.4 0 1.79.75 3.01.72 1.24-.02 2.03-1.13 2.79-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.42-.93-2.45-3.71zM14.08 5.85c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.78-.97 2.83 1.02.08 2.07-.52 2.71-1.29z" />
        </svg>
        <span className="flex min-w-0 flex-col text-left leading-tight">
          <span className="text-xs font-normal leading-5">{t("hero.appStoreSmall")}</span>
          <span className="text-[22px] font-medium leading-6">App Store</span>
        </span>
      </a>
    </Button>
  );
}