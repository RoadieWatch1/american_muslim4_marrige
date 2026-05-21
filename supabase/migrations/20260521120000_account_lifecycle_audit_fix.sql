-- Corrective follow-up to 20260521000000_account_lifecycle.sql.
--
-- The first migration's helper looked up FKs by (table, column, profiles)
-- using guessed column names. The real schema differs:
--
--   wali_activity_logs   uses wali_id / ward_id            (not guardian_id)
--   reported_profiles    uses reporter_id / reported_user_id (not reported_profile_id)
--
-- Worse, wali_activity_logs.* FKs point to auth.users(id), not profiles(id),
-- so even after fixing the column names the original helper would have
-- skipped them. As a result the safety/audit tables remained CASCADE — which
-- means deleting a user would wipe wali audit logs and the "reported_user_id"
-- side of any report against them, defeating the retention requirement from
-- the previous pass.
--
-- This migration:
--   1. Looks up each FK by its CONSTRAINT NAME (verified against the live
--      DB), discovers the existing reference target, drops NOT NULL on the
--      column if needed, then drops and re-adds the FK with ON DELETE SET
--      NULL — preserving whatever schema.table(column) it pointed at.
--   2. Is idempotent: re-running is safe. Already-SET-NULL constraints stay
--      SET NULL; already-nullable columns stay nullable.
--
-- After this runs, identity columns in moderation/audit rows go NULL when a
-- user is deleted, the row itself survives, and queries that join back to
-- profiles for the now-null user simply get NULL rather than erroring.

CREATE OR REPLACE FUNCTION pg_temp.retarget_fk_by_name(
  p_table       text,
  p_constraint  text,
  p_column      text,
  p_action      text   -- 'CASCADE' | 'SET NULL'
) RETURNS void
LANGUAGE plpgsql
AS $func$
DECLARE
  v_ref_schema text;
  v_ref_table  text;
  v_ref_column text;
  v_action_code text;
BEGIN
  -- Discover the existing target of the FK (and short-circuit if it's
  -- already configured the way we want — keeps re-runs cheap).
  SELECT
    n.nspname,
    c.relname,
    a.attname,
    con.confdeltype
  INTO
    v_ref_schema,
    v_ref_table,
    v_ref_column,
    v_action_code
  FROM pg_constraint con
  JOIN pg_class c        ON con.confrelid = c.oid
  JOIN pg_namespace n    ON c.relnamespace = n.oid
  JOIN pg_attribute a    ON a.attrelid = c.oid AND a.attnum = ANY(con.confkey)
  WHERE con.conname = p_constraint
    AND con.contype = 'f';

  IF v_ref_table IS NULL THEN
    RAISE NOTICE 'retarget_fk_by_name: skip — constraint % not found', p_constraint;
    RETURN;
  END IF;

  -- 'n' = SET NULL, 'c' = CASCADE, 'a' = NO ACTION, 'r' = RESTRICT, etc.
  IF (p_action = 'SET NULL' AND v_action_code = 'n')
     OR (p_action = 'CASCADE' AND v_action_code = 'c') THEN
    RAISE NOTICE 'retarget_fk_by_name: % already %, no-op', p_constraint, p_action;
    RETURN;
  END IF;

  -- SET NULL requires the column to be nullable. DROP NOT NULL is a no-op
  -- if it's already nullable.
  IF p_action = 'SET NULL' THEN
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL',
      p_table, p_column
    );
  END IF;

  EXECUTE format(
    'ALTER TABLE public.%I DROP CONSTRAINT %I',
    p_table, p_constraint
  );

  EXECUTE format(
    'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.%I(%I) ON DELETE %s',
    p_table, p_constraint, p_column,
    v_ref_schema, v_ref_table, v_ref_column,
    p_action
  );

  RAISE NOTICE 'retarget_fk_by_name: % %.% -> %.%.% ON DELETE %',
    p_table, p_column, p_action, v_ref_schema, v_ref_table, v_ref_column, p_action;
END
$func$;

-- ─────────────────────────────────────────────
-- Safety / audit tables: SET NULL, retain rows
-- ─────────────────────────────────────────────

-- wali_activity_logs.wali_id, ward_id (these FK to auth.users on this DB)
SELECT pg_temp.retarget_fk_by_name(
  'wali_activity_logs',
  'wali_activity_logs_wali_id_fkey',
  'wali_id',
  'SET NULL'
);

SELECT pg_temp.retarget_fk_by_name(
  'wali_activity_logs',
  'wali_activity_logs_ward_id_fkey',
  'ward_id',
  'SET NULL'
);

-- reported_profiles.reported_user_id (reporter_id was already corrected by
-- the prior migration; this just catches the other side).
SELECT pg_temp.retarget_fk_by_name(
  'reported_profiles',
  'reported_profiles_reported_user_id_fkey',
  'reported_user_id',
  'SET NULL'
);
