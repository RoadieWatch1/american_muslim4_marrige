-- Block & unmatch + conversation-list perf + discover_profiles updates.
--
-- Adds a `blocked_users` table, a `block_user(uuid)` RPC that atomically
-- creates the block and tears down the existing match, a denormalized
-- `matches.last_message_at` column (with trigger) so the conversation
-- list can be ordered without N+1 queries, and updates the
-- `discover_profiles` function to exclude blocked users in either
-- direction and to honor `communication_boundaries.pause_matching`.

-- ─────────────────────────────────────────────
-- 1) blocked_users table
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocked_users_no_self_block CHECK (blocker_id <> blocked_id),
  CONSTRAINT blocked_users_unique_pair UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS blocked_users_blocker_idx ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS blocked_users_blocked_idx ON public.blocked_users(blocked_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- A user can read their own blocks (so the client can refresh state)
DROP POLICY IF EXISTS "blocked_users_select_own" ON public.blocked_users;
CREATE POLICY "blocked_users_select_own"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

-- A user can create their own blocks (the RPC also runs as the user)
DROP POLICY IF EXISTS "blocked_users_insert_own" ON public.blocked_users;
CREATE POLICY "blocked_users_insert_own"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- A user can unblock their own blocks
DROP POLICY IF EXISTS "blocked_users_delete_own" ON public.blocked_users;
CREATE POLICY "blocked_users_delete_own"
  ON public.blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- ─────────────────────────────────────────────
-- 2) block_user RPC: insert block + tear down existing match
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.block_user(p_blocked_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_u1 uuid;
  v_u2 uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_caller = p_blocked_id THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;

  -- Insert the block (idempotent thanks to the unique constraint)
  INSERT INTO public.blocked_users (blocker_id, blocked_id, reason)
  VALUES (v_caller, p_blocked_id, p_reason)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

  -- Tear down any existing match between the two users
  v_u1 := LEAST(v_caller, p_blocked_id);
  v_u2 := GREATEST(v_caller, p_blocked_id);

  DELETE FROM public.matches
  WHERE user1_id = v_u1 AND user2_id = v_u2;

  -- Cancel any open intro_requests in either direction
  UPDATE public.intro_requests
  SET status = 'rejected',
      updated_at = now()
  WHERE status = 'pending'
    AND (
      (from_user_id = v_caller AND to_user_id = p_blocked_id)
      OR
      (from_user_id = p_blocked_id AND to_user_id = v_caller)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.block_user(uuid, text) TO authenticated;

-- ─────────────────────────────────────────────
-- 3) matches.last_message_at + maintain via trigger
-- ─────────────────────────────────────────────

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

-- Backfill from existing messages
UPDATE public.matches m
SET last_message_at = sub.max_created_at
FROM (
  SELECT conversation_id, MAX(created_at) AS max_created_at
  FROM public.messages
  GROUP BY conversation_id
) sub
WHERE sub.conversation_id = m.id
  AND (m.last_message_at IS NULL OR sub.max_created_at > m.last_message_at);

CREATE INDEX IF NOT EXISTS matches_last_message_at_idx
  ON public.matches(last_message_at DESC NULLS LAST);

CREATE OR REPLACE FUNCTION public.touch_match_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.matches
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id
    AND (last_message_at IS NULL OR last_message_at < NEW.created_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_touch_match_last_message_at ON public.messages;
CREATE TRIGGER messages_touch_match_last_message_at
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_match_last_message_at();

-- ─────────────────────────────────────────────
-- 4) discover_profiles: exclude blocked + honor pause_matching
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.discover_profiles(
  p_user_id uuid,
  p_min_age integer,
  p_max_age integer,
  p_country text,
  p_denomination text,
  p_practice_level text,
  p_verified_only boolean DEFAULT NULL,
  p_has_photo boolean DEFAULT NULL,
  p_recently_active boolean DEFAULT NULL,
  p_madhab text DEFAULT NULL,
  p_prayer_frequency text DEFAULT NULL,
  p_mosque_attendance text DEFAULT NULL,
  p_halal_strict text DEFAULT NULL,
  p_max_distance_miles integer DEFAULT NULL,
  p_sort_nearest boolean DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  gender text,
  dob date,
  city text,
  state text,
  country text,
  denomination text,
  practice_level text,
  prayer_regular text,
  marital_status text,
  has_children boolean,
  education text,
  occupation text,
  ethnicity text,
  bio text,
  nikah_timeline text,
  wali_required boolean,
  verified_badge boolean,
  subscription_tier text,
  profile_boosted_until timestamptz,
  lifestyle_choices jsonb,
  languages_spoken text[],
  age integer,
  profile_photo_url text,
  intro_video_url text,
  last_seen_at timestamptz,
  madhab text,
  prayer_frequency text,
  mosque_attendance text,
  halal_strict text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  with current_profile as (
    select gender, latitude as my_lat, longitude as my_lng
    from profiles
    where id = p_user_id
  ),
  base as (
    select
      p.id, p.email, p.first_name, p.last_name, p.gender, p.dob,
      p.city, p.state, p.country, p.denomination, p.practice_level,
      p.prayer_regular, p.marital_status, p.has_children, p.education,
      p.occupation, p.ethnicity, p.bio, p.nikah_timeline, p.wali_required,
      p.verified_badge, p.subscription_tier, p.profile_boosted_until,
      p.lifestyle_choices, p.languages_spoken,
      floor(extract(year from age(current_date, p.dob)))::int as age,
      mp.url as profile_photo_url,
      mv.url as intro_video_url,
      p.last_seen_at, p.madhab, p.prayer_frequency, p.mosque_attendance,
      p.halal_strict, p.created_at as created_at,
      case
        when cp.my_lat is null or cp.my_lng is null
          or p.latitude is null or p.longitude is null
          then null
        else
          (3958.8 * 2 * asin(
            sqrt(
              pow(sin(radians((p.latitude - cp.my_lat) / 2)), 2) +
              cos(radians(cp.my_lat)) * cos(radians(p.latitude)) *
              pow(sin(radians((p.longitude - cp.my_lng) / 2)), 2)
            )
          ))
      end as distance_miles
    from profiles p
    cross join current_profile cp
    left join media mp on mp.id = p.profile_photo_id
    left join media mv on mv.id = p.intro_video_id
    where
      p.id <> p_user_id
      and coalesce(p.onboarding_completed, false) = true
      and coalesce(p.is_active, true) = true
      and p.account_status = 'active'
      and p.status = 'active'
      and p.gender is not null
      and p.dob is not null
      and p.gender <> cp.gender
      and floor(extract(year from age(current_date, p.dob)))::int between p_min_age and p_max_age
      and (p_country is null or p.country = p_country)
      and (p_denomination is null or p.denomination = p_denomination)
      and (p_practice_level is null or p.practice_level = p_practice_level)
      and (p_verified_only is not true or p.verified_badge = true)
      and (p_has_photo is not true or p.profile_photo_id is not null)
      and (
        p_recently_active is not true
        or (p.last_seen_at is not null and p.last_seen_at >= now() - interval '7 days')
      )
      and (p_madhab is null or p.madhab = p_madhab)
      and (p_prayer_frequency is null or p.prayer_frequency = p_prayer_frequency)
      and (p_mosque_attendance is null or p.mosque_attendance = p_mosque_attendance)
      and (p_halal_strict is null or p.halal_strict = p_halal_strict)

      -- Exclude users that the wali has paused for matching
      and not exists (
        select 1 from communication_boundaries cb
        where cb.ward_id = p.id and cb.pause_matching = true
      )

      -- Exclude users blocked by the viewer (in either direction)
      and not exists (
        select 1 from blocked_users b
        where (b.blocker_id = p_user_id and b.blocked_id = p.id)
           or (b.blocker_id = p.id     and b.blocked_id = p_user_id)
      )

      and not exists (
        select 1 from likes l
        where l.from_user_id = p_user_id and l.to_user_id = p.id
      )
      and not exists (
        select 1 from matches m
        where (m.user1_id = p_user_id and m.user2_id = p.id)
           or (m.user2_id = p_user_id and m.user1_id = p.id)
      )
  )
  select
    id, email, first_name, last_name, gender, dob, city, state, country,
    denomination, practice_level, prayer_regular, marital_status, has_children,
    education, occupation, ethnicity, bio, nikah_timeline, wali_required,
    verified_badge, subscription_tier, profile_boosted_until, lifestyle_choices,
    languages_spoken, age, profile_photo_url, intro_video_url, last_seen_at,
    madhab, prayer_frequency, mosque_attendance, halal_strict
  from base
  where (
    p_max_distance_miles is null
    or (distance_miles is not null and distance_miles <= p_max_distance_miles)
  )
  order by
    case when coalesce(p_sort_nearest, false) then distance_miles end asc nulls last,
    case subscription_tier
      when 'gold' then 2
      when 'silver' then 1
      else 0
    end desc,
    profile_boosted_until desc nulls last,
    created_at desc
  limit 50;
$function$;
