import { useEffect, useRef } from "react";

const PWAUpdatePrompt = () => {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const setupServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        registrationRef.current = reg;

        // If there's a waiting worker, activate it immediately
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Listen for new updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      } catch (error) {
        console.error("Service worker setup error:", error);
      }
    };

    setupServiceWorker();

    // Listen for controller changes and reload
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Check for updates every 15 seconds
    const interval = setInterval(() => {
      registrationRef.current?.update();
    }, 15 * 1000);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
};

export default PWAUpdatePrompt;
