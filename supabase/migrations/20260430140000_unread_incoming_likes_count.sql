-- unread_incoming_likes_count RPC
--
-- Returns the count of incoming likes the user has NOT yet acted on
-- (neither liked back nor passed). This is what should drive the red
-- badge on the Likes nav button — counting all incoming likes makes
-- the badge stick forever even after the user has responded.

CREATE OR REPLACE FUNCTION public.unread_incoming_likes_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT COUNT(*) FROM public.likes l
  WHERE l.to_user_id = auth.uid()
    AND l.type = 'like'
    AND NOT EXISTS (
      SELECT 1 FROM public.likes my
      WHERE my.from_user_id = auth.uid()
        AND my.to_user_id = l.from_user_id
    );
$$;

GRANT EXECUTE ON FUNCTION public.unread_incoming_likes_count() TO authenticated;
