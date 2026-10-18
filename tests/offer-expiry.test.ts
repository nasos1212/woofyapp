import assert from "node:assert/strict";
import { excludeExpiredOffers } from "../src/lib/offerExpiry";

const now = new Date("2026-10-18T15:10:00.000Z");
let filter = "";
const query = { or(value: string) { filter = value; return this; } };
assert.equal(excludeExpiredOffers(query, now), query);
assert.equal(filter, "valid_until.is.null,valid_until.gte.2026-10-18T15:10:00.000Z");
console.log("User-facing expiry query excludes past dates and retains offers without an expiry.");