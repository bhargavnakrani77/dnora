"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  ChevronDown,
  ExternalLink,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  AlertTriangle,
  UserPlus,
  Tag,
} from "lucide-react";

interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Sales Report",
  "/admin/sales-report": "Sales Report",
  "/admin/orders": "Orders & Shipments",
  "/admin/items": "Products & Catalog",
  "/admin/categories": "Categories & Collections",
  "/admin/customers": "Customers",
  "/admin/coupons": "Discount & Coupons",
  "/admin/heroes": "Hero Banners",
  "/admin/announcements": "Announcement Bar",
  "/admin/trending-now": "Trending Now",
  "/admin/campaign-banner": "Campaign Banner",
  "/admin/navigation": "Navigation Menu",
  "/admin/topbar": "Header & Top Bar",
  "/admin/seen-on-you": "Seen On You (Reels)",
  "/admin/storefront-pages": "Storefront Pages",
  "/admin/storefront-pages/bestseller": "Storefront Pages: Best Sellers",
  "/admin/storefront-pages/new-in": "Storefront Pages: New In",
  "/admin/storefront-pages/trending-now": "Storefront Pages: Trending Now",
};

export function AdminHeader({ onOpenMobileSidebar }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<{
    id: string;
    type: "order" | "low_stock" | "new_customer" | "coupon_expiry";
    title: string;
    description: string;
    timeAgo: string;
    link: string;
  }[]>([]);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("/api/admin/notifications");
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.notifications)) {
            setNotifications(json.notifications);
          }
        }
      } catch {
        // ignore
      }
    }
    loadNotifications();
  }, []);

  const currentTitle = PAGE_TITLES[pathname] || "Sales Report";

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

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-neutral-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-1.5 rounded-lg text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
          aria-label="Toggle navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
          {currentTitle}
        </h1>
      </div>

      {/* Right: Notifications, Avatar, Admin Dropdown */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell with Red Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserDropdownOpen(false);
            }}
            className="p-2 rounded-full text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors relative cursor-pointer"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {/* Red Notification Dot with Count */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* Notifications Dropdown Popup */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 p-2 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-2 border-b border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">Notifications</span>
                {notifications.length > 0 && (
                  <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                    {notifications.length} Active
                  </span>
                )}
              </div>
              <div className="divide-y divide-neutral-100 text-xs py-1 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-neutral-400 text-xs">
                    No new alerts or pending notices
                  </div>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setNotificationsOpen(false)}
                      className="block p-2.5 hover:bg-neutral-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <p className="font-semibold text-neutral-900 flex items-center gap-1.5">
                        {n.type === "order" ? (
                          <ShoppingBag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        ) : n.type === "low_stock" ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : n.type === "new_customer" ? (
                          <UserPlus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        )}
                        <span className="truncate">{n.title}</span>
                      </p>
                      <p className="text-neutral-500 text-[11px] mt-0.5 line-clamp-2">
                        {n.description}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-1 font-mono">
                        {n.timeAgo}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Circle "A" and Admin Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 py-1 pl-1 pr-2 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            {/* Dark Circle with white letter 'A' */}
            <div className="w-8 h-8 rounded-full bg-[#111827] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-2xs">
              A
            </div>
            <span className="text-xs font-semibold text-neutral-800 hidden sm:inline-block">
              Admin
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {/* Admin User Menu Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 z-50 animate-in fade-in duration-150 text-xs">
              <div className="px-3.5 py-2 border-b border-neutral-100">
                <p className="font-semibold text-neutral-900">Administrator</p>
                <p className="text-[11px] text-neutral-500 font-mono">admin@dnoralifestyle.com</p>
              </div>

              <div className="p-1 space-y-0.5">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-700 hover:text-black hover:bg-neutral-100 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                  <span>View Live Storefront</span>
                </Link>

                <div className="px-3 py-1.5 flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold bg-emerald-50 rounded-lg mx-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Authenticated Session</span>
                </div>
              </div>

              <div className="pt-1 mt-1 border-t border-neutral-100 p-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
