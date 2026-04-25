import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Tag, BarChart3, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const BusinessMobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = [
    { path: "/business", icon: LayoutDashboard, label: t("businessNav.dashboard") },
    { path: "/business/offers", icon: Tag, label: t("businessNav.offers") },
    { path: "/business/analytics", icon: BarChart3, label: t("businessNav.analytics") },
    { path: "/business/settings", icon: Settings, label: t("businessNav.settings") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BusinessMobileNav;
