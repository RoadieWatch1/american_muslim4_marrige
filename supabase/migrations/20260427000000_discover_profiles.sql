-- Snapshot of public.discover_profiles into version control.
-- Drops the older 13-arg overload (now unused by the client) and
-- (re)creates the 15-arg version that supports distance filtering.

DROP FUNCTION IF EXISTS public.discover_profiles(
  uuid, integer, integer, text, text, text,
  boolean, boolean, boolean,
  text, text, text, text
);

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
  profile_boosted_until timestamp with time zone,
  lifestyle_choices jsonb,
  languages_spoken text[],
  age integer,
  profile_photo_url text,
  intro_video_url text,
  last_seen_at timestamp with time zone,
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
    select
      gender,
      latitude as my_lat,
      longitude as my_lng
    from profiles
    where id = p_user_id
  ),
  base as (
    select
      p.id,
      p.email,
      p.first_name,
      p.last_name,
      p.gender,
      p.dob,
      p.city,
      p.state,
      p.country,
      p.denomination,
      p.practice_level,
      p.prayer_regular,
      p.marital_status,
      p.has_children,
      p.education,
      p.occupation,
      p.ethnicity,
      p.bio,
      p.nikah_timeline,
      p.wali_required,
      p.verified_badge,
      p.subscription_tier,
      p.profile_boosted_until,
      p.lifestyle_choices,
      p.languages_spoken,
      floor(extract(year from age(current_date, p.dob)))::int as age,
      mp.url as profile_photo_url,
      mv.url as intro_video_url,
      p.last_seen_at,
      p.madhab,
      p.prayer_frequency,
      p.mosque_attendance,
      p.halal_strict,

      p.created_at as created_at,

      -- Haversine distance in miles (NULL when either side has no coords).
      case
        when cp.my_lat is null or cp.my_lng is null or p.latitude is null or p.longitude is null
          then null
        else
          (
            3958.8 * 2 * asin(
              sqrt(
                pow(sin(radians((p.latitude - cp.my_lat) / 2)), 2) +
                cos(radians(cp.my_lat)) * cos(radians(p.latitude)) *
                pow(sin(radians((p.longitude - cp.my_lng) / 2)), 2)
              )
            )
          )
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

      -- advanced
      and (p_verified_only is not true or p.verified_badge = true)
      and (p_has_photo is not true or p.profile_photo_id is not null)
      and (
        p_recently_active is not true
        or (p.last_seen_at is not null and p.last_seen_at >= now() - interval '7 days')
      )

      -- gold islamic filters
      and (p_madhab is null or p.madhab = p_madhab)
      and (p_prayer_frequency is null or p.prayer_frequency = p_prayer_frequency)
      and (p_mosque_attendance is null or p.mosque_attendance = p_mosque_attendance)
      and (p_halal_strict is null or p.halal_strict = p_halal_strict)

      and not exists (
        select 1
        from likes l
        where l.from_user_id = p_user_id
          and l.to_user_id = p.id
      )
      and not exists (
        select 1
        from matches m
        where
          (m.user1_id = p_user_id and m.user2_id = p.id)
          or
          (m.user2_id = p_user_id and m.user1_id = p.id)
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
  where
    -- p_max_distance_miles IS NULL means "anywhere in the world".
    -- Users with NULL coords are excluded only when a cap is set.
    (
      p_max_distance_miles is null
      or (
        distance_miles is not null
        and distance_miles <= p_max_distance_miles
      )
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
