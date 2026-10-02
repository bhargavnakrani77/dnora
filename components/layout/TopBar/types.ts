export interface NavCategory {
  id: string;
  label: string;
  href: string;
  badge?: string;
  subcategories?: {
    title: string;
    items: { label: string; href: string; badge?: string }[];
  }[];
  featuredCard?: {
    title: string;
    subtitle: string;
    image: string;
    href: string;
    cta: string;
  };
}

export interface TopBarConfig {
  announcement_text?: string;
  show_announcement?: boolean;
  announcement_link?: string;
  concierge_phone?: string;
  concierge_email?: string;
  show_search?: boolean;
  show_wishlist?: boolean;
  show_cart?: boolean;
  show_account?: boolean;
  show_currency?: boolean;
  currencies?: string[];
  default_currency?: string;
  is_sticky?: boolean;
}
