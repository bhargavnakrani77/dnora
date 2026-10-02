export interface TopBarConfig {
  brand_name: string;
  tagline: string;
  concierge_phone: string;
  concierge_email: string;
  show_search: boolean;
  show_wishlist: boolean;
  show_account: boolean;
  show_cart: boolean;
  is_sticky: boolean;
  custom_badge_text?: string;
}

export const DEFAULT_TOPBAR_CONFIG: TopBarConfig = {
  brand_name: "DNORA",
  tagline: "HAUTE MAROQUINERIE • MILANO / PARIS",
  concierge_phone: "+39 02 8901 3450",
  concierge_email: "concierge@dnora.luxury",
  show_search: true,
  show_wishlist: true,
  show_account: true,
  show_cart: true,
  is_sticky: true,
  custom_badge_text: "Complimentary Delivery",
};
