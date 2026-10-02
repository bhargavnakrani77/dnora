-- ==============================================================================
-- DNORA Luxury Handbags & Leather Goods - Database Schema
-- Supabase PostgreSQL with Row Level Security (RLS) & Seed Data
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
-- Tracks user profiles and admin authorization roles
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1B. EMAIL OTP VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.email_verifications (
  email TEXT PRIMARY KEY,
  otp_hash TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  password_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= price),
  sku TEXT NOT NULL UNIQUE,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT NOT NULL,
  secure_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PRODUCT CATEGORY RELATIONS
CREATE TABLE IF NOT EXISTS public.product_category_relations (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- 6. PRODUCT FLAGS / PLACEMENTS
CREATE TABLE IF NOT EXISTS public.product_flags (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  is_best_seller BOOLEAN NOT NULL DEFAULT false,
  is_new_arrival BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 7. HERO BANNERS
CREATE TABLE IF NOT EXISTS public.hero_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  cloudinary_public_id TEXT,
  media_url TEXT NOT NULL,
  mobile_media_url TEXT,
  button_text TEXT NOT NULL DEFAULT 'Explore Collection',
  button_link TEXT NOT NULL DEFAULT '/shop',
  duration_seconds INTEGER NOT NULL DEFAULT 5 CHECK (duration_seconds > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  text_alignment TEXT NOT NULL DEFAULT 'left' CHECK (text_alignment IN ('left', 'center', 'right')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. CUSTOMER REVIEWS
CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  image_url TEXT,
  verified_purchase BOOLEAN NOT NULL DEFAULT true,
  product_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. CUSTOMER VIDEOS / SEEN ON YOU
CREATE TABLE IF NOT EXISTS public.customer_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  cloudinary_public_id TEXT,
  caption TEXT NOT NULL,
  product_name TEXT,
  product_slug TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. USER ADDRESSES
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT NOT NULL DEFAULT 'card',
  shipping_address JSONB NOT NULL,
  tracking_number TEXT,
  carrier TEXT,
  estimated_delivery TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_slug TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  image_url TEXT,
  attributes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_flags_bestseller ON public.product_flags(is_best_seller) WHERE is_best_seller = true;
CREATE INDEX IF NOT EXISTS idx_product_flags_newarrival ON public.product_flags(is_new_arrival) WHERE is_new_arrival = true;
CREATE INDEX IF NOT EXISTS idx_hero_banners_status ON public.hero_banners(status, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_status ON public.customer_reviews(status);
CREATE INDEX IF NOT EXISTS idx_customer_videos_status ON public.customer_videos(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_category_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public Read Policies
CREATE POLICY "Public users can view active products" 
  ON public.products FOR SELECT 
  USING (status = 'active' OR public.is_admin());

CREATE POLICY "Public users can view product images" 
  ON public.product_images FOR SELECT 
  USING (true);

CREATE POLICY "Public users can view product categories" 
  ON public.product_categories FOR SELECT 
  USING (true);

CREATE POLICY "Public users can view product category relations" 
  ON public.product_category_relations FOR SELECT 
  USING (true);

CREATE POLICY "Public users can view product flags" 
  ON public.product_flags FOR SELECT 
  USING (true);

CREATE POLICY "Public users can view published hero banners" 
  ON public.hero_banners FOR SELECT 
  USING ((status = 'published' AND is_active = true) OR public.is_admin());

CREATE POLICY "Public users can view active reviews" 
  ON public.customer_reviews FOR SELECT 
  USING (status = 'active' OR public.is_admin());

CREATE POLICY "Public users can view active customer videos" 
  ON public.customer_videos FOR SELECT 
  USING (status = 'active' OR public.is_admin());

-- User Address Policies: Users can view and manage their own addresses
CREATE POLICY "Users can manage their own addresses" 
  ON public.user_addresses FOR ALL 
  USING (user_id = auth.uid() OR public.is_admin());

-- Order Policies: Users can view their own orders; Admins have full access
CREATE POLICY "Users can view their own orders" 
  ON public.orders FOR SELECT 
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can view their order items" 
  ON public.order_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE public.orders.id = public.order_items.order_id 
      AND (public.orders.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Users can view and update their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.users FOR SELECT 
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update their own profile" 
  ON public.users FOR UPDATE 
  USING (id = auth.uid() OR public.is_admin());

-- Admin Full Access Policies (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin full access users" ON public.users FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access product_images" ON public.product_images FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access product_categories" ON public.product_categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access product_category_relations" ON public.product_category_relations FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access product_flags" ON public.product_flags FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access hero_banners" ON public.hero_banners FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access customer_reviews" ON public.customer_reviews FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access customer_videos" ON public.customer_videos FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access user_addresses" ON public.user_addresses FOR ALL USING (public.is_admin());

-- 13. ADMIN SIDEBAR CONFIGURATION
CREATE TABLE IF NOT EXISTS public.admin_sidebar_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  items JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE POLICY "Admin full access admin_sidebar_config" ON public.admin_sidebar_config FOR ALL USING (public.is_admin());

-- 14. STOREFRONT & MEMBER NAVIGATION CONFIGURATION
CREATE TABLE IF NOT EXISTS public.site_navigation_config (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE POLICY "Public users can view site_navigation_config" ON public.site_navigation_config FOR SELECT USING (true);
CREATE POLICY "Admin full access site_navigation_config" ON public.site_navigation_config FOR ALL USING (public.is_admin());

-- 15. HOMEPAGE CIRCULAR COLLECTIONS ("Our Collections")
CREATE TABLE IF NOT EXISTS public.circular_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  href TEXT NOT NULL DEFAULT '/shop',
  image TEXT NOT NULL,
  badge TEXT,
  alt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.circular_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public users can view active circular collections" ON public.circular_collections FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin full access circular_collections" ON public.circular_collections FOR ALL USING (public.is_admin());
CREATE INDEX IF NOT EXISTS idx_circular_collections_sort ON public.circular_collections(sort_order ASC, created_at DESC);


