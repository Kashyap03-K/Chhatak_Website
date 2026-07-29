-- Enable RLS on public.reels to satisfy the Supabase linter.
--
-- The FastAPI backend connects with a Postgres role that either owns the
-- table or is BYPASSRLS, so backend queries are unaffected. This only gates
-- access via PostgREST / the Supabase anon + authenticated roles.
--
-- Policy: public read-only. All writes must go through the backend.

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reels are viewable by everyone" ON public.reels;
CREATE POLICY "Reels are viewable by everyone"
  ON public.reels
  FOR SELECT
  USING (true);
