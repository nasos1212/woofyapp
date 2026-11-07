CREATE OR REPLACE FUNCTION public.health_reminder_occurrence(record_type text,interval_type text,due_date date,preferred_time time,days_before integer[],current_time_utc timestamptz)
RETURNS TABLE(event_date date,days_until integer) LANGUAGE sql STABLE SET search_path=public AS $$
 WITH clock AS (SELECT current_time_utc AT TIME ZONE 'Europe/Athens' AS local_now), occurrence AS (
 SELECT CASE WHEN record_type='medication' AND interval_type='daily' THEN local_now::date ELSE due_date END AS event_date,
 CASE WHEN record_type='medication' AND interval_type='daily' THEN 0 ELSE due_date-local_now::date END AS days_until,local_now FROM clock WHERE due_date IS NOT NULL)
 SELECT event_date,days_until FROM occurrence WHERE local_now::time>=COALESCE(preferred_time,time '09:00')
 AND CASE WHEN record_type='medication' AND interval_type='daily' THEN due_date<=local_now::date ELSE days_until IN (1,0,-1) END;
$$;
REVOKE ALL ON FUNCTION public.health_reminder_occurrence(text,text,date,time,integer[],timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.health_reminder_occurrence(text,text,date,time,integer[],timestamptz) TO service_role;
CREATE OR REPLACE FUNCTION public.dispatch_health_reminders() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE delivered_count integer;
BEGIN
 WITH eligible AS (
 SELECT r.id AS record_id,r.owner_user_id,r.pet_id,r.title,p.pet_name,o.event_date,o.days_until,COALESCE(pr.preferred_language,'en') AS language
 FROM public.pet_health_records r JOIN public.pets p ON p.id=r.pet_id AND p.owner_user_id=r.owner_user_id
 JOIN public.profiles pr ON pr.user_id=r.owner_user_id AND pr.deletion_requested_at IS NULL
 CROSS JOIN LATERAL public.health_reminder_occurrence(r.record_type,r.reminder_interval_type,r.next_due_date,r.preferred_time,r.reminder_days_before,now()) o
 WHERE EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id=r.owner_user_id AND ur.role='member')),
 claimed AS (
 INSERT INTO public.health_reminder_deliveries(record_id,owner_user_id,event_date,days_until)
 SELECT record_id,owner_user_id,event_date,days_until FROM eligible ON CONFLICT(record_id,event_date,days_until) DO NOTHING RETURNING record_id,event_date,days_until),
 sent AS (
 INSERT INTO public.notifications(user_id,type,title,message,data)
 SELECT e.owner_user_id,'reminder',CASE WHEN e.language LIKE 'el%' THEN 'Υπενθύμιση για ' ELSE 'Reminder for ' END || e.pet_name,
 e.title || CASE WHEN e.language LIKE 'el%' THEN CASE WHEN e.days_until=-1 THEN ' — είχε προγραμματιστεί για χθες.' WHEN e.days_until=0 THEN ' είναι για σήμερα.' ELSE ' σε ' || e.days_until || ' ημέρες.' END ELSE CASE WHEN e.days_until=-1 THEN ' was due yesterday.' WHEN e.days_until=0 THEN ' is due today.' ELSE ' is due in ' || e.days_until || ' days.' END END,
 jsonb_build_object('pet_id',e.pet_id,'health_record_id',e.record_id,'due_date',e.event_date,'days_until',e.days_until,'action_url','https://wooffy.app/member/health-records?pet=' || e.pet_id)
 FROM eligible e JOIN claimed c USING(record_id,event_date,days_until) RETURNING id)
 SELECT count(*) INTO delivered_count FROM sent;
 RETURN delivered_count;
END;
$$;
REVOKE ALL ON FUNCTION public.dispatch_health_reminders() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_health_reminders() TO service_role;