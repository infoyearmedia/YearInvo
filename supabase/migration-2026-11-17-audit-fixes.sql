-- ========================================================
-- YearInvo audit fixes — 2026-11-17
-- Owner Dashboard (Supabase-backed user directory) +
-- subscription approval flow + team invitations.
-- IDEMPOTENT: safe to run multiple times.
-- Apply manually in the Supabase SQL editor. Do NOT run
-- from the frontend; the app never executes this file.
-- Project: yearinvo-app (khntourzpzwyshnlpvak)
-- ========================================================

-- 1. users: account status + subscription expiry
--    (status drives owner suspend/block + login enforcement;
--     subscription_expires_at is written on approval.)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- 2. subscription_requests: requester identity + review trail
--    (all 7 columns are missing from supabase/schema.sql)
ALTER TABLE public.subscription_requests
  ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.subscription_requests
  ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE public.subscription_requests
  ADD COLUMN IF NOT EXISTS current_plan TEXT;
ALTER TABLE public.subscription_requests
  ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.subscription_requests
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.subscription_requests
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;
ALTER TABLE public.subscription_requests
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. team_invitations: single-use invite records for Team Management
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  owner_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  accepted_by TEXT,
  accepted_at TIMESTAMPTZ
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'team_invitations'
      AND policyname = 'Public & Auth Full Access team_invitations'
  ) THEN
    CREATE POLICY "Public & Auth Full Access team_invitations"
      ON public.team_invitations
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
