-- Likes & Matches RLS hardening
--
-- Adds the canonical row-level-security policies for the `likes` and
-- `matches` tables so authenticated users can:
--   - read likes/matches where they are involved
--   - insert likes from themselves (sender = auth.uid())
--   - update/delete their own likes (e.g. converting a pass to a like
--     from the Look Back page)
--   - create matches they are a participant of (mutual-like flow)
--
-- Without these, the WhoLikedMe "Like Back" upsert returns 403 because
-- INSERT is implicitly denied when RLS is enabled with no INSERT policy.

-- ─────────────────────────────────────────────
-- likes
-- ─────────────────────────────────────────────

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_involved" ON public.likes;
CREATE POLICY "likes_select_involved"
  ON public.likes FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "likes_insert_own" ON public.likes;
CREATE POLICY "likes_insert_own"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "likes_update_own" ON public.likes;
CREATE POLICY "likes_update_own"
  ON public.likes FOR UPDATE
  USING (auth.uid() = from_user_id)
  WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "likes_delete_own" ON public.likes;
CREATE POLICY "likes_delete_own"
  ON public.likes FOR DELETE
  USING (auth.uid() = from_user_id);

-- ─────────────────────────────────────────────
-- matches
-- ─────────────────────────────────────────────

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_select_involved" ON public.matches;
CREATE POLICY "matches_select_involved"
  ON public.matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "matches_insert_participant" ON public.matches;
CREATE POLICY "matches_insert_participant"
  ON public.matches FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "matches_update_participant" ON public.matches;
CREATE POLICY "matches_update_participant"
  ON public.matches FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
