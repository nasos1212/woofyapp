import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const db = new PGlite();
await db.exec("CREATE TABLE shelters (id integer PRIMARY KEY)");
const migration = readFileSync(new URL("../drizzle/migrations/0017_shelter_animals_in_care.sql", import.meta.url), "utf8");
await db.exec(migration.split("CREATE OR REPLACE VIEW")[0]);
await db.exec("INSERT INTO shelters (id) VALUES (1)");
assert.equal((await db.query<{ animals_in_care_type: string }>("SELECT animals_in_care_type FROM shelters WHERE id = 1")).rows[0]?.animals_in_care_type, "dogs");
for (const species of ["dogs", "cats", "both"]) {
  await db.query("UPDATE shelters SET animals_in_care_type = $1 WHERE id = 1", [species]);
  assert.equal((await db.query<{ animals_in_care_type: string }>("SELECT animals_in_care_type FROM shelters WHERE id = 1")).rows[0]?.animals_in_care_type, species);
}
await assert.rejects(db.query("UPDATE shelters SET animals_in_care_type = 'birds' WHERE id = 1"));
await db.close();
console.log("PASS: shelter care supports dogs, cats or both and preserves the legacy default");