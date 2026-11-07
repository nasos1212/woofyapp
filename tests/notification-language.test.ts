import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
await db.exec(`
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE TABLE profiles(user_id uuid PRIMARY KEY, preferred_language text, preferred_city text, deletion_requested_at timestamptz);
CREATE TABLE user_roles(user_id uuid, role text);
CREATE TABLE notifications(id uuid DEFAULT gen_random_uuid(), user_id uuid, type text, title text, message text, data jsonb);
CREATE TABLE blog_posts(id uuid, slug text, title_en text, title_el text, status text);
CREATE TABLE businesses(id uuid, user_id uuid, business_name text, city text, verification_status text, is_hidden boolean);
CREATE TABLE business_locations(business_id uuid, city text);
CREATE TABLE shelters(id uuid, user_id uuid, shelter_name text, verification_status text, is_hidden boolean);
CREATE TABLE community_questions(id uuid, title text, user_id uuid);
CREATE TABLE community_answers(id uuid, question_id uuid, user_id uuid);
CREATE TABLE community_question_followers(question_id uuid,user_id uuid);
CREATE TABLE community_saved_questions(question_id uuid,user_id uuid);
CREATE TABLE community_helped(question_id uuid,user_id uuid);
CREATE TABLE community_votes(answer_id uuid,user_id uuid);
CREATE TABLE pet_health_records(id uuid,owner_user_id uuid,pet_id uuid,title text,record_type text,reminder_interval_type text,next_due_date date,preferred_time time,reminder_days_before integer[]);
CREATE TABLE pets(id uuid,owner_user_id uuid,pet_name text);
CREATE TABLE health_reminder_deliveries(record_id uuid,owner_user_id uuid,event_date date,days_until integer,UNIQUE(record_id,event_date,days_until));
`);
await db.exec(readFileSync(new URL('../supabase/health-reminder-schedule.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../drizzle/migrations/0016_english_only_notifications.sql', import.meta.url), 'utf8'));
await db.exec(`
CREATE TRIGGER blog AFTER INSERT ON blog_posts FOR EACH ROW EXECUTE FUNCTION notify_members_new_blog_post();
CREATE TRIGGER partner AFTER INSERT ON businesses FOR EACH ROW EXECUTE FUNCTION notify_members_new_partner();
CREATE TRIGGER shelter AFTER INSERT ON shelters FOR EACH ROW EXECUTE FUNCTION notify_members_new_shelter();
CREATE TRIGGER reply AFTER INSERT ON community_answers FOR EACH ROW EXECUTE FUNCTION notify_followers_on_answer();
`);
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
await db.query(`INSERT INTO profiles VALUES ($1,'en','Limassol',NULL),($2,'el','Limassol',NULL)`, [id(1),id(2)]);
await db.query(`INSERT INTO user_roles VALUES ($1,'member'),($2,'member')`, [id(1),id(2)]);
await db.query(`INSERT INTO blog_posts VALUES ($1,'article','English article','Ελληνικό άρθρο','published')`,[id(10)]);
await db.query(`INSERT INTO businesses VALUES ($1,$2,'Studio','Limassol','approved',false)`,[id(11),id(99)]);
await db.query(`INSERT INTO shelters VALUES ($1,$2,'Shelter','approved',false)`,[id(12),id(99)]);
await db.query(`INSERT INTO community_questions VALUES ($1,'Question',$2)`,[id(13),id(99)]);
await db.query(`INSERT INTO community_saved_questions VALUES ($1,$2),($1,$3)`,[id(13),id(1),id(2)]);
await db.query(`INSERT INTO community_answers VALUES ($1,$2,$3)`,[id(14),id(13),id(99)]);
for (const type of ['new_blog_post','new_partner','new_shelter','community_follow_activity']) {
  const { rows } = await db.query<{user_id:string; title:string; message:string}>('SELECT user_id,title,message FROM notifications WHERE type=$1 ORDER BY user_id',[type]);
  assert.equal(rows.length,2,`${type}: language does not change recipients`);
  assert.deepEqual({title:rows[1].title,message:rows[1].message},{title:rows[0].title,message:rows[0].message},`${type}: Greek preference must not change notification language`);
}
for (const n of [1,2]) {
  await db.query(`INSERT INTO pets VALUES ($1,$2,'Kobe')`,[id(20+n),id(n)]);
  await db.query(`INSERT INTO pet_health_records VALUES ($1,$2,$3,'Checkup','vet_visit',NULL,(now() AT TIME ZONE 'Europe/Athens')::date-1,NULL,NULL)`,[id(30+n),id(n),id(20+n)]);
}
await db.query('SELECT dispatch_health_reminders()');
const reminders = (await db.query<{title:string;message:string}>(`SELECT title,message FROM notifications WHERE type='reminder' ORDER BY user_id`)).rows;
assert.equal(reminders.length,2,'Both language preferences receive final day-after reminder');
assert.deepEqual(reminders[1],reminders[0],'Greek preference must not change reminder language');
await db.query('SELECT dispatch_health_reminders()');
assert.equal((await db.query(`SELECT * FROM notifications WHERE type='reminder'`)).rows.length,2,'Language change preserves duplicate protection');
await db.close();
console.log('Notification language preference invariance tests passed');