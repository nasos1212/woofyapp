import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { shouldLogSession } from './sessionTracking';

describe('session throttle', () => {
  it('logs first session', () => expect(shouldLogSession(null, 1000)).toBe(true));
  it('skips within 30 minutes', () => expect(shouldLogSession(0, 29 * 60 * 1000)).toBe(false));
  it('logs after 30 minutes', () => expect(shouldLogSession(0, 30 * 60 * 1000)).toBe(true));
});
