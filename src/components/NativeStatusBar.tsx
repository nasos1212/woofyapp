import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

// Dark auth screen needs light status-bar icons; all other pages are light, so use dark icons.
const DARK_ROUTES = ["/auth"];

const NativeStatusBar = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const dark = DARK_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
    StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
  }, [pathname]);
  return null;
};

export default NativeStatusBar;
