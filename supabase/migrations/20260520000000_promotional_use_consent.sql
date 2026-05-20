-- Promotional use consent fields on profiles.
--
-- Backs the opt-in toggle described in the Privacy Policy
-- ("Promotional Profile Visibility") and ToS Section 5. Only users with
-- allow_promotional_profile_use = true may be selected for AM4M social
-- media or promotional materials.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_promotional_profile_use BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promotional_profile_use_consented_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS promotional_profile_use_revoked_at TIMESTAMPTZ;
