# Fix Greek mobile button and reading-time grammar

## Changes
- Keep the empty-pets action button fully inside its card on narrow iPhones, allowing the long Greek label to wrap cleanly without clipping.
- Add singular and plural Greek reading-time translations so `1` displays as “1 λεπτό ανάγνωσης” and all other values use “λεπτά ανάγνωσης”.
- Pass the article reading-time count to every place that displays this label, including blog cards and article pages.

## Verification
- Check the empty-pets card at a narrow mobile width in Greek.
- Confirm both one-minute and multi-minute labels render correctly.
- Check the latest preview build for errors.
