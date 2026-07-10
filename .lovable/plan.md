## Problem

On small screens the "How was your experience?" rating prompt dialog stretches to the full viewport width with no gutter — it visually touches (or overflows) the screen edges. On desktop it's fine because `sm:max-w-md` kicks in and the dialog centers with breathing room.

Root cause: the base `DialogContent` primitive is `w-full max-w-lg` with `p-6`, and the RatingPromptDialog doesn't override for the mobile range. Combined with the inner star row and two side-by-side action buttons whose Greek labels are long, the content pushes right to the edges.

## Fix (scoped to `src/components/RatingPromptDialog.tsx` only)

Keep the desktop look identical. Adjust the mobile presentation:

1. **Add a horizontal gutter on mobile.**
   Change `DialogContent` className from `sm:max-w-md` to `w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-md` so the dialog always leaves ~16px of space on each side of the phone screen.

2. **Reduce inner padding on mobile.**
   Override the primitive's `p-6 pt-10` with `p-4 pt-9 sm:p-6 sm:pt-10` on `DialogContent` so text and stars aren't pressed against the dialog edges once the outer gutter is added.

3. **Tighten the star row so it never overflows.**
   Change the star buttons from `w-10 h-10` fixed size + `gap-2` to `w-8 h-8 sm:w-10 sm:h-10` and `gap-1.5 sm:gap-2`. On a 320–360px viewport the current 5×40px stars + gaps + padding are what force the dialog to feel oversized.

4. **Stack the two secondary actions on very small screens.**
   Change the "Remind me later / Don't ask again" row from `flex gap-2` (always side-by-side) to `flex flex-col sm:flex-row gap-2`. The Greek copy ("Υπενθύμισέ μου αργότερα", "Μη με ξαναρωτήσεις") is long enough to wrap awkwardly at ~320px and contributes to the "takes up the whole screen and more" feeling. Primary submit button stays full-width as today.

5. **Constrain title size on mobile** so the star emoji + long title don't force horizontal growth: `text-lg sm:text-xl` on `DialogTitle`.

No other files, no logic changes, no copy changes, no i18n changes.

## Verification

- Preview at 360px width: dialog has visible background gutter on both sides, stars fit comfortably, action buttons stack cleanly.
- Preview at 768px+: dialog looks identical to today (max-w-md, side-by-side secondary actions, w-10 stars).
- No changes to `src/components/ui/dialog.tsx` — global dialog behavior stays untouched.