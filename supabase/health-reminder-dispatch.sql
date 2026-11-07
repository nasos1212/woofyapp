CREATE OR REPLACE FUNCTION public.dispatch_health_reminders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE delivered_count integer;
BEGIN
 WITH eligible AS (
 SELECT r.id AS record_id,r.owner_user_id,r.pet_id,r.title,p.pet_name,o.event_date,o.days_until
 FROM public.pet_health_records r JOIN public.pets p ON p.id=r.pet_id AND p.owner_user_id=r.owner_user_id
 JOIN public.profiles pr ON pr.user_id=r.owner_user_id AND pr.deletion_requested_at IS NULL
 CROSS JOIN LATERAL public.health_reminder_occurrence(r.record_type,r.reminder_interval_type,r.next_due_date,r.preferred_time,r.reminder_days_before,now()) o
 WHERE EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id=r.owner_user_id AND ur.role='member')),
 claimed AS (
 INSERT INTO public.health_reminder_deliveries(record_id,owner_user_id,event_date,days_until)
 SELECT record_id,owner_user_id,event_date,days_until FROM eligible ON CONFLICT(record_id,event_date,days_until) DO NOTHING RETURNING record_id,event_date,days_until),
 sent AS (
 INSERT INTO public.notifications(user_id,type,title,message,data)
 SELECT e.owner_user_id,'reminder','Reminder for ' || e.pet_name,
 e.title || CASE WHEN e.days_until=-1 THEN ' was due yesterday.' WHEN e.days_until=0 THEN ' is due today.' ELSE ' is due in ' || e.days_until || ' days.' END,
 jsonb_build_object('pet_id',e.pet_id,'health_record_id',e.record_id,'due_date',e.event_date,'days_until',e.days_until,'action_url','https://wooffy.app/member/health-records?pet=' || e.pet_id)
 FROM eligible e JOIN claimed c USING(record_id,event_date,days_until) RETURNING id)
 SELECT count(*) INTO delivered_count FROM sent;
 RETURN delivered_count;
END;
$$;
REVOKE ALL ON FUNCTION public.dispatch_health_reminders() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_health_reminders() TO service_role;