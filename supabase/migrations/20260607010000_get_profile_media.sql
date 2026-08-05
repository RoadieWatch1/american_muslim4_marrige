-- get_profile_media RPC
--
-- Returns all approved photo/video media for a given user. Runs as
-- SECURITY DEFINER so a viewer (not the media owner) can load someone
-- else's full photo gallery when opening their profile — the `media`
-- table's owner-only SELECT RLS policy otherwise silently returns zero
-- rows to other users. Same pattern/rationale as get_basic_profiles and
-- get_public_profile, which already work around this same restriction
-- for the single primary photo.
--
-- Intentionally has no blocking/active-status filter, matching
-- get_public_profile's existing behavior — visibility is enforced once,
-- upstream, when a profile enters a list (e.g. discover_profiles); every
-- caller of this RPC (PublicProfileModal) already went through that gate
-- before letting the viewer open the profile detail view in the first
-- place.
--
-- Called from PublicProfileModal.tsx instead of a direct
-- `.from('media').select(...)` query, which only ever returned rows when
-- the viewer WAS the media owner.

CREATE OR REPLACE FUNCTION public.get_profile_media(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  type text,
  url text,
  is_primary boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT m.id, m.type, m.url, m.is_primary, m.created_at
  FROM public.media m
  WHERE m.user_id = p_user_id
    AND m.status = 'approved'
  ORDER BY m.is_primary DESC, m.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_media(uuid) TO authenticated;
