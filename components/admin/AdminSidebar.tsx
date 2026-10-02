"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Tag,
  Boxes,
  Package,
  Users,
  Megaphone,
  Sliders,
  Compass,
  ImageIcon,
  Sparkles,
  LayoutList,
  Layers,
  Video,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  X,
  BarChart3,
  Truck,
  Globe,
  Flame,
  Clock,
} from "lucide-react";

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavSubItem {
  label: string;
  href: string;
  icon?: React.ElementType;
  badge?: string;
}

interface NavGroupItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  badge?: string;
  subitems?: NavSubItem[];
}

const NAV_GROUPS: NavGroupItem[] = [
  // 1. Dashboard
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },

  // 2. Items & Stock (/all item /new item /categories /stock)
  {
    id: "items-stock",
    label: "Items & Stock",
    icon: ShoppingBag,
    subitems: [
      {
        label: "All Items",
        href: "/admin/items",
        icon: ShoppingBag,
        badge: "Catalog",
      },
      {
        label: "Add New Item",
        href: "/admin/products/new",
        icon: PlusCircle,
        badge: "New",
      },
      {
        label: "Categories",
        href: "/admin/categories",
        icon: Tag,
        badge: "Live",
      },
      {
        label: "Stock Management",
        href: "/admin/stock",
        icon: Boxes,
        badge: "Inventory",
      },
    ],
  },

  // 3. Orders & Customers (/all orders /all customers /shipping charge /sales report)
  {
    id: "orders-customers",
    label: "Orders & Customers",
    icon: Package,
    subitems: [
      {
        label: "All Orders",
        href: "/admin/orders",
        icon: Package,
        badge: "Live",
      },
      {
        label: "All Customers",
        href: "/admin/customers",
        icon: Users,
        badge: "CRM",
      },
      {
        label: "Shipping Charges",
        href: "/admin/shipping",
        icon: Truck,
        badge: "Live",
      },
      {
        label: "Sales Report",
        href: "/admin/sales-report",
        icon: BarChart3,
        badge: "Report",
      },
    ],
  },

  // 4. Storefront Content (Sorted in top-to-bottom storefront sequence)
  {
    id: "storefront",
    label: "Storefront Content",
    icon: Layers,
    subitems: [
      {
        label: "Announcement Bar",
        href: "/admin/announcements",
        icon: Megaphone,
        badge: "Top",
      },
      {
        label: "Header & Top Bar",
        href: "/admin/topbar",
        icon: Sliders,
      },
      {
        label: "Navigation Menu",
        href: "/admin/navigation",
        icon: Compass,
      },
      {
        label: "Hero Banners",
        href: "/admin/heroes",
        icon: ImageIcon,
        badge: "Main",
      },
      {
        label: "Trending Now",
        href: "/admin/trending-now",
        icon: Sparkles,
        badge: "Lookbook",
      },
      {
        label: "Home Sections",
        href: "/admin/sections",
        icon: LayoutList,
      },
      {
        label: "Campaign Banner",
        href: "/admin/campaign-banner",
        icon: Layers,
      },
      {
        label: "Seen On You (Reels)",
        href: "/admin/seen-on-you",
        icon: Video,
        badge: "Video",
      },
    ],
  },

  // 5. Storefront Pages (/bestseller /new in /trending now with full edit options)
  {
    id: "storefront-pages",
    label: "Storefront Pages",
    icon: Globe,
    subitems: [
      {
        label: "Best Sellers",
        href: "/admin/storefront-pages/bestseller",
        icon: Flame,
        badge: "Hot",
      },
      {
        label: "New In",
        href: "/admin/storefront-pages/new-in",
        icon: Clock,
        badge: "New",
      },
      {
        label: "Trending Now",
        href: "/admin/storefront-pages/trending-now",
        icon: Sparkles,
        badge: "Lookbook",
      },
    ],
  },
];

export function AdminSidebar({
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Submenus are CLOSED by default. Only open when user clicks on a parent menu!
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Real-time live customer count on storefront
  const [liveVisitorCount, setLiveVisitorCount] = useState<number>(0);

  const fetchLiveVisitors = async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    try {
      const res = await fetch("/api/admin/live-visitors");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.count === "number") {
          setLiveVisitorCount(data.count);
        }
      }
    } catch {
      // network resilience
    }
  };

  useEffect(() => {
    fetchLiveVisitors();
    const interval = setInterval(fetchLiveVisitors, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchLiveVisitors();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const isChildActive = NAV_GROUPS.find((g) => g.id === groupId)?.subitems?.some(
        (sub) => pathname === sub.href || (sub.href !== "/admin" && pathname.startsWith(sub.href))
      ) ?? false;
      const current = prev[groupId] ?? isChildActive;
      return {
        ...prev,
        [groupId]: !current,
      };
    });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/admin-logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  const renderSidebarContent = (isMobile: boolean = false) => {
    const isCollapsed = isMobile ? false : collapsed;

    return (
      <div className="flex flex-col h-full bg-[#090D16] text-white border-r border-white/10 select-none overflow-hidden">
        {/* Brand Header */}
        <div
          className={`flex items-center h-16 border-b border-white/10 shrink-0 transition-[padding] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
            isCollapsed ? "justify-center px-0" : "justify-between px-4"
          }`}
        >
          <Link
            href="/admin"
            onClick={() => {
              if (isMobile) {
                onCloseMobile();
              } else if (collapsed) {
                onToggleCollapse();
              }
            }}
            className="flex items-center gap-3 overflow-hidden group cursor-pointer"
            title="DNORA Dashboard"
          >
            {/* Brand "D" Icon with live count badge when collapsed on desktop */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md border border-white/10 bg-black flex items-center justify-center transition-transform group-hover:scale-105">
                <Image
                  src="/images/logo/dnora-d-icon.png"
                  alt="DNORA"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              {isCollapsed && (
                <span
                  className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-emerald-950 border border-emerald-400 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs z-10"
                  title={`${liveVisitorCount} Live Customers Online`}
                >
                  {liveVisitorCount}
                </span>
              )}
            </div>

            {/* Title with smooth width/opacity transition (no DOM unmount) */}
            <div
              className={`flex flex-col min-w-0 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] overflow-hidden whitespace-nowrap ${
                isCollapsed
                  ? "opacity-0 max-w-0 pointer-events-none scale-95"
                  : "opacity-100 max-w-[140px] scale-100"
              }`}
            >
              <span className="font-bold text-sm tracking-[0.2em] uppercase text-white leading-tight">
                DNORA
              </span>
              <span className="text-[10px] text-white/50 tracking-widest uppercase">
                Executive Suite
              </span>
            </div>
          </Link>

          {/* Top-Right Header Actions (Live Counter & Mobile Close) */}
          <div
            className={`flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] overflow-hidden ${
              isCollapsed
                ? "opacity-0 max-w-0 pointer-events-none"
                : "opacity-100 max-w-[100px]"
            }`}
          >
            {/* Top-Right Live Customer Round Badge */}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fetchLiveVisitors();
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 shadow-xs cursor-pointer select-none hover:border-emerald-400 hover:bg-emerald-900/50 transition-all shrink-0"
              title={`${liveVisitorCount} Live Customer Device${liveVisitorCount === 1 ? "" : "s"} on Storefront (Click to refresh)`}
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
              </span>
              <span className="font-mono font-bold text-xs text-white leading-none">
                {liveVisitorCount}
              </span>
            </div>

            {/* Mobile close button */}
            {isMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Groups with Menus & Submenus */}
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1.5 scrollbar-none transition-[padding] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
            isCollapsed ? "px-2.5" : "px-3"
          }`}
        >
          {NAV_GROUPS.map((group) => {
            const Icon = group.icon;
            const isChildActive = group.subitems?.some(
              (sub) => pathname === sub.href || (sub.href !== "/admin" && pathname.startsWith(sub.href))
            ) ?? false;
            const isGroupOpen = expandedGroups[group.id] ?? isChildActive;

            // Case 1: Standalone item (e.g. Dashboard)
            if (!group.subitems || group.subitems.length === 0) {
              const isActive = pathname === group.href;

              return (
                <div key={group.id} className="w-full">
                  <Link
                    href={group.href || "/admin"}
                    onClick={() => {
                      if (isMobile) onCloseMobile();
                    }}
                    title={isCollapsed ? group.label : undefined}
                    className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer overflow-hidden ${
                      isCollapsed
                        ? "justify-center h-11 px-0"
                        : "gap-3 px-3 py-2.5 h-10"
                    } ${
                      isActive
                        ? "bg-white text-black shadow-md font-bold"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-black" : "text-white/70"}`} />

                    <div
                      className={`flex items-center justify-between min-w-0 flex-1 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] overflow-hidden whitespace-nowrap ${
                        isCollapsed
                          ? "opacity-0 max-w-0 pointer-events-none scale-95"
                          : "opacity-100 max-w-[180px] scale-100"
                      }`}
                    >
                      <span className="truncate">{group.label}</span>
                      {group.badge && (
                        <span
                          className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isActive
                              ? "bg-black/10 text-black"
                              : "bg-white/10 text-white/70"
                          }`}
                        >
                          {group.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            }

            // Case 2: Group with Submenus (Clicking toggles accordion smoothly)
            return (
              <div key={group.id} className="w-full space-y-0.5">
                {/* Parent Group Header Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isCollapsed) {
                      onToggleCollapse();
                      setExpandedGroups((prev) => ({ ...prev, [group.id]: true }));
                    } else {
                      toggleGroup(group.id);
                    }
                  }}
                  title={isCollapsed ? group.label : undefined}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer overflow-hidden ${
                    isCollapsed
                      ? "justify-center h-11 px-0"
                      : "gap-3 px-3 py-2.5 h-10"
                  } ${
                    isChildActive
                      ? "text-white font-bold bg-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 opacity-80" />

                  <div
                    className={`flex items-center justify-between min-w-0 flex-1 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] overflow-hidden whitespace-nowrap ${
                      isCollapsed
                        ? "opacity-0 max-w-0 pointer-events-none scale-95"
                        : "opacity-100 max-w-[180px] scale-100"
                    }`}
                  >
                    <span className="truncate">{group.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 shrink-0 ml-1.5 ${
                        isGroupOpen ? "rotate-180 opacity-100" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Submenu Items with silky smooth grid-template-rows accordion */}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                    !isCollapsed && isGroupOpen
                      ? "grid-rows-[1fr] opacity-100 mt-1"
                      : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
                  }`}
                >
                  <div className="overflow-hidden pl-3 space-y-1">
                    {group.subitems.map((sub) => {
                      const isSubActive =
                        pathname === sub.href ||
                        (sub.href !== "/admin" && pathname.startsWith(sub.href));
                      const SubIcon = sub.icon || Icon;

                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => {
                            if (isMobile) onCloseMobile();
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-150 ${
                            isSubActive
                              ? "bg-white text-black shadow-xs font-semibold"
                              : "text-white/70 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <SubIcon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSubActive ? "text-black" : "text-white/50"
                            }`}
                          />
                          <span className="flex-1 truncate">{sub.label}</span>
                          {sub.badge && (
                            <span
                              className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                isSubActive
                                  ? "bg-black/10 text-black"
                                  : "bg-white/10 text-white/70"
                              }`}
                            >
                              {sub.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Footer Actions */}
        <div
          className={`border-t border-white/10 space-y-1 shrink-0 transition-[padding] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
            isCollapsed ? "p-2" : "p-3"
          }`}
        >
          {/* Live Storefront Link */}
          <Link
            href="/"
            target="_blank"
            onClick={() => {
              if (isMobile) onCloseMobile();
            }}
            title={isCollapsed ? "Live Storefront" : undefined}
            className={`w-full flex items-center rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 overflow-hidden ${
              isCollapsed ? "justify-center h-11 px-0" : "gap-2.5 px-3 py-2 h-10"
            }`}
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-white/60" />
            <span
              className={`truncate transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] overflow-hidden whitespace-nowrap ${
                isCollapsed
                  ? "opacity-0 max-w-0 pointer-events-none scale-95"
                  : "opacity-100 max-w-[180px] scale-100"
              }`}
            >
              Live Storefront
            </span>
          </Link>

          {/* Sign Out */}
          <button
            type="button"
            onClick={() => {
              if (isMobile) onCloseMobile();
              handleLogout();
            }}
            title={isCollapsed ? "Sign Out" : undefined}
            className={`w-full flex items-center rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer overflow-hidden ${
              isCollapsed ? "justify-center h-11 px-0" : "gap-2.5 px-3 py-2 h-10"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span
              className={`truncate transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] overflow-hidden whitespace-nowrap ${
                isCollapsed
                  ? "opacity-0 max-w-0 pointer-events-none scale-95"
                  : "opacity-100 max-w-[180px] scale-100"
              }`}
            >
              Sign Out
            </span>
          </button>

          {/* Desktop Collapse Toggle */}
          {!isMobile && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`hidden md:flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer ${
                isCollapsed ? "w-11 h-11 mx-auto" : "w-full p-2"
              }`}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronLeft className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sticky Sidebar - Smooth Hardware Accelerated Width Transition */}
      <aside
        className={`hidden md:block fixed inset-y-0 left-0 z-30 transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] will-change-[width] overflow-hidden ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer Overlay - Smooth Slide-In & Slide-Out */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
          mobileOpen ? "visible pointer-events-auto" : "invisible pointer-events-none delay-300"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 ease-out cursor-pointer ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onCloseMobile}
          aria-hidden="true"
        />

        {/* Sliding Drawer Container */}
        <div
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] will-change-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {renderSidebarContent(true)}
        </div>
      </div>
    </>
  );
}

export default AdminSidebar;
