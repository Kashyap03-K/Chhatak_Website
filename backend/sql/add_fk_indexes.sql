-- Add indexes on foreign key columns to satisfy the Supabase "Unindexed
-- foreign keys" performance advisory. These speed up joins and make
-- ON DELETE CASCADE cleanup efficient.

CREATE INDEX IF NOT EXISTS ix_addresses_user_id       ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS ix_cart_items_user_id      ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS ix_cart_items_product_id   ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS ix_orders_user_id          ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS ix_order_items_order_id    ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS ix_order_items_product_id  ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS ix_payments_order_id       ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS ix_section_images_section_id ON public.section_images(section_id);
