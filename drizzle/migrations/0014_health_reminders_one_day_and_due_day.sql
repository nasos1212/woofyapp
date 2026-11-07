CREATE OR REPLACE FUNCTION public.health_reminder_occurrence(record_type text,interval_type text,due_date date,preferred_time time,days_before integer[],current_time_utc timestamptz)
RETURNS TABLE(event_date date,days_until integer) LANGUAGE sql STABLE SET search_path=public AS $$
 WITH clock AS (SELECT current_time_utc AT TIME ZONE 'Europe/Athens' AS local_now), occurrence AS (
 SELECT CASE WHEN record_type='medication' AND interval_type='daily' THEN local_now::date ELSE due_date END AS event_date,
 CASE WHEN record_type='medication' AND interval_type='daily' THEN 0 ELSE due_date-local_now::date END AS days_until,local_now FROM clock WHERE due_date IS NOT NULL)
 SELECT event_date,days_until FROM occurrence WHERE local_now::time>=COALESCE(preferred_time,time '09:00')
 AND CASE WHEN record_type='medication' AND interval_type='daily' THEN due_date<=local_now::date
 ELSE days_until IN (1,0) END;
$$;
REVOKE ALL ON FUNCTION public.health_reminder_occurrence(text,text,date,time,integer[],timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.health_reminder_occurrence(text,text,date,time,integer[],timestamptz) TO service_role;