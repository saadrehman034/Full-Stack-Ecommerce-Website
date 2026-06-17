-- Enum types
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded');
CREATE TYPE order_source AS ENUM ('online', 'pos');
CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed');

-- Users table extending auth.users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'customer'::user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Categories
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Products
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  images JSONB DEFAULT '[]'::jsonb NOT NULL,
  tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
  stock_quantity INTEGER DEFAULT 0 NOT NULL,
  low_stock_threshold INTEGER DEFAULT 5 NOT NULL,
  track_inventory BOOLEAN DEFAULT true NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  weight_grams INTEGER,
  unit TEXT CHECK (unit IN ('each', 'kg', 'g', 'litre', 'ml', 'pack')) DEFAULT 'each' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Product Variants
CREATE TABLE public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price_modifier DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  stock_quantity INTEGER DEFAULT 0 NOT NULL
);

-- Coupons
CREATE TABLE public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type coupon_type NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Addresses
CREATE TABLE public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false NOT NULL
);

-- POS Sessions
CREATE TABLE public.pos_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  opening_cash DECIMAL(10, 2) NOT NULL,
  closing_cash DECIMAL(10, 2),
  total_sales DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  total_orders INTEGER DEFAULT 0 NOT NULL,
  notes TEXT
);

-- Orders
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending'::order_status NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  shipping_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status payment_status DEFAULT 'unpaid'::payment_status NOT NULL,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  source order_source DEFAULT 'online'::order_source NOT NULL,
  staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order Items
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  product_snapshot JSONB NOT NULL
);

-- Customers Coupons
CREATE TABLE public.customers_coupons (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, coupon_id)
);

-- Inventory Logs
CREATE TABLE public.inventory_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  body TEXT,
  is_verified_purchase BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create simple trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Helpers for auth
CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'role', '')::text;
$$ LANGUAGE SQL STABLE;

-- Admin can do everything
CREATE POLICY "Admins have full access" ON public.users FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins have full access" ON public.categories FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins have full access" ON public.products FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins have full access" ON public.product_variants FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins have full access" ON public.coupons FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins have full access" ON public.addresses FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins have full access" ON public.pos_sessions FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins have full access" ON public.orders FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins have full access" ON public.order_items FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins have full access" ON public.customers_coupons FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins have full access" ON public.inventory_logs FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins have full access" ON public.reviews FOR ALL USING (auth.role() = 'admin');

-- Staff policies
CREATE POLICY "Staff can read products" ON public.products FOR SELECT USING (auth.role() IN ('staff', 'admin'));
CREATE POLICY "Staff can read categories" ON public.categories FOR SELECT USING (auth.role() IN ('staff', 'admin'));
CREATE POLICY "Staff can read/write orders" ON public.orders FOR ALL USING (auth.role() IN ('staff', 'admin'));
CREATE POLICY "Staff can read/write order items" ON public.order_items FOR ALL USING (auth.role() IN ('staff', 'admin'));
CREATE POLICY "Staff can read/write inventory logs" ON public.inventory_logs FOR ALL USING (auth.role() IN ('staff', 'admin'));
CREATE POLICY "Staff can read/write pos sessions" ON public.pos_sessions FOR ALL USING (auth.role() IN ('staff', 'admin'));

-- Customer policies
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can read active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read product variants" ON public.product_variants FOR SELECT USING (true);

CREATE POLICY "Users can manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Anyone can read verified reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_logs;

-- Helper function for POS stock decrement
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, amount INTEGER)
RETURNS void AS $$
  UPDATE products
  SET stock_quantity = GREATEST(0, stock_quantity - amount)
  WHERE id = product_id;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) TO authenticated;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage newsletter" ON public.newsletter_subscribers FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
