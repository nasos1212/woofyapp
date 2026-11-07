import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');
await db.exec(readFileSync(new URL('../supabase/health-reminder-schedule.sql', import.meta.url), 'utf8'));
async function occurrence(type: string, interval: string | null, due: string | null, time: string | null, days: number[] | null, now = '2026-11-07T07:00:00Z') {
  return (await db.query('SELECT * FROM public.health_reminder_occurrence($1,$2,$3,$4,$5,$6)', [type, interval, due, time, days, now])).rows;
}
assert.equal((await occurrence('vaccination','yearly','2026-12-07',null,null)).length,0,'No 30-day vaccination notification');
assert.equal((await occurrence('vaccination','yearly','2026-11-08',null,null)).length,1,'One-day vaccination reminder');
assert.equal((await occurrence('vaccination','yearly','2026-11-07',null,null)).length,1,'Due-day vaccination reminder');
assert.deepEqual(await occurrence('vaccination','yearly','2026-11-06',null,null),[{event_date:new Date('2026-11-06T00:00:00Z'),days_until:-1}],'Final reminder one day after the event');
assert.equal((await occurrence('vaccination','yearly','2026-11-05',null,null)).length,0,'Stop two days after the event');
assert.equal((await occurrence('vet_visit',null,'2026-11-06',null,[3])).length,1,'One-off visits get the final day-after reminder');
assert.equal((await occurrence('medication','monthly','2026-11-06',null,null)).length,1,'Non-daily medication gets the final day-after reminder');
assert.equal((await occurrence('vaccination','yearly','2026-11-06','09:30',null,'2026-11-07T07:29:00Z')).length,0,'Day-after reminder waits until saved time');
assert.equal((await occurrence('vaccination','yearly','2026-11-06',null,null,'2026-11-07T22:30:00Z')).length,0,'Day-after window ends at Athens midnight');
assert.equal((await occurrence('vaccination','once',null,null,null)).length,0,'Once-only records without due dates do not recur');
assert.equal((await occurrence('vet_visit',null,'2026-11-10',null,[3,1,0])).length,0,'No 3-day visit notification');
assert.equal((await occurrence('vet_visit',null,'2026-11-08',null,[3])).length,1,'All health records use one-day notification');
assert.equal((await occurrence('vet_visit',null,'2026-11-07',null,[3])).length,1,'All health records use due-day notification');
assert.equal((await occurrence('vet_visit',null,'2026-11-09',null,[3,1,0])).length,0,'Unselected 2-day reminder excluded');
assert.equal((await occurrence('medication','daily','2026-11-01','09:30',null,'2026-11-07T07:29:00Z')).length,0,'Wait until saved medication time');
assert.equal((await occurrence('medication','daily','2026-11-01','09:30',null,'2026-11-07T07:30:00Z')).length,1,'Daily medication at saved Athens time');
assert.equal((await occurrence('medication','daily','2026-11-08','09:30',null,'2026-11-07T10:00:00Z')).length,0,'Future medication not started');
assert.equal((await occurrence('medication','daily','2026-11-01',null,null,'2026-07-07T05:59:00Z')).length,0,'Athens summer clock and future date respected');
assert.equal((await occurrence('vaccination','yearly','2026-07-07',null,null,'2026-07-07T06:00:00Z')).length,1,'9am Athens uses summer offset');
assert.equal((await db.query<{allowed:boolean}>("SELECT has_function_privilege('authenticated','public.health_reminder_occurrence(text,text,date,time,integer[],timestamptz)','EXECUTE') AS allowed")).rows[0].allowed,false,'Users cannot run privileged scheduling');
await db.close();
console.log('Health reminder schedule tests passed');