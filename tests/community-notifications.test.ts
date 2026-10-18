import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Exercise the actual deployed function in isolated PostgreSQL; no live pushes.
const db = new PGlite();
await db.exec(`
  CREATE TABLE profiles (user_id uuid PRIMARY KEY, preferred_language text, deletion_requested_at timestamptz);
  CREATE TABLE community_questions (id uuid PRIMARY KEY, title text, user_id uuid);
  CREATE TABLE community_answers (id uuid PRIMARY KEY, question_id uuid, user_id uuid);
  CREATE TABLE community_question_followers (question_id uuid, user_id uuid);
  CREATE TABLE community_saved_questions (question_id uuid, user_id uuid);
  CREATE TABLE community_helped (question_id uuid, user_id uuid);
  CREATE TABLE community_votes (answer_id uuid, user_id uuid);
  CREATE TABLE notifications (user_id uuid, type text, title text, message text, data jsonb);
`);
await db.exec(readFileSync(new URL('../drizzle/migrations/0008_community_participant_reply_notifications.sql', import.meta.url), 'utf8'));
await db.exec(`CREATE TRIGGER replies AFTER INSERT ON community_answers FOR EACH ROW EXECUTE FUNCTION notify_followers_on_answer();`);
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
for (let n = 1; n <= 10; n++) {
  await db.query('INSERT INTO profiles VALUES ($1,$2,$3)', [id(n), n === 3 ? 'el' : 'en', n === 9 ? '2026-10-18' : null]);
}
await db.query('INSERT INTO community_questions VALUES ($1,$2,$3), ($4,$5,$6)', [id(101), 'Question one', id(1), id(102), 'Unrelated question', id(10)]);
// A question insertion alone must never broadcast.
assert.equal((await db.query('SELECT * FROM notifications')).rows.length, 0);
// Seed historical answers before subscriptions; discard their local notifications.
await db.query('INSERT INTO community_answers VALUES ($1,$2,$3), ($4,$5,$6)', [id(201), id(101), id(5), id(202), id(102), id(8)]);
await db.exec('DELETE FROM notifications');
for (const n of [1, 2, 3, 9]) await db.query('INSERT INTO community_saved_questions VALUES ($1,$2)', [id(101), id(n)]);
for (const n of [3, 4]) await db.query('INSERT INTO community_question_followers VALUES ($1,$2)', [id(101), id(n)]);
for (const n of [3, 7]) await db.query('INSERT INTO community_helped VALUES ($1,$2)', [id(101), id(n)]);
for (const n of [3, 6]) await db.query('INSERT INTO community_votes VALUES ($1,$2)', [id(201), id(n)]);
await db.query('INSERT INTO community_saved_questions VALUES ($1,$2)', [id(102), id(8)]);
await db.query('INSERT INTO community_answers VALUES ($1,$2,$3)', [id(203), id(101), id(2)]);
const { rows } = await db.query<{user_id: string; type: string; data: {question_id: string; answer_id: string}}>('SELECT user_id,type,data FROM notifications');
const recipients = rows.map(r => r.user_id);
assert.ok(recipients.includes(id(3)), 'Saved question receives reply alert');
assert.ok(recipients.includes(id(4)), 'Follower receives reply alert');
assert.ok(recipients.includes(id(5)), 'Previous answerer receives reply alert');
assert.ok(recipients.includes(id(6)), 'Answer voter receives reply alert');
assert.ok(recipients.includes(id(7)), 'Helpful marker receives reply alert');
assert.equal(recipients.filter(r => r === id(3)).length, 1, 'Overlapping interactions produce one alert');
assert.ok(!recipients.includes(id(2)), 'Reply author excluded');
assert.ok(!recipients.includes(id(1)), 'Question owner handled by existing separate trigger');
assert.ok(!recipients.includes(id(8)), 'Unrelated question activity does not subscribe users');
assert.ok(!recipients.includes(id(9)), 'Pending account deletion excluded');
assert.ok(!recipients.includes(id(10)), 'Non-participant excluded');
assert.equal(rows.length, 5);
for (const row of rows) {
  assert.equal(row.type, 'community_follow_activity');
  assert.equal(row.data.question_id, id(101));
  assert.equal(row.data.answer_id, id(203));
}
await db.query('UPDATE community_answers SET user_id=$1 WHERE id=$2', [id(2), id(203)]);
assert.equal((await db.query('SELECT * FROM notifications')).rows.length, 5, 'Editing an answer does not resend alerts');
await db.close();
console.log('Community reply recipient and trigger tests passed');