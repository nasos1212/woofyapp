/**
 * Feature flags for the app.
 *
 * PAID_MEMBERSHIP_ENABLED: Master switch for paid (premium) membership flows.
 * Stripe is not connected for live payments yet — keep this false to hide
 * every entry point that leads to a paid upgrade. The /member/upgrade route
 * will render a "Coming Soon" screen while this is false.
 */
export const PAID_MEMBERSHIP_ENABLED = true;
