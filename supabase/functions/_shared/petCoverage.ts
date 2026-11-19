export const COVERAGE_SLOTS: Record<string, number> = {
  wooffy_solo_yearly: 1,
  wooffy_duo_yearly: 2,
  wooffy_pack_yearly: 5,
};

export interface CoveragePet {
  id: string;
  is_covered: boolean;
  covered_at: string | null;
}

export function validateCoverageSelection(pets: CoveragePet[], value: unknown, priceId: string, preserveLocked: boolean, now = new Date()): string[] {
  const slots = COVERAGE_SLOTS[priceId];
  if (!slots) throw new Error("Unknown plan");
  if (!Array.isArray(value) || value.some(id => typeof id !== "string")) throw new Error("Choose the pets your plan covers before payment.");
  const ids = value as string[];
  if (!pets.length || ids.length !== Math.min(slots, pets.length) || new Set(ids).size !== ids.length) throw new Error("Choose the correct number of pets for this plan.");
  if (ids.some(id => !pets.some(pet => pet.id === id))) throw new Error("You can only cover your own pets.");
  if (preserveLocked && pets.some(pet => {
    if (!pet.is_covered || !pet.covered_at) return false;
    const until = new Date(pet.covered_at);
    until.setUTCFullYear(until.getUTCFullYear() + 1);
    return until > now && !ids.includes(pet.id);
  })) throw new Error("Keep your currently locked pets selected.");
  return ids;
}

export async function loadCoverageSelection(db: any, userId: string, value: unknown, priceId: string, preserveLocked: boolean) {
  const { data, error } = await db.from("pets").select("id, is_covered, covered_at").eq("owner_user_id", userId);
  if (error) throw new Error("Unable to load your pets. Please try again.");
  return validateCoverageSelection(data ?? [], value, priceId, preserveLocked);
}

export function coverageMetadata(ids: string[], priceId: string) {
  return { covered_pet_ids: JSON.stringify(ids), coverage_price: priceId, coverage_selected_at: new Date().toISOString() };
}

export function resolveCoveredPetIds(pets: CoveragePet[], slots: number, metadata?: Record<string, string>, priceId?: string): string[] {
  if (!slots) return [];
  if (metadata?.coverage_price === priceId && metadata?.covered_pet_ids) {
    const selected: unknown = JSON.parse(metadata.covered_pet_ids);
    if (!Array.isArray(selected) || selected.some(id => typeof id !== "string") || new Set(selected).size !== selected.length || selected.length > slots) throw new Error("Invalid coverage metadata");
    // Preserve any later dashboard swap when Stripe resends subscription events.
    const newer = pets.filter(p => p.is_covered && p.covered_at && p.covered_at > metadata.coverage_selected_at);
    return [...new Set([...newer.map(p => p.id), ...selected.filter(id => pets.some(p => p.id === id))])].slice(0, slots);
  }
  return [...pets.filter(p => p.is_covered), ...pets.filter(p => !p.is_covered)].slice(0, slots).map(p => p.id);
}