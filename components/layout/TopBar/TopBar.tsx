"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Heart,
  User as UserIcon,
  ShoppingBag,
  ChevronDown,
  Sparkles,
  MapPin,
  Package,
  LogOut,
} from "lucide-react";
import { useCart } from "@/lib/store/cart-store";
import { useWishlist } from "@/lib/store/wishlist-store";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";
import { NavCategory, TopBarConfig } from "./types";
import { TopBarSearchModal } from "./TopBarSearchModal";
import { TopBarMegaMenu } from "./TopBarMegaMenu";
import { TopBarMobileDrawer } from "./TopBarMobileDrawer";

export type { NavCategory, TopBarConfig };

const LUXURY_NAV_CATEGORIES: NavCategory[] = [
  {
    id: "nav-new",
    label: "NEW IN",
    href: "/shop?sort=newest",
    badge: "New",
    subcategories: [
      {
        title: "LATEST ARRIVALS",
        items: [
          { label: "View All New Arrivals", href: "/shop?sort=newest" },
          { label: "The Florence Autumn Drop", href: "/shop?collection=florence", badge: "Exclusive" },
          { label: "Architectural Totes", href: "/category/tote-bags" },
          { label: "Saddle & Crossbody Silhouettes", href: "/category/crossbody-bags" },
          { label: "Miniature Evening Bags", href: "/category/mini-bags" },
        ],
      },
      {
        title: "CURATED EDITS",
        items: [
          { label: "Bestselling Icons", href: "/#bestsellers" },
          { label: "Monochrome Noir Collection", href: "/shop?color=black" },
          { label: "Tuscan Tan & Caramel", href: "/shop?color=caramel" },
          { label: "Gift Selection", href: "/shop?collection=gifts" },
        ],
      },
    ],
    featuredCard: {
      title: "THE FLORENCE SADDLE",
      subtitle: "Handcrafted in Italy from 100% certified Tuscan calfskin.",
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&q=85",
      href: "/shop",
      cta: "Explore Drop",
    },
  },
  {
    id: "nav-handbags",
    label: "HANDBAGS",
    href: "/shop",
    subcategories: [
      {
        title: "BY SILHOUETTE",
        items: [
          { label: "Explore All Handbags", href: "/shop" },
          { label: "Tote & Shopper Bags", href: "/category/tote-bags" },
          { label: "Shoulder Bags", href: "/category/shoulder-bags" },
          { label: "Crossbody Bags", href: "/category/crossbody-bags" },
          { label: "Top-Handle Bags", href: "/category/top-handle" },
          { label: "Mini & Evening Bags", href: "/category/mini-bags" },
        ],
      },
      {
        title: "LEATHER & CRAFT",
        items: [
          { label: "Full-Grain Tuscan Calfskin", href: "/#craft" },
          { label: "Smooth Saddle Leather", href: "/#craft" },
          { label: "Embossed Crocodile Finish", href: "/#craft" },
          { label: "Hand-Polished Italian Hardware", href: "/#craft" },
        ],
      },
    ],
    featuredCard: {
      title: "ARCHITECTURAL SILHOUETTES",
      subtitle: "Precision lines meet timeless Italian craftsmanship.",
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=85",
      href: "/shop",
      cta: "View Collection",
    },
  },
  {
    id: "nav-shoulder",
    label: "SHOULDER BAGS",
    href: "/category/shoulder-bags",
  },
  {
    id: "nav-crossbody",
    label: "CROSSBODY",
    href: "/category/crossbody-bags",
  },
  {
    id: "nav-totes",
    label: "TOTES",
    href: "/category/tote-bags",
  },
  {
    id: "nav-editorial",
    label: "ATELIER & CRAFT",
    href: "/#editorial",
    badge: "Florence",
  },
];

const SEARCH_SUGGESTIONS = [
  "FLORENCE TOTE",
  "SADDLE BAG",
  "MINI POCHETTE",
  "TUSCAN TAN",
  "NOIR BLACK",
  "CROSSBODY",
];

interface TopBarProps {
  initialNavCategories?: NavCategory[];
}

export function TopBar({ initialNavCategories }: TopBarProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount, openCart } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  const [topbarConfig, setTopbarConfig] = useState<TopBarConfig>({
    show_search: true,
    show_wishlist: true,
    show_cart: true,
    show_account: true,
    show_currency: true,
    currencies: ["INR ₹", "EUR €", "USD $", "GBP £"],
    default_currency: "INR ₹",
    concierge_phone: "+91 90160 47308",
    concierge_email: "concierge@dnora.it",
    is_sticky: true,
  });

  const [selectedCurrency, setSelectedCurrency] = useState("INR ₹");
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Authenticated User State
  const [user, setUser] = useState<{
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  } | null>(null);

  // Search overlay state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [navCategories, setNavCategories] = useState<NavCategory[]>(
    () => initialNavCategories || LUXURY_NAV_CATEGORIES
  );

  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initialNavCategories
  useEffect(() => {
    if (initialNavCategories && initialNavCategories.length > 0) {
      setNavCategories(initialNavCategories);
    }
  }, [initialNavCategories]);

  // Check user session
  const checkUserSession = async () => {
    try {
      const res = await fetch("/api/user/session");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    checkUserSession();
  }, [pathname]);

  // Fetch live topbar settings & dynamic navigation
  useEffect(() => {
    async function loadData() {
      try {
        const [configRes, navRes] = await Promise.all([
          fetch("/api/topbar-settings"),
          fetch("/api/navigation"),
        ]);

        if (configRes.ok) {
          const cfg = await configRes.json();
          if (cfg && cfg.id) {
            setTopbarConfig(cfg);
            if (cfg.default_currency) setSelectedCurrency(cfg.default_currency);
          }
        }

        if (navRes.ok) {
          const navData = await navRes.json();
          if (Array.isArray(navData) && navData.length > 0) {
            const transformed: NavCategory[] = navData.map((item: any) => ({
              id: item.id,
              label: item.label,
              href: item.href || "/shop",
              badge: item.badge,
              subcategories:
                item.submenus && item.submenus.length > 0
                  ? [
                      {
                        title: "EXPLORE EDITS",
                        items: item.submenus.map((s: any) => ({
                          label: s.label,
                          href: s.href,
                          badge: s.badge,
                        })),
                      },
                    ]
                  : undefined,
            }));
            setNavCategories(transformed);
          }
        }
      } catch (err) {
        console.error("TopBar data load error:", err);
      }
    }
    loadData();
  }, []);

  // Scroll detection for navbar blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-focus search input
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [searchOpen]);

  // Live search query debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products || []);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Close menus on page route changes
  useEffect(() => {
    setActiveMegaMenu(null);
    setMobileDrawerOpen(false);
    setSearchOpen(false);
    setAccountMenuOpen(false);
  }, [pathname]);

  const handleMegaMenuEnter = (id: string) => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setActiveMegaMenu(id);
  };

  const handleMegaMenuLeave = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 200);
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setAccountMenuOpen(false);
      router.push("/");
      router.refresh();
    }
  };

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/sys-diagnostics")) {
    return null;
  }

  const activeCategory = navCategories.find((c) => c.id === activeMegaMenu);

  return (
    <>
      {/* Top Bar Header with Integrated Navigation Bar */}
      <header
        className={`${topbarConfig.is_sticky ? "sticky top-0" : "relative"} z-40 w-full select-none transition-all duration-300 print:hidden ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.03)] border-b border-black/[0.06]"
            : "bg-white border-b border-neutral-200/60"
        }`}
      >
        <div className="max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 xl:px-12">
          {/* UPPER TIER: Menu / Search Trigger | Centered Brand Logo | Currency / Wishlist / Account / Bag */}
          <div className="relative flex items-center justify-between h-14 sm:h-16 md:h-[72px]">
            {/* LEFT: Menu Trigger & Search */}
            <div className="flex items-center gap-2 sm:gap-6">
              {/* Mobile Menu Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="md:hidden p-1.5 text-neutral-900 hover:text-black transition-colors cursor-pointer"
                aria-label="Open mobile menu"
              >
                <Menu className="w-5 h-5 stroke-[1.75]" />
              </button>

              {/* Search Trigger */}
              {topbarConfig.show_search && (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 p-1.5 sm:p-2 text-neutral-800 hover:text-black transition-colors cursor-pointer group"
                  aria-label="Search silhouettes"
                  title="Search"
                >
                  <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[1.75] group-hover:scale-105 transition-transform" />
                  <span className="hidden lg:inline text-[11px] font-semibold tracking-[0.18em] uppercase text-neutral-500 group-hover:text-black transition-colors">
                    Search
                  </span>
                </button>
              )}
            </div>

            {/* CENTER: DNORA Haute Couture Brand Logo */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
              <Link
                href="/"
                className="group inline-flex flex-col items-center justify-center transition-opacity hover:opacity-90"
              >
                <div className="relative h-8 w-36 sm:h-9 sm:w-44 md:h-10 md:w-52 transition-transform duration-300 group-hover:scale-[1.02]">
                  <Image
                    src="/images/logo.png"
                    alt="DNORA Luxury House"
                    fill
                    sizes="(max-width: 640px) 160px, (max-width: 768px) 190px, 220px"
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* RIGHT: Currency, Wishlist, Client Portal, Bag */}
            <div className="flex items-center gap-2 sm:gap-4 md:gap-5">
              {/* Currency Selector */}
              {topbarConfig.show_currency && (
                <div className="relative hidden xl:block">
                  <button
                    type="button"
                    onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                    className="flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase text-neutral-600 hover:text-black transition-colors py-1 cursor-pointer"
                  >
                    <span>{selectedCurrency}</span>
                    <ChevronDown className="w-3 h-3 text-neutral-400" />
                  </button>

                  {currencyDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-28 bg-white border border-neutral-200 shadow-xl py-1 z-50 rounded-xs animate-in fade-in zoom-in-95 duration-100">
                      {(topbarConfig.currencies || ["INR ₹", "EUR €", "USD $", "GBP £"]).map(
                        (curr) => (
                          <button
                            key={curr}
                            type="button"
                            onClick={() => {
                              setSelectedCurrency(curr);
                              setCurrencyDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold tracking-wider hover:bg-neutral-50 transition-colors ${
                              selectedCurrency === curr ? "text-black bg-neutral-100 font-bold" : "text-neutral-600"
                            }`}
                          >
                            {curr}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Wishlist Button */}
              {topbarConfig.show_wishlist && (
                <Link
                  href="/wishlist"
                  className="relative p-1.5 sm:p-2 text-neutral-800 hover:text-black transition-colors"
                  aria-label={`Wishlist (${wishlistCount} items)`}
                  title="Wishlist"
                >
                  <Heart className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[1.75]" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-neutral-900 text-white text-[8px] sm:text-[9px] font-bold rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User Account / Sign In Dropdown (Hidden on mobile topbar; available in mobile sidebar) */}
              {topbarConfig.show_account && (
                <div className="relative hidden md:block">
                  {user ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                        className="flex items-center gap-1.5 p-1.5 sm:p-2 text-neutral-800 hover:text-black transition-colors cursor-pointer group"
                        title={user.full_name || user.email}
                      >
                        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white text-[10px] font-serif uppercase flex items-center justify-center font-bold tracking-wider">
                          {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}
                        </div>
                        <span className="hidden lg:inline text-xs font-medium text-neutral-800 max-w-[80px] truncate">
                          {user.full_name ? user.full_name.split(" ")[0] : "Account"}
                        </span>
                        <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-black transition-colors hidden sm:inline" />
                      </button>

                      {/* Dropdown Menu */}
                      {accountMenuOpen && (
                        <div
                          className="absolute right-0 top-full mt-2 w-56 bg-white border border-neutral-200/80 shadow-2xl rounded-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                          onMouseLeave={() => setAccountMenuOpen(false)}
                        >
                          <div className="px-4 py-2 border-b border-neutral-100">
                            <p className="text-xs font-bold text-neutral-900 truncate">
                              {user.full_name || "Maison Member"}
                            </p>
                            <p className="text-[11px] text-neutral-500 font-mono truncate">
                              {user.email}
                            </p>
                          </div>

                          <div className="py-1">
                            <Link
                              href="/account?tab=orders"
                              onClick={() => setAccountMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors"
                            >
                              <Package className="w-3.5 h-3.5 text-neutral-400" />
                              <span>My Orders</span>
                            </Link>

                            <Link
                              href="/account?tab=addresses"
                              onClick={() => setAccountMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors"
                            >
                              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Saved Addresses</span>
                            </Link>

                            <Link
                              href="/account?tab=profile"
                              onClick={() => setAccountMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors"
                            >
                              <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Account Profile</span>
                            </Link>

                            {user.role === "admin" && (
                              <Link
                                href="/admin"
                                onClick={() => setAccountMenuOpen(false)}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>Admin Suite ↗</span>
                              </Link>
                            )}
                          </div>

                          <div className="border-t border-neutral-100 pt-1">
                            <button
                              type="button"
                              onClick={handleSignOut}
                              className="flex items-center gap-2 w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5 text-rose-500" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="p-1.5 sm:p-2 text-neutral-800 hover:text-black transition-colors flex items-center gap-1.5"
                      aria-label="Client Sign In"
                      title="Client Sign In"
                    >
                      <UserIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[1.75]" />
                      <span className="hidden lg:inline text-[11px] font-semibold tracking-[0.18em] uppercase text-neutral-500 hover:text-black transition-colors">
                        Sign In
                      </span>
                    </Link>
                  )}
                </div>
              )}

              {/* Shopping Bag Button */}
              {topbarConfig.show_cart && (
                <button
                  type="button"
                  onClick={openCart}
                  className="relative p-1.5 sm:p-2 text-neutral-900 hover:text-black transition-colors cursor-pointer"
                  aria-label={`Shopping Bag (${itemCount} items)`}
                  title="Shopping Bag"
                >
                  <ShoppingBag className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[1.75]" />
                  {itemCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-neutral-900 text-white text-[8px] sm:text-[9px] font-bold rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* LOWER TIER: Integrated Category Navigation Bar (Desktop) */}
          <nav
            className="hidden md:flex items-center justify-center border-t border-neutral-200/50 py-2.5"
            aria-label="Main Storefront Navigation"
          >
            <ul className="flex items-center gap-6 lg:gap-9">
              {navCategories.map((cat) => {
                const hasDropdown = !!(cat.subcategories && cat.subcategories.length > 0);
                const isActive = activeMegaMenu === cat.id;

                return (
                  <li
                    key={cat.id}
                    onMouseEnter={() => hasDropdown && handleMegaMenuEnter(cat.id)}
                    onMouseLeave={handleMegaMenuLeave}
                    className="relative"
                  >
                    <Link
                      href={cat.href}
                      className={`group relative inline-flex items-center gap-1.5 py-1 text-[11px] lg:text-[11.5px] font-semibold tracking-[0.18em] lg:tracking-[0.2em] uppercase transition-colors duration-200 ${
                        isActive
                          ? "text-black"
                          : "text-neutral-700 hover:text-black"
                      }`}
                    >
                      <span>{cat.label}</span>

                      {/* Optional micro badge */}
                      {cat.badge && (
                        <span className="text-[8px] tracking-wider uppercase font-bold px-1.5 py-0.2 bg-neutral-900 text-white rounded-full">
                          {cat.badge}
                        </span>
                      )}

                      {/* Active Indicator Underline */}
                      <span
                        className={`absolute bottom-0 left-0 w-full h-[1.5px] bg-neutral-950 transition-all duration-200 ${
                          isActive
                            ? "opacity-100 scale-x-100"
                            : "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100"
                        }`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Mega Menu Dropdown */}
        <TopBarMegaMenu
          category={activeCategory || null}
          onMouseEnter={() => activeCategory && handleMegaMenuEnter(activeCategory.id)}
          onMouseLeave={handleMegaMenuLeave}
          onClose={() => setActiveMegaMenu(null)}
        />
      </header>

      {/* Modular Search Modal */}
      <TopBarSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        suggestions={SEARCH_SUGGESTIONS}
        searchInputRef={searchInputRef}
      />

      {/* Modular Mobile Drawer */}
      <TopBarMobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onOpenSearch={() => {
          setMobileDrawerOpen(false);
          setSearchOpen(true);
        }}
        navCategories={navCategories}
        mobileAccordion={mobileAccordion}
        setMobileAccordion={setMobileAccordion}
        conciergePhone={topbarConfig.concierge_phone}
        conciergeEmail={topbarConfig.concierge_email}
        user={user}
        onSignOut={handleSignOut}
      />
    </>
  );
}

export default TopBar;
