// Formats a stored pet age like "2 years" or "6 months" using pluralized translations.
// Falls back to the raw string when the stored format is unexpected.
export const formatPetAge = (
  age: string,
  t: (key: string, options?: Record<string, unknown>) => string
): string => {
  const match = age.trim().match(/^(\d+)\s*(months?|years?)$/i);
  if (!match) return age;
  const count = parseInt(match[1], 10);
  if (Number.isNaN(count)) return age;
  if (match[2].toLowerCase().startsWith("month")) {
    return t("adoptablePets.ageMonthsOld", { count });
  }
  return t("adoptablePets.ageYearsOld", { count });
};
