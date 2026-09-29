-- Row-Level Security for the user-owned tables, as a second line of defence
-- behind the API layer.
--
-- HOW THIS INTERACTS WITH THE APP
-- -------------------------------
-- The Neon role the Next.js server connects with OWNS these tables, and in
-- Postgres a table owner bypasses RLS unless FORCE ROW LEVEL SECURITY is set.
-- That is deliberate here: the server legitimately makes anonymous reads
-- (the public feedback board, resolving short codes, tool pages by code), and
-- its authorization data (the admin role) lives in the JWT, not the database.
--
-- So this migration changes nothing for LnkZoo today. What it buys: if any
-- OTHER role is ever granted access to these tables - an analytics reader, a
-- future service, a psql session gone wrong - that role gets these row rules
-- instead of the whole table. The app-level policy in docs/policies.md stays
-- the first line of defence; this is the safety net behind it.
--
-- DO NOT run FORCE ROW LEVEL SECURITY on these tables unless the server also
-- starts setting the session variables below per request (SET LOCAL inside its
-- transaction). Forced RLS with no variables set makes every query return
-- zero rows - the app would still run, but the board and tools would look
-- mysteriously empty.
--
-- Session contract (for whoever connects with a non-owner role):
--   SET LOCAL app.current_user_id   = '<users.id uuid>';   -- or leave unset = anonymous
--   SET LOCAL app.current_role_setting = 'admin';          -- only if you mean it
--
-- Idempotent: safe to run twice.

-- ─────────────────────────────────────────
-- Helper functions
-- ─────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS app;

-- The acting user, as set by the server for this transaction; NULL when unset
-- or anonymous. STABLE so a policy can call it per row without re-planning.
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- Admin flag from the session, mirroring the JWT role claim.
CREATE OR REPLACE FUNCTION app.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT current_setting('app.current_role_setting', true) = 'admin';
$$;

-- ─────────────────────────────────────────
-- feedback — mirrors visibilityCondition() in services/feedback.service.ts
--   admin        -> everything
--   signed in    -> public + their own, whatever the visibility
--   signed out   -> public only
-- ─────────────────────────────────────────
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedback_read ON feedback;
CREATE POLICY feedback_read ON feedback FOR SELECT
  USING (
    visibility = 'public'
    OR user_id = app.current_user_id()
    OR app.is_admin()
  );

-- A report is always authored by whoever is inserting it - no anonymous posts,
-- no posting on someone else's behalf.
DROP POLICY IF EXISTS feedback_insert ON feedback;
CREATE POLICY feedback_insert ON feedback FOR INSERT
  WITH CHECK (user_id IS NOT NULL AND user_id = app.current_user_id());

-- Status triage is admin-only. (Authors never edit a posted report.)
DROP POLICY IF EXISTS feedback_update ON feedback;
CREATE POLICY feedback_update ON feedback FOR UPDATE
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

DROP POLICY IF EXISTS feedback_delete ON feedback;
CREATE POLICY feedback_delete ON feedback FOR DELETE
  USING (user_id = app.current_user_id() OR app.is_admin());

-- ─────────────────────────────────────────
-- Tool output — guests create rows with user_id NULL, owners manage their own.
-- The by-code resolution pages (/s/, /f/, /t/) read without any session
-- variable set, so SELECT is permissive: a code is the capability.
-- ─────────────────────────────────────────
ALTER TABLE temp_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortened_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS temp_files_read ON temp_files;
CREATE POLICY temp_files_read ON temp_files FOR SELECT USING (true);

DROP POLICY IF EXISTS temp_files_insert ON temp_files;
CREATE POLICY temp_files_insert ON temp_files FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = app.current_user_id());

DROP POLICY IF EXISTS temp_files_delete ON temp_files;
CREATE POLICY temp_files_delete ON temp_files FOR DELETE
  USING (user_id = app.current_user_id());

DROP POLICY IF EXISTS shared_texts_read ON shared_texts;
CREATE POLICY shared_texts_read ON shared_texts FOR SELECT USING (true);

DROP POLICY IF EXISTS shared_texts_insert ON shared_texts;
CREATE POLICY shared_texts_insert ON shared_texts FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = app.current_user_id());

DROP POLICY IF EXISTS shared_texts_delete ON shared_texts;
CREATE POLICY shared_texts_delete ON shared_texts FOR DELETE
  USING (user_id = app.current_user_id());

-- Short links: same shape, plus the resolver's click-count update.
DROP POLICY IF EXISTS shortened_links_read ON shortened_links;
CREATE POLICY shortened_links_read ON shortened_links FOR SELECT USING (true);

DROP POLICY IF EXISTS shortened_links_insert ON shortened_links;
CREATE POLICY shortened_links_insert ON shortened_links FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = app.current_user_id());

-- ONE update policy on purpose: Postgres ORs permissive policies together, so
-- separate "ownership" and "counter" policies would OR into "anyone may update
-- any row" - the opposite of the point. A row may be updated while it is
-- unclaimed (the guest-post claim path), owned by the acting user, or acted on
-- by an admin. The click counter rides along under the app role, which bypasses
-- all of this as table owner. If a dedicated low-privilege role is ever created
-- just to bump click_count, give it a column-level GRANT UPDATE(click_count)
-- and its own policy then - do not widen this one.
DROP POLICY IF EXISTS shortened_links_update ON shortened_links;
CREATE POLICY shortened_links_update ON shortened_links FOR UPDATE
  USING (user_id IS NULL OR user_id = app.current_user_id() OR app.is_admin())
  WITH CHECK (user_id IS NULL OR user_id = app.current_user_id() OR app.is_admin());

DROP POLICY IF EXISTS shortened_links_delete ON shortened_links;
CREATE POLICY shortened_links_delete ON shortened_links FOR DELETE
  USING (user_id = app.current_user_id());

-- ─────────────────────────────────────────
-- Verify (run these after the migration)
-- ─────────────────────────────────────────
-- Policies created, per table:
--   SELECT tablename, policyname, cmd, qual IS NOT NULL AS has_using,
--          with_check IS NOT NULL AS has_with_check
--   FROM pg_policies
--   WHERE tablename IN ('feedback','temp_files','shared_texts','shortened_links')
--   ORDER BY tablename, policyname;
--
-- RLS enabled (relrowsecurity should be true):
--   SELECT relname, relrowsecurity, relforcerowsecurity
--   FROM pg_class
--   WHERE relname IN ('feedback','temp_files','shared_texts','shortened_links');
--
-- Helper works (first query: true; second: NULL):
--   SELECT app.is_admin() WHERE current_setting('app.current_role_setting', true) = 'admin';
--   SELECT app.current_user_id();
