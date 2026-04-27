-- Tighten messages RLS:
--
-- 1. INSERT must pin `conversation_id` to the actual matches.id between
--    sender and receiver — without this, a user could write a message
--    into a conversation_id that isn't theirs (low blast radius but real
--    data-integrity hole).
--
-- 2. UPDATE was unrestricted on columns: receiver could change `content`,
--    `sender_id`, etc. Add a BEFORE UPDATE trigger that allows only
--    `is_read` (and `updated_at`) to change — every other column must
--    equal its prior value.

-- ─────────────────────────────────────────────
-- 1) INSERT policy: require conversation_id = matches.id
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can send messages to matched users" ON public.messages;

CREATE POLICY "Users can send messages to matched users"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = messages.conversation_id
        AND (
          (m.user1_id = auth.uid() AND m.user2_id = messages.receiver_id)
          OR
          (m.user2_id = auth.uid() AND m.user1_id = messages.receiver_id)
        )
    )
  );

-- ─────────────────────────────────────────────
-- 2) Lock immutable columns on UPDATE
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.messages_lock_immutable_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id              IS DISTINCT FROM OLD.id              THEN RAISE EXCEPTION 'messages.id is immutable'; END IF;
  IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN RAISE EXCEPTION 'messages.conversation_id is immutable'; END IF;
  IF NEW.sender_id       IS DISTINCT FROM OLD.sender_id       THEN RAISE EXCEPTION 'messages.sender_id is immutable'; END IF;
  IF NEW.receiver_id     IS DISTINCT FROM OLD.receiver_id     THEN RAISE EXCEPTION 'messages.receiver_id is immutable'; END IF;
  IF NEW.content         IS DISTINCT FROM OLD.content         THEN RAISE EXCEPTION 'messages.content is immutable'; END IF;
  IF NEW.image_url       IS DISTINCT FROM OLD.image_url       THEN RAISE EXCEPTION 'messages.image_url is immutable'; END IF;
  IF NEW.created_at      IS DISTINCT FROM OLD.created_at      THEN RAISE EXCEPTION 'messages.created_at is immutable'; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_immutable_cols ON public.messages;
CREATE TRIGGER messages_immutable_cols
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.messages_lock_immutable_columns();
