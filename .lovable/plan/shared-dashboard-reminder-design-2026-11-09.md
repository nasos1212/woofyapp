# Shared dashboard reminder design

## What will change
- Use the same cleaner reminder panel for Free and Paid members wherever reminders are already shown.
- Replace the heavy gradients and bright blocks with a compact, neutral layout: a bell heading, reminder count, subtle urgency accents, and readable reminder rows.
- Let long reminder titles and Greek text wrap naturally on phones. Keep the pet name, due date, and status clearly separated.
- Make **Hide** collapse only the reminder list. The heading, count, urgent summary, and **Show more** button stay visible so members can reopen it immediately.
- Remove the old session-based hiding behavior so previously hidden panels can appear again.
- Keep your development-only sample reminders available for checking the design; samples never save records or send alerts.

## What stays unchanged
- Membership access, reminder timing, saved health records, notification wording, and phone alerts.
- Free-member samples remain preview-only; this does not introduce new paid features into Free memberships.
- No SEO pages or unrelated fixes.

## Technical details
- Update the shared `AIProactiveAlerts` presentation rather than maintaining separate membership designs.
- Use existing semantic theme colors and shared controls; replace the permanent hidden state with a reversible collapsed state.
- Retain all preview mutation guards and existing reminder data retrieval.

## Checks
- Verify Hide → visible summary → Show more → the same reminders return, with no record changes or alert dispatch.
- Check English and Greek layouts at phone and desktop widths.
- Run existing reminder-preview tests and add a focused regression check for reversible collapsing.
- Website changes require publishing; the installed iPhone app needs the next app update.