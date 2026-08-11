-- Enable RLS on all public tables to satisfy the Supabase linter.
--
-- The FastAPI backend connects with the Postgres owner role, which bypasses
-- RLS, so backend queries and admin endpoints are unaffected. RLS here only
-- gates access from PostgREST (the Supabase anon + authenticated roles) in
-- case anyone hits the auto-generated REST API directly.
--
-- Policy summary:
--   Public read:  products, reviews, landing_sections, section_images
--   Backend-only: users, addresses, cart_items, orders, order_items, payments
--                 (RLS enabled with NO policies -> anon/authenticated blocked)

-- ---------- Public read tables ----------

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT USING (true);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

ALTER TABLE public.landing_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Landing sections are viewable by everyone" ON public.landing_sections;
CREATE POLICY "Landing sections are viewable by everyone"
  ON public.landing_sections FOR SELECT USING (true);

ALTER TABLE public.section_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Section images are viewable by everyone" ON public.section_images;
CREATE POLICY "Section images are viewable by everyone"
  ON public.section_images FOR SELECT USING (true);

-- ---------- Backend-only tables (RLS on, no policies) ----------

ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments     ENABLE ROW LEVEL SECURITY;
