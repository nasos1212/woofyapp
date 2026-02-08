import { useEffect, useState } from "react";

const PWAUpdatePrompt = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Get the service worker registration
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // If there's a waiting worker, activate it immediately
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      });

      // Listen for controller changes and reload
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      // Check for updates every 15 seconds (more aggressive)
      const interval = setInterval(() => {
        registration?.update();
      }, 15 * 1000);

      return () => clearInterval(interval);
    }
  }, [registration]);

  useEffect(() => {
    if (registration) {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            // Auto-activate the new worker as soon as it's installed
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        }
      });
    }
  }, [registration]);

  return null;
};

export default PWAUpdatePrompt;
