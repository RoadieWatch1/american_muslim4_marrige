-- touch_last_seen RPC
--
-- Replaces the touch_last_seen Edge Function with a SECURITY DEFINER
-- Postgres function. The client now updates last_seen_at via a single
-- supabase.rpc('touch_last_seen') call — no Edge Function deploy
-- required, no Authorization header juggling, and no cold-start latency
-- on the 30-second presence heartbeat.

CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET last_seen_at = now()
  WHERE id = v_caller;
END;
$$;

GRANT EXECUTE ON FUNCTION public.touch_last_seen() TO authenticated;
