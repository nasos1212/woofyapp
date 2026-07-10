## Make breed required when adding a pet

### Goal
Prevent pets from being saved with no breed (which the app currently displays as "Mixed breed"), so admin analytics and breed insights reflect real data.

### Changes (frontend only)

**`src/pages/AddPet.tsx`**
- Add validation in `handleSubmit`: if `petBreed.trim()` is empty, show a toast error (`t("addPet.errors.noBreed")`) and abort.
- Add `disabled` to the submit button when `!petBreed.trim()` (alongside the existing `!petName.trim()` check).
- Mark the Breed label as required with a visual asterisk, matching how required fields are typically indicated on the form.
- Keep the searchable combobox as-is so users can type a custom breed if theirs isn't listed (e.g. "Mixed breed", "Unknown"), preserving flexibility while forcing a conscious choice.

**`src/pages/PetProfile.tsx`** (edit flow, if it allows clearing breed)
- Mirror the same required rule when editing an existing pet so users can't blank it out.

**`src/i18n/locales/en.json`** (and any other locale files present)
- Add `addPet.errors.noBreed` — e.g. "Please select or type your pet's breed."
- Update `addPet.breed` label to include the required indicator, or add a helper string.

### Not in scope
- No database migration. Existing pets with `pet_breed = null` stay as-is; only new/edited pets are affected.
- No change to the "Mixed breed" fallback display for legacy records (separate cleanup if you want it later).
- No change to admin analytics logic.

### Verification
- Try to submit AddPet with breed empty → button disabled + error toast if bypassed.
- Submit with a typed custom breed (e.g. "Mixed breed") → succeeds.
- Edit an existing pet, clear the breed → blocked.
