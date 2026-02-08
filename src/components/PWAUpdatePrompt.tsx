import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const PWAUpdatePrompt = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const updateSW = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  }, [waitingWorker]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Check for waiting service worker on load
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
        }
      });

      // Listen for new service worker updates
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      // Check for updates periodically
      const interval = setInterval(() => {
        registration?.update();
      }, 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [registration]);

  useEffect(() => {
    if (registration) {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
            }
          });
        }
      });
    }
  }, [registration]);

  useEffect(() => {
    if (waitingWorker) {
      toast(
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium">New version available!</p>
            <p className="text-sm text-muted-foreground">Click to update</p>
          </div>
          <Button size="sm" onClick={updateSW}>
            Update
          </Button>
        </div>,
        {
          duration: Infinity,
          id: "pwa-update",
        }
      );
    }
  }, [waitingWorker, updateSW]);

  return null;
};

export default PWAUpdatePrompt;
