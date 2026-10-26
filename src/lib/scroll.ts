/**
 * In the native iPhone shell the page itself never scrolls: #root is the
 * scroll container (see `html.capacitor` in index.css). This keeps fixed top
 * bars pinned, because iOS WebKit can draw them mid-screen when the whole
 * document scrolls. On the web, the window scrolls as usual.
 */
export function getScrollContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (!document.documentElement.classList.contains("capacitor")) return null;
  return document.getElementById("root");
}

export function getScrollTop(): number {
  const el = getScrollContainer();
  return el ? el.scrollTop : window.scrollY;
}

export function scrollToTop(behavior: ScrollBehavior = "auto"): void {
  const el = getScrollContainer();
  (el ?? window).scrollTo({ top: 0, left: 0, behavior });
}

export function addScrollListener(cb: () => void): () => void {
  const target: HTMLElement | Window = getScrollContainer() ?? window;
  target.addEventListener("scroll", cb, { passive: true });
  return () => target.removeEventListener("scroll", cb);
}
