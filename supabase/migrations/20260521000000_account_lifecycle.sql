-- Account lifecycle: self-pause + safe delete.
--
-- Adds:
--   1. profiles.paused_at  -- distinguishes self-paused from admin-disabled.
--   2. ON DELETE policies on child FKs so `auth.admin.deleteUser(uuid)` can
--      cascade cleanly without orphaning rows OR wiping moderation history.
--
-- Per-table policy (per user safeguards review):
--   likes / matches / intro_requests / media / communication_boundaries / wali_links
--     -> CASCADE          (private interaction data; no value retaining one side)
--   messages.conversation_id -> matches.id
--     -> CASCADE          (matches that go take their messages with them; FB Dating pattern)
--   wali_activity_logs / reported_profiles
--     -> SET NULL         (moderation/audit retained, identity anonymized)
--
-- Tables NOT touched here (already CASCADE on auth.users delete or already correct):
--   notification_queue, blocked_users, backup_codes
--
-- The script is idempotent and safe to re-run: each FK is rediscovered by name
-- from pg_constraint before being dropped + recreated. If a target table doesn't
-- exist in this environment, the helper logs a NOTICE and skips it.

-- ─────────────────────────────────────────────
-- 1. Pause column
-- ─────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.paused_at IS
  'Set when the user self-pauses their account from Settings. NULL means the account is either active or admin-disabled (is_active=false AND paused_at IS NULL). Self-resume is only allowed when paused_at IS NOT NULL.';

-- ─────────────────────────────────────────────
-- 2. FK retargeting helper
-- ─────────────────────────────────────────────
--
-- Looks up the FK on (p_table.p_column -> p_ref_table.id), drops it, and
-- re-adds it with the requested ON DELETE behavior. Skips silently if either
-- the table or the FK is missing.
--
-- For SET NULL, also drops NOT NULL on the column (FK SET NULL requires it).

CREATE OR REPLACE FUNCTION pg_temp.retarget_fk(
  p_table     text,
  p_column    text,
  p_ref_table text,
  p_action    text  -- 'CASCADE' or 'SET NULL'
) RETURNS void
LANGUAGE plpgsql
AS $func$
DECLARE
  v_conname text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table
  ) THEN
    RAISE NOTICE 'retarget_fk: skip %.% — table not present', p_table, p_column;
    RETURN;
  END IF;

  SELECT con.conname
    INTO v_conname
  FROM pg_constraint con
  JOIN pg_class c        ON con.conrelid = c.oid
  JOIN pg_namespace n    ON c.relnamespace = n.oid
  JOIN pg_attribute a    ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
  JOIN pg_class ref      ON con.confrelid = ref.oid
  WHERE c.relname    = p_table
    AND n.nspname    = 'public'
    AND con.contype  = 'f'
    AND a.attname    = p_column
    AND ref.relname  = p_ref_table
  LIMIT 1;

  IF v_conname IS NULL THEN
    RAISE NOTICE 'retarget_fk: skip %.% — no FK to %', p_table, p_column, p_ref_table;
    RETURN;
  END IF;

  IF p_action = 'SET NULL' THEN
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL',
      p_table, p_column
    );
  END IF;

  EXECUTE format(
    'ALTER TABLE public.%I DROP CONSTRAINT %I',
    p_table, v_conname
  );

  EXECUTE format(
    'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(id) ON DELETE %s',
    p_table, v_conname, p_column, p_ref_table, p_action
  );

  RAISE NOTICE 'retarget_fk: %.% -> %.id ON DELETE %', p_table, p_column, p_ref_table, p_action;
END
$func$;

-- ─────────────────────────────────────────────
-- 3. CASCADE: user-facing interaction data
-- ─────────────────────────────────────────────

SELECT pg_temp.retarget_fk('likes',                    'from_user_id', 'profiles', 'CASCADE');
SELECT pg_temp.retarget_fk('likes',                    'to_user_id',   'profiles', 'CASCADE');
SELECT pg_temp.retarget_fk('matches',                  'user1_id',     'profiles', 'CASCADE');
SELECT pg_temp.retarget_fk('matches',                  'user2_id',     'profiles', 'CASCADE');
SELECT pg_temp.retarget_fk('intro_requests',           'from_user_id', 'profiles', 'CASCADE');
SELECT pg_temp.retarget_fk('intro_requests',           'to_user_id',   'profiles', 'CASCADE');
SELECT pg_temp.retarget_fk('media',                    'uploaded_by',  'profiles', 'CASCADE');
SELECT pg_temp.retarget_fk('communication_boundaries', 'ward_id',      'profiles', 'CASCADE');
SELECT pg_temp.retarget_fk('wali_links',               'guardian_id',  'profiles', 'CASCADE');
SELECT pg_temp.retarget_fk('wali_links',               'ward_id',      'profiles', 'CASCADE');

-- Messages cascade through their match. Without this, CASCADE on matches
-- would either fail (RESTRICT/NO ACTION) or leave orphan messages with a
-- dangling conversation_id.
SELECT pg_temp.retarget_fk('messages', 'conversation_id', 'matches', 'CASCADE');

-- ─────────────────────────────────────────────
-- 4. SET NULL: moderation / audit (retain rows, anonymize identity)
-- ─────────────────────────────────────────────

SELECT pg_temp.retarget_fk('wali_activity_logs', 'guardian_id',         'profiles', 'SET NULL');
SELECT pg_temp.retarget_fk('wali_activity_logs', 'ward_id',             'profiles', 'SET NULL');
SELECT pg_temp.retarget_fk('reported_profiles',  'reporter_id',         'profiles', 'SET NULL');
SELECT pg_temp.retarget_fk('reported_profiles',  'reported_profile_id', 'profiles', 'SET NULL');

-- Helper is a temp function and goes away at end of session; no cleanup needed.
