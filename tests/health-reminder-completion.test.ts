import { strict as assert } from 'node:assert';
import { healthReminderCompletion } from '../src/lib/healthReminderCompletion';
const now = new Date('2026-11-07T22:30:00Z');
assert.deepEqual(healthReminderCompletion({record_type:'vet_visit',reminder_interval_type:null,reminder_interval_days:null},now),{date_administered:'2026-11-08',next_due_date:null},'Done cancels one-off visits in Athens time');
assert.equal(healthReminderCompletion({record_type:'vaccination',reminder_interval_type:'monthly',reminder_interval_days:30},now).next_due_date,'2026-12-08','Done moves recurring vaccination to next occurrence');
assert.equal(healthReminderCompletion({record_type:'medication',reminder_interval_type:'daily',reminder_interval_days:1},now).next_due_date,'2026-11-09','Done suppresses today’s medication reminder');
console.log('Health reminder completion tests passed');