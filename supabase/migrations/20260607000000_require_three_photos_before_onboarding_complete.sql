-- ─────────────────────────────────────────────────────────────────────────────
-- Require at least 3 photos before a profile can be marked onboarding-complete.
--
-- Why: the 3-photo rule was only enforced in the browser (the disabled
-- "Continue" button on the onboarding Photos step). That gate is bypassable, so
-- users could still finish onboarding with no photos. This trigger enforces the
-- rule server-side as the real guarantee.
--
-- Scope (intentional): only blocks profiles *transitioning into*
-- onboarding_completed = true. Existing already-completed profiles are NOT
-- affected (no backfill), per product decision. Later photo removal/rejection is
-- NOT handled here.
--
-- The "3" and the photo definition (type='photo', status in pending/approved)
-- mirror the client: getMinPhotoCount() in src/lib/photoRules.ts and the media
-- query in src/pages/Onboarding.tsx. Keep them in sync if the rule changes.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.enforce_min_photos_on_onboarding()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_photo_count int;
begin
  -- Only enforce when onboarding is newly being marked complete.
  -- Guard OLD reads behind an explicit TG_OP = 'UPDATE' check (OLD is not
  -- available on INSERT).
  if NEW.onboarding_completed is true
     and (
       TG_OP = 'INSERT'
       or (TG_OP = 'UPDATE' and OLD.onboarding_completed is distinct from true)
     ) then

    -- Wali/guardian accounts have no dating profile; skip the photo requirement.
    if lower(coalesce(NEW.role, '')) = 'wali' then
      return NEW;
    end if;

    select count(*) into v_photo_count
    from public.media m
    where m.user_id = NEW.id
      and m.type = 'photo'
      and m.status in ('pending', 'approved');

    if v_photo_count < 3 then
      raise exception
        'PROFILE_PHOTOS_REQUIRED: at least 3 photos are required to complete onboarding (found %)',
        v_photo_count
        using errcode = 'check_violation';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_enforce_min_photos_on_onboarding on public.profiles;

create trigger trg_enforce_min_photos_on_onboarding
  before insert or update on public.profiles
  for each row
  execute function public.enforce_min_photos_on_onboarding();
