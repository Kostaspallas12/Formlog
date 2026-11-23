-- FormLog – 034: όρια χρήσης ανά λογαριασμό (προστασία από κατάχρηση)
-- Τρέξε το ΜΙΑ φορά, μετά το 033: Supabase → SQL Editor → New query → επικόλληση → Run.
--
-- Οι κανόνες πρόσβασης ήδη εμποδίζουν κάποιον να δει ή να πειράξει ξένα δεδομένα.
-- Εδώ κλείνει κάτι άλλο: ένας κακόβουλος λογαριασμός θα μπορούσε να γεμίσει σκόπιμα τη βάση
-- ή τον χώρο αρχείων (π.χ. χιλιάδες τεράστιες καταγραφές ή αρχεία) και να ρίξει το site για όλους.
-- Τα όρια είναι πολύ πάνω από ό,τι κάνει ένας πραγματικός χρήστης.

begin;

-- ============================================================
-- 1. Βάση: έως 5.000 νέες γραμμές και 20 MB την ημέρα ανά λογαριασμό
-- ============================================================
create table public.usage_daily (
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null default current_date,
  n_rows   integer not null default 0,
  n_bytes  bigint not null default 0,
  primary key (user_id, day)
);
alter table public.usage_daily enable row level security;
-- Κανείς δεν το βλέπει ή το αλλάζει από το site· το γράφει μόνο η παρακάτω συνάρτηση.
revoke all on public.usage_daily from anon, authenticated;

create or replace function public.count_usage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  added bigint := pg_column_size(new);
  u public.usage_daily;
begin
  -- Μόνο ό,τι γράφει ο ίδιος ο χρήστης (όχι εργασίες της βάσης χωρίς συνδεδεμένο χρήστη).
  if me is null then return new; end if;
  -- Αλλαγή: μετράει μόνο αν μεγάλωσε η γραμμή.
  if tg_op = 'UPDATE' then added := greatest(0, added - pg_column_size(old)); end if;
  if tg_op = 'UPDATE' and added = 0 then return new; end if;

  insert into public.usage_daily as d (user_id, day, n_rows, n_bytes)
    values (me, current_date, case when tg_op = 'INSERT' then 1 else 0 end, added)
    on conflict (user_id, day) do update
      set n_rows = d.n_rows + excluded.n_rows, n_bytes = d.n_bytes + excluded.n_bytes
    returning * into u;
  if u.n_rows > 5000 or u.n_bytes > 20::bigint * 1024 * 1024 then
    raise exception 'Έφτασες το ημερήσιο όριο χρήσης. Δοκίμασε ξανά αύριο.';
  end if;

  -- Τα παλιά μετρήματα δεν χρειάζονται (σπάνια καθαριότητα).
  if random() < 0.01 then delete from public.usage_daily where day < current_date - 7; end if;
  return new;
end;
$$;
revoke execute on function public.count_usage() from public, anon, authenticated;

-- «zz_» ώστε να τρέχει τελευταίο, αφού οι άλλοι triggers έχουν καθαρίσει τη γραμμή.
do $$
declare t text;
begin
  foreach t in array array['athletes', 'checkins', 'weigh_ins', 'daily_logs', 'workout_logs', 'messages',
                           'group_messages', 'groups', 'message_stars', 'athlete_plans'] loop
    execute format('drop trigger if exists zz_usage on public.%I', t);
    execute format('create trigger zz_usage before insert or update on public.%I
                    for each row execute function public.count_usage()', t);
  end loop;
end;
$$;


-- ============================================================
-- 2. Αρχεία: έως 200 αρχεία / 150 MB την ημέρα και 300 MB συνολικά ανά λογαριασμό
--    (το δωρεάν πλάνο έχει 1 GB για ΟΛΟΥΣ: ένας λογαριασμός δεν πρέπει να μπορεί να το γεμίσει μόνος του)
-- ============================================================
create or replace function public.upload_quota_ok()
returns boolean
language sql
stable
set search_path = ''
as $$
  -- Με τα δικαιώματα του χρήστη (όχι security definer): μετράει τα αρχεία του που ανέβασε ο ίδιος.
  select
    (select count(*) < 200 and coalesce(sum((o.metadata ->> 'size')::bigint), 0) < 150::bigint * 1024 * 1024
       from storage.objects o
       where o.owner_id = (select auth.uid())::text and o.created_at > now() - interval '1 day')
    and
    (select coalesce(sum((o.metadata ->> 'size')::bigint), 0) < 300::bigint * 1024 * 1024
       from storage.objects o
       where o.owner_id = (select auth.uid())::text);
$$;
revoke execute on function public.upload_quota_ok() from public, anon;
grant execute on function public.upload_quota_ok() to authenticated;

-- Οι ίδιοι κανόνες ανεβάσματος με πριν, συν το όριο.
drop policy "photos: ανεβάζουν όσοι έχουν πρόσβαση" on storage.objects;
create policy "photos: ανεβάζουν όσοι έχουν πρόσβαση"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.can_access_photo_folder((storage.foldername(name))[1]) and public.upload_quota_ok());

drop policy "photos: ομάδα ανεβάζει" on storage.objects;
create policy "photos: ομάδα ανεβάζει"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.in_group_folder((storage.foldername(name))[1]) and public.upload_quota_ok());

drop policy "plans: ανεβάζει ο προπονητής" on storage.objects;
create policy "plans: ανεβάζει ο προπονητής"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'plans' and public.plan_folder_access((storage.foldername(name))[1], true) and public.upload_quota_ok());

drop policy "voice: ανεβάζουν όσοι έχουν πρόσβαση" on storage.objects;
create policy "voice: ανεβάζουν όσοι έχουν πρόσβαση"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'voice'
    and (public.can_access_photo_folder((storage.foldername(name))[1]) or public.in_group_folder((storage.foldername(name))[1]))
    and public.upload_quota_ok());

-- Οι φωτογραφίες συμπιέζονται στον browser (έως 1600px, συνήθως < 1 MB): αρκούν 3 MB.
update storage.buckets set file_size_limit = 3 * 1024 * 1024 where id = 'photos';


-- ============================================================
-- 3. Μέγεθος πεδίων που δεν είχαν όριο
-- ============================================================
-- (not valid: ισχύει για κάθε νέα αλλαγή, χωρίς να ελέγχει ξανά τα παλιά δεδομένα)
alter table public.checkins add constraint checkins_photos_size
  check (jsonb_typeof(photos) = 'object' and pg_column_size(photos) < 4000) not valid;
alter table public.profiles add constraint profiles_avatar_path
  check (avatar is null or avatar ~ '^[0-9a-f-]{36}/avatar-[0-9a-f-]{36}\.jpg$') not valid;
alter table public.athletes add constraint athletes_avatar_path
  check (avatar is null or avatar ~ '^[0-9a-f-]{36}/avatar-[0-9a-f-]{36}\.jpg$') not valid;
-- Η συγκατάθεση έρχεται από την εγγραφή: μόνο λίγα πεδία, όχι οτιδήποτε στείλει κάποιος.
alter table public.profiles add constraint profiles_consent_size
  check (pg_column_size(consent) < 2000) not valid;

commit;
