export type UserRole = "admin" | "customer";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = "draft" | "active" | "archived";

export interface ProductImage {
  id?: string;
  product_id?: string;
  cloudinary_public_id: string;
  secure_url: string;
  alt_text: string;
  sort_order: number;
  created_at?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  description?: string;
  banner_image_url?: string;
  banner_mobile_image_url?: string;
  banner_heading?: string;
  banner_subtitle?: string;
  banner_media_type?: "image" | "video";
  banner_fit?: "cover" | "contain";
  banner_position?: string;
  banner_aspect_ratio?: "storefront" | "natural" | "ultrawide" | "video";
  product_count?: number;
  live_products_count?: number;
  total_products_count?: number;
  is_in_nav?: boolean;
  is_in_collections?: boolean;
  created_at?: string;
}

export interface ProductFlag {
  product_id: string;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  sort_order: number;
}

export interface ProductColorVariant {
  id?: string;
  name: string; // e.g., "Noir Black", "Caramel Tan", "Ivory Cream"
  color_hex: string; // e.g., "#1A1A1A", "#8B5A2B"
  hex?: string; // convenient alias
  images: ProductImage[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  cost_price?: number | null; // Cost / wholesale purchase price
  sku: string;
  stock: number;
  status: ProductStatus;
  craftsmanship_heading?: string | null;
  craftsmanship_details?: string | null;
  craftsmanship_mode?: "bullets" | "text" | null;
  shipping_heading?: string | null;
  shipping_customs?: string | null;
  shipping_mode?: "bullets" | "text" | null;
  leather_heading?: string | null;
  leather_care?: string | null;
  leather_mode?: "bullets" | "text" | null;
  images: ProductImage[];
  color_variants?: ProductColorVariant[];
  categories?: ProductCategory[];
  category_name?: string;
  category_slug?: string;
  is_best_seller?: boolean;
  is_new_arrival?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

export type HeroMediaType = "image" | "video";
export type HeroBannerStatus = "draft" | "published" | "archived";
export type HeroTextAlignment = "left" | "center" | "right";

export interface HeroBanner {
  id: string;
  title: string;
  heading?: string | null;
  subtitle?: string | null;
  media_type: HeroMediaType;
  cloudinary_public_id?: string | null;
  media_url: string;
  tablet_media_url?: string | null;
  mobile_media_url?: string | null;
  button_text?: string | null;
  button_link: string;
  duration_seconds: number; // default e.g. 5 for images, ignored or fallback for video
  sort_order: number;
  is_active: boolean;
  status: HeroBannerStatus;
  text_alignment?: HeroTextAlignment;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerReview {
  id: string;
  customer_name: string;
  rating: number; // 1 to 5
  review: string;
  image_url?: string;
  verified_purchase?: boolean;
  product_name?: string;
  status: "active" | "hidden";
  created_at: string;
}

export interface SeenOnYouVideo {
  id: string;
  customer_name: string;
  video_url: string;
  thumbnail_url?: string;
  cloudinary_public_id?: string;
  caption: string;
  product_name?: string;
  product_slug?: string;
  status: "active" | "hidden";
  sort_order: number;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedVariant?: {
    name: string;
    color_hex?: string;
    hex?: string;
    images?: string[] | ProductImage[];
  };
}

export interface AdminDashboardStats {
  totalProducts: number;
  totalCustomers?: number;
  totalOrders?: number;
  totalRevenue?: number;
  pendingOrders?: number;
  bestSellersCount: number;
  newArrivalsCount: number;
  activeHeroBanners: number;
  draftHeroBanners: number;
  lowStockCount: number;
}

export interface UserAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export type OrderStatus = "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name: string;
  product_slug?: string | null;
  price: number;
  quantity: number;
  image_url?: string | null;
  attributes?: Record<string, unknown>;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone?: string | null;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  shipping_address: {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  tracking_number?: string | null;
  carrier?: string | null;
  estimated_delivery?: string | null;
  notes?: string | null;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id?: string;
  user_id?: string;
  full_name?: string;
  phone?: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export interface AdminCustomer {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  created_at: string;
  updated_at?: string;
  total_orders: number;
  total_spent: number;
  primary_address?: CustomerAddress | null;
  addresses?: CustomerAddress[];
}

export interface SidebarSubmenuItem {
  id: string;
  label: string;
  href: string;
  badge?: string;
  is_active?: boolean;
}

export interface SidebarMenuItem {
  id: string;
  label: string;
  href?: string;
  icon: string;
  badge?: string;
  is_active: boolean;
  submenus?: SidebarSubmenuItem[];
}

export interface AnnouncementItem {
  id: string;
  text: string;
  link?: string;
  badge?: string;
  is_active: boolean;
  sort_order?: number;
}

export interface AnnouncementConfig {
  id: string;
  interval_seconds: number;
  is_active: boolean;
  items: AnnouncementItem[];
  updated_at?: string;
}
export interface HomepageConfig {
  topbar?: {
    enabled: boolean;
    text: string;
    link?: string;
  };
  hero?: {
    enabled: boolean;
    height?: string;
    auto_swipe?: boolean;
    interval_seconds?: number;
  };
  categories?: {
    enabled: boolean;
    title: string;
    heading_color?: string;
    heading_font_size?: string;
    heading_font_family?: string;
    heading_font_weight?: string;
    card_gap?: number;
    card_size?: "sm" | "md" | "lg";
    card_width?: number;
  };
  best_sellers?: {
    enabled: boolean;
    title: string;
    view_all_link?: string;
    view_all_text?: string;
    heading_color?: string;
    heading_font_size?: string;
    heading_font_family?: string;
    heading_font_weight?: string;
    card_gap?: number;
    card_size?: "sm" | "md" | "lg";
    card_width?: number;
    product_ids?: string[];
  };
  new_in?: {
    enabled: boolean;
    title: string;
    view_all_link?: string;
    view_all_text?: string;
    heading_color?: string;
    heading_font_size?: string;
    heading_font_family?: string;
    heading_font_weight?: string;
    card_gap?: number;
    card_size?: "sm" | "md" | "lg";
    card_width?: number;
    product_ids?: string[];
  };
  middle_banner?: {
    enabled: boolean;
    eyebrow?: string;
    title: string;
    description: string;
    button_text: string;
    button_link: string;
    image_url?: string;
    media_type?: "image" | "video";
    media_url?: string;
    height?: string;
    duration_seconds?: number;
    auto_swipe?: boolean;
  };
  seen_on_you?: {
    enabled: boolean;
    title: string;
    heading_color?: string;
    heading_font_size?: string;
    heading_font_family?: string;
    heading_font_weight?: string;
    card_gap?: number;
    card_size?: "sm" | "md" | "lg";
    card_width?: number;
  };
  customer_reviews?: {
    enabled: boolean;
    title: string;
  };
  footer?: {
    enabled?: boolean;
    brand_subtitle?: string;
    subtitle?: string;
    story_text?: string;
    headquarters?: string;
    instagram_url?: string;
    facebook_url?: string;
    whatsapp_number?: string;
    whatsapp_url?: string;
    pinterest_url?: string;
  };
  sections?: HomepageSection[];
}

export type HomepageSectionType = "best_sellers" | "new_in" | "category" | "custom_products";

export interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string;
  type: HomepageSectionType;
  category_id?: string;
  category_slug?: string;
  product_ids?: string[];
  view_all_link?: string;
  view_all_text?: string;
  display_style?: "grid" | "carousel";
  limit?: number;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface CircularCollectionItem {
  id: string;
  label: string;
  href: string;
  image: string;
  badge?: string;
  alt?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TrendingNowItem {
  id: string;
  title?: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_active: boolean;
  target_link?: string;
  product_id?: string;
  product_slug?: string;
  price?: number;
  compare_at_price?: number | null;
  created_at?: string;
}

export interface ShippingConfig {
  id: string;
  is_standard_enabled: boolean;
  standard_title: string;
  standard_rate: number;
  free_shipping_threshold: number;
  standard_estimated_days: string;
  is_express_enabled: boolean;
  express_title: string;
  express_rate: number;
  express_estimated_days: string;
  is_cod_enabled: boolean;
  cod_charge: number;
  updated_at?: string;
}

export interface StorefrontPageConfig {
  page_key: string;
  title: string;
  badge_label?: string | null;
  subtitle?: string | null;
  description?: string | null;
  banner_image_url?: string | null;
  banner_headline?: string | null;
  banner_subheadline?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_active: boolean;
  featured_product_ids?: string[];
  updated_at?: string;
}

