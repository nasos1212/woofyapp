/** Apply expiry filtering before a user-facing offer query is limited. */
export function excludeExpiredOffers<T>(
  query: { or: (filters: string) => T },
  now = new Date(),
): T {
  return query.or(`valid_until.is.null,valid_until.gte.${now.toISOString()}`);
}