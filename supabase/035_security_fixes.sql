-- FormLog – 035: διορθώσεις από τον έλεγχο ασφαλείας της 23/11/2026
-- Τρέξε το ΜΙΑ φορά, μετά το 034: Supabase → SQL Editor → New query → επικόλληση → Run.
--
-- ΣΕΙΡΑ: πρώτα τρέχεις αυτό το αρχείο και ΜΕΤΑ ανεβάζεις (deploy) τον νέο κώδικα του site.
-- Ο νέος κώδικας χρησιμοποιεί ιδιωτικά ζωντανά κανάλια και τους νέους κανόνες διαγραφής που ορίζονται εδώ·
-- χωρίς αυτό το αρχείο, το «online» και οι κλήσεις δεν θα συνδέονταν και η διαγραφή λογαριασμού θα σταματούσε.
--
-- 1. Παλιοί φάκελοι που ενώθηκαν (merged_ids): ολόκληρος ο φάκελος μόνο για τον κάτοχο.
--    Πριν, ο ΝΕΟΣ προπονητής έβλεπε ολόκληρο τον παλιό φάκελο του αθλούμενου — μαζί με τα φωνητικά και τις
--    φωτογραφίες της συνομιλίας του με τον ΠΡΟΗΓΟΥΜΕΝΟ προπονητή. Τώρα βλέπει από εκεί μόνο φωτογραφίες καταγραφών.
-- 2. Φωτογραφίες καταγραφής: νέες διαδρομές μόνο στον φάκελο του αθλούμενου ή του ίδιου του χρήστη
--    (όχι «δείκτες» προς ξένα αρχεία, για να τα διαβάσει κάποιος μέσα από τη δική του καταγραφή).
-- 3. Φωνητικά: σβήνει μόνο ο αποστολέας, ο κάτοχος του φακέλου ή ο προπονητής της ομάδας.
--    (Πριν, οποιοδήποτε μέλος ομάδας μπορούσε να σβήσει τα φωνητικά όλων.)
--    Φωτογραφίες ομάδας: ο κανόνας του 013 έψαχνε τον φάκελο στο ΟΝΟΜΑ της ομάδας αντί για τη διαδρομή
--    του αρχείου, οπότε ο προπονητής δεν μπορούσε ποτέ να τις σβήσει (έμεναν μετά τη διαγραφή της ομάδας).
-- 4. Αρχεία προγράμματος: τα σβήνει και ο κάτοχος του φακέλου, ώστε να σβήνονται με τη διαγραφή λογαριασμού.
--    Ο κάτοχος βλέπει/σβήνει και όσα έμειναν στους παλιούς (ενωμένους) φακέλους του. Ανεβάζει μόνο ο προπονητής, όπως πριν.
-- 5. Ζωντανά κανάλια «online» και κλήσεων: ιδιωτικά.
--      presence:<id προπονητή>  → μόνο ο προπονητής και οι συνδεδεμένοι αθλούμενοί του
--      rtc:<id κλήσης>          → μόνο ο καλών και ο καλούμενος
--    (Πριν, οποιοσδήποτε — ακόμα και χωρίς λογαριασμό — έμπαινε αν ήξερε το id.)
--
-- Σημείωση: στους κανόνες του Storage ο φάκελος υπολογίζεται ΕΞΩ από κάθε υποερώτημα και περνά σε συνάρτηση.
-- (Μέσα σε υποερώτημα, το σκέτο «name» δείχνει στη στήλη name του πίνακα του υποερωτήματος, π.χ. groups.name,
-- και όχι στη διαδρομή του αρχείου — αυτό ήταν το λάθος του 013.)

begin;


-- ============================================================
-- 1. Παλιοί (ενωμένοι) φάκελοι
-- ============================================================
-- Είμαι ο κάτοχος ενός φακέλου που έχει ενώσει αυτόν τον παλιό φάκελο;
create or replace function public.owns_merged_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.athletes a
    where a.owner = (select auth.uid()) and folder = any (a.merged_ids::text[])
  );
$$;
revoke execute on function public.owns_merged_folder(text) from public, anon;
grant execute on function public.owns_merged_folder(text) to authenticated;

create or replace function public.can_access_photo_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    -- ο παλιός προσωπικός φάκελος του χρήστη
    folder = (select auth.uid())::text
    -- ο φάκελος ενός αθλούμενου στον οποίο έχω πρόσβαση (κάτοχος ή προπονητής)
    or exists (
      select 1 from public.athletes a
      where a.id::text = folder and (select auth.uid()) in (a.owner, a.coach_id)
    )
    -- ένας παλιός φάκελος που ενώθηκε: ολόκληρος μόνο για τον κάτοχο
    or public.owns_merged_folder(folder);
$$;

-- Ο προπονητής βλέπει από τους παλιούς φακέλους μόνο τις φωτογραφίες που ανήκουν σε καταγραφή του
-- αθλούμενου — όχι φωνητικά ή φωτογραφίες συνομιλίας με άλλον προπονητή.
create or replace function public.can_read_photo(obj_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.checkins c
    join public.athletes a on a.id = c.athlete_id
    where (select auth.uid()) in (a.owner, a.coach_id)
      and (
        -- στον παλιό φάκελο αυτού που ανέβασε την καταγραφή
        (c.owner is not null and split_part(obj_name, '/', 1) = c.owner::text)
        -- ή σε παλιό φάκελο που ενώθηκε σε αυτόν τον αθλούμενο
        or split_part(obj_name, '/', 1) = any (a.merged_ids::text[])
      )
      and exists (
        select 1 from jsonb_each_text(c.photos) p
        where p.value = replace(obj_name, '.thumb.jpg', '.jpg')
      )
  );
$$;


-- ============================================================
-- 2. Φωτογραφίες καταγραφής: μόνο από τον φάκελο του αθλούμενου ή του ίδιου του χρήστη
-- ============================================================
-- Όσες διαδρομές υπάρχουν ήδη στην καταγραφή μένουν όπως είναι (π.χ. παλιές φωτογραφίες μετά από ένωση φακέλων).
create or replace function public.guard_checkin_photos()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  before_photos jsonb;
begin
  if tg_op = 'UPDATE' then
    before_photos := old.photos;
  else
    -- Η αποθήκευση από το site είναι «upsert»: μια υπάρχουσα καταγραφή φτάνει πρώτα ως INSERT.
    -- (Με τα δικαιώματα του χρήστη: βρίσκει μόνο καταγραφή που ήδη έχει δικαίωμα να δει.)
    select c.photos into before_photos from public.checkins c where c.id = new.id;
  end if;
  if before_photos is null or jsonb_typeof(before_photos) <> 'object' then
    before_photos := '{}'::jsonb;
  end if;

  if jsonb_typeof(new.photos) <> 'object' then
    raise exception 'invalid_photo_path';
  end if;
  if exists (
    select 1 from jsonb_each_text(new.photos) p
    where p.value !~ ('^(' || new.athlete_id::text || '|' || coalesce(auth.uid()::text, '-') || ')/[0-9a-f-]{36}\.jpg$')
      and not exists (select 1 from jsonb_each_text(before_photos) o where o.value = p.value)
  ) then
    raise exception 'invalid_photo_path';
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_checkin_photos() from public, anon, authenticated;

drop trigger if exists checkins_guard_photos on public.checkins;
create trigger checkins_guard_photos before insert or update on public.checkins
  for each row execute function public.guard_checkin_photos();


-- ============================================================
-- 3. Φωνητικά και φωτογραφίες ομάδας: ποιος σβήνει
-- ============================================================
-- Είμαι ο προπονητής της ομάδας με αυτόν τον φάκελο;
create or replace function public.coaches_group_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.groups g
    where g.id::text = folder and g.coach_id = (select auth.uid())
  );
$$;
revoke execute on function public.coaches_group_folder(text) from public, anon;
grant execute on function public.coaches_group_folder(text) to authenticated;

-- Είμαι υπεύθυνος για αυτόν τον φάκελο; Κάτοχος του φακέλου αθλούμενου (ή παλιού ενωμένου φακέλου μου)
-- ή προπονητής της ομάδας. (Για τη διαγραφή φακέλου, ομάδας και λογαριασμού.)
create or replace function public.manages_folder(folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
      select 1 from public.athletes a
      where a.id::text = folder and a.owner = (select auth.uid())
    )
    or public.owns_merged_folder(folder)
    or public.coaches_group_folder(folder);
$$;
revoke execute on function public.manages_folder(text) from public, anon;
grant execute on function public.manages_folder(text) to authenticated;

drop policy if exists "voice: σβήνουν όσοι έχουν πρόσβαση" on storage.objects;
drop policy if exists "voice: σβήνει ο αποστολέας ή ο υπεύθυνος" on storage.objects;
create policy "voice: σβήνει ο αποστολέας ή ο υπεύθυνος" on storage.objects for delete to authenticated
  using (
    bucket_id = 'voice'
    and (
      owner_id = (select auth.uid())::text                      -- ό,τι ανέβασα εγώ
      or public.manages_folder((storage.foldername(name))[1])   -- ο κάτοχος του φακέλου / ο προπονητής της ομάδας
    )
  );

drop policy if exists "photos: ο προπονητής σβήνει της ομάδας" on storage.objects;
create policy "photos: ο προπονητής σβήνει της ομάδας" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.coaches_group_folder((storage.foldername(name))[1]));


-- ============================================================
-- 4. Αρχεία προγράμματος: βλέπουν/σβήνουν προπονητής και κάτοχος
-- ============================================================
drop policy if exists "plans: βλέπουν αθλούμενος και προπονητής" on storage.objects;
create policy "plans: βλέπουν αθλούμενος και προπονητής" on storage.objects for select to authenticated
  using (
    bucket_id = 'plans'
    and (
      public.plan_folder_access((storage.foldername(name))[1], false)
      or public.owns_merged_folder((storage.foldername(name))[1])
    )
  );

drop policy if exists "plans: σβήνει ο προπονητής" on storage.objects;
drop policy if exists "plans: σβήνουν προπονητής και κάτοχος" on storage.objects;
create policy "plans: σβήνουν προπονητής και κάτοχος" on storage.objects for delete to authenticated
  using (
    bucket_id = 'plans'
    and (
      public.plan_folder_access((storage.foldername(name))[1], false)
      or public.owns_merged_folder((storage.foldername(name))[1])
    )
  );


-- ============================================================
-- 5. Ιδιωτικά ζωντανά κανάλια: «online» και κλήσεις
-- ============================================================
create or replace function public.can_use_channel(topic text, ext text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    -- presence:<id προπονητή> → ο ίδιος ο προπονητής ή συνδεδεμένος αθλούμενός του
    when ext = 'presence' and split_part(topic, ':', 1) = 'presence' then (
      split_part(topic, ':', 2) = (select auth.uid())::text
      or exists (
        select 1 from public.athletes a
        where a.coach_id::text = split_part(topic, ':', 2)
          and a.owner = (select auth.uid())
          and a.coach_id <> a.owner
      )
    )
    -- rtc:<id κλήσης> → μόνο οι δύο της κλήσης
    when ext = 'broadcast' and split_part(topic, ':', 1) = 'rtc' then exists (
      select 1 from public.calls c
      where c.id::text = split_part(topic, ':', 2)
        and (select auth.uid()) in (c.caller, c.callee)
    )
    else false
  end;
$$;
revoke execute on function public.can_use_channel(text, text) from public, anon;
grant execute on function public.can_use_channel(text, text) to authenticated;

drop policy if exists "realtime: λήψη σε ιδιωτικά κανάλια" on realtime.messages;
create policy "realtime: λήψη σε ιδιωτικά κανάλια" on realtime.messages for select to authenticated
  using (public.can_use_channel((select realtime.topic()), realtime.messages.extension));

drop policy if exists "realtime: αποστολή σε ιδιωτικά κανάλια" on realtime.messages;
create policy "realtime: αποστολή σε ιδιωτικά κανάλια" on realtime.messages for insert to authenticated
  with check (public.can_use_channel((select realtime.topic()), realtime.messages.extension));

commit;
