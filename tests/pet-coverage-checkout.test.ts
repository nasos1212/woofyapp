import assert from "node:assert/strict";
import { validateCoverageSelection, resolveCoveredPetIds } from "../supabase/functions/_shared/petCoverage";

const pets = [{ id: "Kobe", is_covered: false, covered_at: null }, { id: "Test", is_covered: false, covered_at: null }];
assert.deepEqual(validateCoverageSelection(pets, ["Test"], "wooffy_solo_yearly", false), ["Test"]);
assert.throws(() => validateCoverageSelection(pets, [], "wooffy_solo_yearly", false));
assert.throws(() => validateCoverageSelection(pets, ["Kobe", "Test"], "wooffy_solo_yearly", false));
assert.throws(() => validateCoverageSelection(pets, ["other-owner"], "wooffy_solo_yearly", false));
assert.deepEqual(resolveCoveredPetIds(pets, 1, { coverage_price: "wooffy_solo_yearly", covered_pet_ids: '["Test"]', coverage_selected_at: "2026-11-19T00:00:00Z" }, "wooffy_solo_yearly"), ["Test"]);
const locked = [{ ...pets[0], is_covered: true, covered_at: "2026-11-19T00:00:00Z" }, pets[1]];
assert.throws(() => validateCoverageSelection(locked, ["Test"], "wooffy_solo_yearly", true, new Date("2027-03-19T00:00:00Z")));
assert.deepEqual(validateCoverageSelection(locked, ["Kobe", "Test"], "wooffy_duo_yearly", true), ["Kobe", "Test"]);
assert.deepEqual(resolveCoveredPetIds(pets, 0), []);
assert.deepEqual(validateCoverageSelection(locked, ["Test"], "wooffy_solo_yearly", true, new Date("2027-11-20T00:00:00Z")), ["Test"]);
assert.deepEqual(resolveCoveredPetIds([{ ...pets[0], is_covered: true, covered_at: "2026-12-20T00:00:00Z" }, pets[1]], 1, { coverage_price: "wooffy_solo_yearly", covered_pet_ids: '["Test"]', coverage_selected_at: "2026-11-19T00:00:00Z" }, "wooffy_solo_yearly"), ["Kobe"]);
assert.deepEqual(resolveCoveredPetIds(locked, 1, { coverage_price: "wooffy_duo_yearly", covered_pet_ids: '["Test","Kobe"]' }, "wooffy_solo_yearly"), ["Kobe"]);
console.log("Pre-payment pet selection, ownership, plan limits, locks and paid coverage pass.");