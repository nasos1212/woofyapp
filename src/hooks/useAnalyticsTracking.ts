import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

type EventType = 
  | "page_view"
  | "business_view"
  | "offer_view"
  | "offer_click"
  | "offer_redeem"
  | "shelter_view"
  | "pet_view"
  | "search"
  | "button_click";

interface TrackEventParams {
  eventType: EventType;
  entityType?: "business" | "offer" | "shelter" | "pet" | "page";
  entityId?: string;
  entityName?: string;
  metadata?: Json;
}

export const useAnalyticsTracking = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(
    async ({ eventType, entityType, entityId, entityName, metadata }: TrackEventParams) => {
      try {
        await supabase.from("analytics_events").insert([{
          user_id: user?.id || null,
          event_type: eventType,
          entity_type: entityType || null,
          entity_id: entityId || null,
          entity_name: entityName || null,
          metadata: metadata || {},
        }]);
      } catch (error) {
        // Silently fail - don't interrupt user experience for analytics
        console.error("Analytics tracking error:", error);
      }
    },
    [user?.id]
  );

  const trackBusinessView = useCallback(
    (businessId: string, businessName: string) => {
      trackEvent({
        eventType: "business_view",
        entityType: "business",
        entityId: businessId,
        entityName: businessName,
      });
    },
    [trackEvent]
  );

  const trackOfferClick = useCallback(
    (offerId: string, offerTitle: string, businessName?: string) => {
      trackEvent({
        eventType: "offer_click",
        entityType: "offer",
        entityId: offerId,
        entityName: offerTitle,
        metadata: { business_name: businessName } as Json,
      });
    },
    [trackEvent]
  );

  const trackOfferRedeem = useCallback(
    (offerId: string, offerTitle: string, businessId: string) => {
      trackEvent({
        eventType: "offer_redeem",
        entityType: "offer",
        entityId: offerId,
        entityName: offerTitle,
        metadata: { business_id: businessId } as Json,
      });
    },
    [trackEvent]
  );

  const trackShelterView = useCallback(
    (shelterId: string, shelterName: string) => {
      trackEvent({
        eventType: "shelter_view",
        entityType: "shelter",
        entityId: shelterId,
        entityName: shelterName,
      });
    },
    [trackEvent]
  );

  const trackSearch = useCallback(
    (query: string, resultCount: number) => {
      trackEvent({
        eventType: "search",
        metadata: { query, result_count: resultCount } as Json,
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackBusinessView,
    trackOfferClick,
    trackOfferRedeem,
    trackShelterView,
    trackSearch,
  };
};
