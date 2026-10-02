"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  Heart,
  MapPin,
  User as UserIcon,
  LogOut,
  ShoppingBag,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowRight,
  Printer,
} from "lucide-react";
import { UserSession } from "@/lib/auth/user-session";
import { Order, UserAddress } from "@/types";
import { useWishlist } from "@/lib/store/wishlist-store";
import { useCart } from "@/lib/store/cart-store";
import InvoiceModal from "@/components/InvoiceModal";
import { formatPrice } from "@/lib/utils";

interface AccountPortalClientProps {
  user: UserSession;
  initialOrders: Order[];
  initialAddresses: UserAddress[];
}

export default function AccountPortalClient({
  user: initialUser,
  initialOrders,
  initialAddresses,
}: AccountPortalClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "orders";

  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "addresses" | "profile">(
    (currentTab as "orders" | "wishlist" | "addresses" | "profile") || "orders"
  );

  const [user, setUser] = useState(initialUser);
  const [orders] = useState<Order[]>(initialOrders);
  const [addresses, setAddresses] = useState<UserAddress[]>(initialAddresses);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<Order | null>(null);

  // Address modal states
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    full_name: user.full_name || "",
    phone: user.phone || "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "Gujarat",
    postal_code: "",
    country: "India",
    is_default: addresses.length === 0,
  });

  // Profile update states
  const [profileName, setProfileName] = useState(user.full_name || "");
  const [profilePhone, setProfilePhone] = useState(user.phone || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Wishlist and Cart Stores
  const { items: wishlistItems, removeItem: removeFromWishlist } = useWishlist();
  const { addItem: addToCart, openCart } = useCart();

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      window.location.href = "/";
    }
  };

  // Add Address Handler
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);

    if (!newAddress.full_name || !newAddress.phone || !newAddress.address_line1 || !newAddress.city || !newAddress.postal_code) {
      setAddressError("Please fill in all mandatory address fields.");
      return;
    }

    try {
      setAddressLoading(true);
      const res = await fetch("/api/account/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddressError(data.error || "Failed to save address.");
        return;
      }

      if (newAddress.is_default) {
        setAddresses((prev) => [
          data.address,
          ...prev.map((a) => ({ ...a, is_default: false })),
        ]);
      } else {
        setAddresses((prev) => [...prev, data.address]);
      }

      setAddressModalOpen(false);
      setNewAddress({
        full_name: user.full_name || "",
        phone: user.phone || "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "Gujarat",
        postal_code: "",
        country: "India",
        is_default: false,
      });
    } catch {
      setAddressError("Network error while creating address.");
    } finally {
      setAddressLoading(false);
    }
  };

  // Delete Address Handler
  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you wish to remove this delivery address?")) return;
    try {
      const res = await fetch(`/api/account/address/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Delete address error:", err);
    }
  };

  // Set Default Address Handler
  const handleSetDefaultAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/account/address/${id}`, { method: "PATCH" });
      if (res.ok) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            is_default: a.id === id,
          }))
        );
      }
    } catch (err) {
      console.error("Set default address error:", err);
    }
  };

  // Update Profile Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus(null);

    if (!profileName.trim()) {
      setProfileStatus({ type: "error", text: "Full name cannot be empty." });
      return;
    }

    try {
      setProfileLoading(true);
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profileName.trim(),
          phone: profilePhone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileStatus({ type: "error", text: data.error || "Failed to update profile." });
        return;
      }

      setUser((prev) => ({
        ...prev,
        full_name: profileName.trim(),
        phone: profilePhone.trim() || prev.phone,
      }));
      setProfileStatus({ type: "success", text: "Client profile successfully updated." });
    } catch {
      setProfileStatus({ type: "error", text: "Network error updating profile." });
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 xl:px-12 pt-8 sm:pt-12 print:hidden">
      {/* Top Welcome Card */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-xl sm:text-2xl font-serif uppercase tracking-widest shadow-md">
            {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                Maison DNORA Member
              </span>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-300 hover:bg-amber-500/20 transition-colors"
                >
                  Admin Portal ↗
                </Link>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900">
              Welcome, {user.full_name || user.email.split("@")[0]}
            </h1>
            <p className="text-xs text-neutral-500 font-sans">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-rose-50 hover:border-rose-200 text-xs font-bold uppercase tracking-wider text-rose-600 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Tabs Sidebar + Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* TAB NAVIGATION SIDEBAR */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-3 shadow-xs space-y-1 sticky top-24">
            <button
              type="button"
              onClick={() => {
                setActiveTab("orders");
                router.replace("/account?tab=orders", { scroll: false });
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "orders"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>Orders & Tracking</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === "orders" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("wishlist");
                router.replace("/account?tab=wishlist", { scroll: false });
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "wishlist"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4" />
                <span>Wishlist</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === "wishlist" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                {wishlistItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("addresses");
                router.replace("/account?tab=addresses", { scroll: false });
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "addresses"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>Delivery Addresses</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeTab === "addresses" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                {addresses.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("profile");
                router.replace("/account?tab=profile", { scroll: false });
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <UserIcon className="w-4 h-4" />
                <span>Profile Settings</span>
              </div>
            </button>
          </div>
        </div>

        {/* TAB CONTENT PANELS */}
        <div className="lg:col-span-9">
          {/* TAB 1: ORDERS & TRACKING */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-neutral-900">
                    Order History & Live Concierge Tracking
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    View full details, artisan status, and parcel progression for your luxury purchases.
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white border border-neutral-200/80 rounded-2xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                    <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-serif font-bold text-neutral-900">No Orders Placed Yet</h3>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Explore our Tuscan leather silhouettes, archival trunks, and handcrafted debuts.
                    </p>
                  </div>
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition"
                  >
                    <span>Discover Collection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;

                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition-all"
                      >
                        {/* Order Header Summary */}
                        <div className="p-5 sm:p-6 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-neutral-900 tracking-wider">
                                #{order.order_number}
                              </span>
                              <span
                                className={`text-[9.5px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                                  order.status === "delivered"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : order.status === "shipped"
                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400">
                              Placed on {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold block">
                                Total Amount
                              </span>
                              <span className="text-sm font-bold text-neutral-900 font-mono">
                                {formatPrice(order.total_amount)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setViewingInvoiceOrder(order)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-neutral-800 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl transition cursor-pointer shadow-2xs"
                                title="Instant View & Download PDF Invoice"
                              >
                                <Printer className="w-3.5 h-3.5 text-neutral-600" />
                                <span>Bill (PDF)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedOrder(isSelected ? null : order)}
                                className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition cursor-pointer"
                              >
                                {isSelected ? "Close Tracking" : "Track Order"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Tracking Stepper (Shown if selected or open) */}
                        {isSelected && (
                          <div className="bg-neutral-50/60 p-6 border-b border-neutral-100 animate-in fade-in duration-200">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-6">
                              Live Concierge Progression
                            </h4>
                            <div className="relative flex items-center justify-between max-w-xl mx-auto">
                              <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-0.5 bg-neutral-200 -z-0" />
                              <div
                                className="absolute top-1/2 -translate-y-1/2 left-4 h-0.5 bg-neutral-900 transition-all duration-500 -z-0"
                                style={{
                                  width:
                                    order.status === "delivered"
                                      ? "100%"
                                      : order.status === "shipped"
                                      ? "66%"
                                      : "33%",
                                }}
                              />

                              {/* Stepper points */}
                              <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                                  ✓
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900 mt-2">
                                  Confirmed
                                </span>
                              </div>

                              <div className="relative z-10 flex flex-col items-center text-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${order.status !== "processing" ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500"}`}>
                                  <Clock className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900 mt-2">
                                  Artisan Crafted
                                </span>
                              </div>

                              <div className="relative z-10 flex flex-col items-center text-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${order.status === "shipped" || order.status === "delivered" ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500"}`}>
                                  <Truck className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900 mt-2">
                                  Dispatched
                                </span>
                              </div>

                              <div className="relative z-10 flex flex-col items-center text-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${order.status === "delivered" ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-500"}`}>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900 mt-2">
                                  Delivered
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Order Items List */}
                        <div className="p-5 sm:p-6 divide-y divide-neutral-100">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="relative w-14 h-14 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200/50">
                                  {item.image_url ? (
                                    <Image
                                      src={item.image_url}
                                      alt={item.product_name}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <ShoppingBag className="w-5 h-5 text-neutral-400 absolute inset-0 m-auto" />
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">
                                    {item.product_name}
                                  </h4>
                                  <div className="text-[11px] text-neutral-500">
                                    Qty: {item.quantity} · {formatPrice(item.price)} each
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-bold text-neutral-900 font-mono">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WISHLIST */}
          {activeTab === "wishlist" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-serif font-bold text-neutral-900">
                  Private Salon Wishlist
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Handpicked architectural silhouettes and Italian leather goods saved to your account.
                </p>
              </div>

              {wishlistItems.length === 0 ? (
                <div className="bg-white border border-neutral-200/80 rounded-2xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-500">
                    <Heart className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-serif font-bold text-neutral-900">Your Wishlist is Empty</h3>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Save luxury silhouettes while exploring our catalog by tapping the heart icon.
                    </p>
                  </div>
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition"
                  >
                    <span>Browse Collection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {wishlistItems.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs group flex flex-col justify-between"
                    >
                      <div className="relative aspect-4/5 bg-neutral-100 overflow-hidden">
                        {prod.images?.[0]?.secure_url && (
                          <Image
                            src={prod.images[0].secure_url}
                            alt={prod.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(prod.id)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-rose-600 shadow-md transition cursor-pointer"
                          title="Remove from Wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">
                            {prod.name}
                          </h4>
                          <p className="text-xs font-bold text-neutral-900 mt-1 font-mono">
                            {formatPrice(prod.price)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            addToCart(prod, 1);
                            openCart();
                          }}
                          className="w-full py-2.5 px-3 bg-neutral-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Bag</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-neutral-900">
                    Saved Delivery Addresses
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Manage your residential and concierge delivery destinations.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAddressModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Address</span>
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="bg-white border border-neutral-200/80 rounded-2xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                    <MapPin className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-serif font-bold text-neutral-900">No Addresses Saved</h3>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Add a primary shipping address to expedite bespoke checkout.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Address</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`bg-white border rounded-2xl p-6 shadow-2xs relative flex flex-col justify-between ${
                        addr.is_default ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200/80"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-neutral-900">{addr.full_name}</h4>
                          {addr.is_default && (
                            <span className="text-[9.5px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-neutral-900 text-white">
                              Default
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-neutral-600 leading-relaxed">
                          {addr.address_line1}
                          {addr.address_line2 && <>, {addr.address_line2}</>}
                          <br />
                          {addr.city}, {addr.state} - {addr.postal_code}
                          <br />
                          {addr.country}
                        </p>

                        <p className="text-xs font-mono text-neutral-500 pt-1">
                          Phone: {addr.phone}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
                        {!addr.is_default ? (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-xs font-bold text-neutral-700 hover:text-black uppercase tracking-wider cursor-pointer"
                          >
                            Set as Default
                          </button>
                        ) : (
                          <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Primary Destination</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete Address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE SETTINGS */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-serif font-bold text-neutral-900">
                  Profile & Client Settings
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Update your contact details and view bespoke membership tier.
                </p>
              </div>

              {profileStatus && (
                <div
                  className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
                    profileStatus.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {profileStatus.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>{profileStatus.text}</span>
                </div>
              )}

              <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
                <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-lg">
                  <div>
                    <label className="block text-[10.5px] font-bold tracking-[0.16em] uppercase text-neutral-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold tracking-[0.16em] uppercase text-neutral-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full px-3.5 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs text-neutral-500 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Account email is verified and permanently linked to your purchases.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold tracking-[0.16em] uppercase text-neutral-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-neutral-900 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="py-3 px-6 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {profileLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Save Changes</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center gap-2 text-neutral-400 text-xs">
                  <ShieldCheck className="w-4 h-4 text-neutral-500" />
                  <span>Personal information is protected with industry-standard 256-bit encryption.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD ADDRESS MODAL */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h3 className="text-base font-serif font-bold text-neutral-900">
                Add Delivery Destination
              </h3>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addressError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.full_name}
                    onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Street Address (Line 1)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Apartment, suite, street"
                  value={newAddress.address_line1}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Apartment, Landmark (Line 2 - Optional)
                </label>
                <input
                  type="text"
                  value={newAddress.address_line2}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.postal_code}
                    onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={newAddress.is_default}
                  onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                  className="w-4 h-4 rounded-sm border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <label htmlFor="is_default" className="text-xs text-neutral-700">
                  Set as default delivery destination
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressLoading}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {addressLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Address</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant High-Resolution Invoice Modal */}
      <InvoiceModal
        order={viewingInvoiceOrder}
        onClose={() => setViewingInvoiceOrder(null)}
      />
    </div>
  );
}
