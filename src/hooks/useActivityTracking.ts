import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ActivityData {
  [key: string]: any;
}

export const useActivityTracking = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Track page views
  useEffect(() => {
    if (user) {
      trackActivity('page_view', { path: location.pathname }, location.pathname);
    }
  }, [location.pathname, user]);

  const trackActivity = useCallback(async (
    activityType: string,
    activityData: ActivityData = {},
    pagePath?: string
  ) => {
    if (!user) return;

    try {
      await supabase.from('user_activity_tracking').insert({
        user_id: user.id,
        activity_type: activityType,
        activity_data: activityData,
        page_path: pagePath || location.pathname,
      });
    } catch (error) {
      // Silently fail - we don't want tracking to break the app
      console.debug('Activity tracking error:', error);
    }
  }, [user, location.pathname]);

  const trackOfferView = useCallback((offerId: string, offerTitle: string, category?: string) => {
    trackActivity('offer_view', { offer_id: offerId, title: offerTitle, category });
  }, [trackActivity]);

  const trackOfferRedeem = useCallback((offerId: string, offerTitle: string, businessName?: string) => {
    trackActivity('offer_redeem', { offer_id: offerId, title: offerTitle, business: businessName });
  }, [trackActivity]);

  const trackSearch = useCallback((query: string, resultCount: number) => {
    trackActivity('search', { query, result_count: resultCount });
  }, [trackActivity]);

  const trackFeatureUse = useCallback((featureName: string, details?: ActivityData) => {
    trackActivity('feature_use', { feature: featureName, ...details });
  }, [trackActivity]);

  const trackHealthRecordView = useCallback((petId: string, petName: string) => {
    trackActivity('health_record_view', { pet_id: petId, pet_name: petName });
  }, [trackActivity]);

  const trackAIChat = useCallback((messageCount: number, petName?: string) => {
    trackActivity('ai_chat', { message_count: messageCount, pet_name: petName });
  }, [trackActivity]);

  return {
    trackActivity,
    trackOfferView,
    trackOfferRedeem,
    trackSearch,
    trackFeatureUse,
    trackHealthRecordView,
    trackAIChat,
  };
};