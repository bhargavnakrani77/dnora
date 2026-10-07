"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Truck,
  CreditCard,
  MapPin,
  ShoppingBag,
  Sparkles,
  Loader2,
  Plus,
  QrCode,
  Smartphone,
  Building2,
  Banknote,
  Check,
} from "lucide-react";
import { useCart } from "@/lib/store/cart-store";
import { formatPrice } from "@/lib/utils";

interface SavedAddress {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface CheckoutUser {
  id?: string;
  email?: string;
  full_name?: string;
  phone?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  // Auth & Saved Addresses
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentUser, setCurrentUser] = useState<CheckoutUser | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  // Step 1: Address form fields (IN EXACT SEQUENCE REQUESTED: Name -> Phone -> Address -> Landmark -> Pincode -> City & State)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeSuccess, setPincodeSuccess] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Step 2: Shipping method
  const [shippingMethod, setShippingMethod] = useState<"complimentary" | "vip">("complimentary");

  // Live Shipping Configuration from Admin
  const [shippingConfig, setShippingConfig] = useState<{
    standard_fee: number;
    standard_free_threshold: number;
    express_fee: number;
    cod_fee: number;
    is_cod_allowed: boolean;
  }>({
    standard_fee: 0,
    standard_free_threshold: 999,
    express_fee: 150,
    cod_fee: 0,
    is_cod_allowed: true,
  });

  // Confirmed Order Celebration Modal State
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    totalAmount: number;
    customerName: string;
    city: string;
  } | null>(null);

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking" | "cod">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  // Flow & Submission state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const [orderError, setOrderError] = useState("");

  // Apply a saved address to form
  const applySavedAddress = useCallback((addr: SavedAddress) => {
    setFullName(addr.full_name);
    setPhone(addr.phone);
    setAddressLine1(addr.address_line1);
    setAddressLine2(addr.address_line2 || "");
    setPostalCode(addr.postal_code);
    setCity(addr.city);
    setState(addr.state);
    setCountry(addr.country || "India");
    setPincodeSuccess(true);
  }, []);

  // Check auth and fetch saved addresses
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoadingUser(true);
        const res = await fetch("/api/user/addresses");
        const data = await res.json();

        if (!data.authenticated) {
          router.replace("/login?redirect=/checkout");
          return;
        }

        setCurrentUser(data.user);
        setEmail(data.user.email || "");
        setFullName(data.user.full_name || "");
        setPhone(data.user.phone || "");

        if (data.addresses && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          setAddressMode("saved");
          const defaultAddr = data.addresses.find((a: SavedAddress) => a.is_default) || data.addresses[0];
          setSelectedAddressId(defaultAddr.id);
          applySavedAddress(defaultAddr);
        } else {
          setAddressMode("new");
        }
      } catch (err) {
        console.error("Failed to load user info:", err);
      } finally {
        setLoadingUser(false);
      }
    }

    loadUserData();
  }, [router, applySavedAddress]);

  // Load Live Admin Shipping Settings
  useEffect(() => {
    async function loadShippingRules() {
      try {
        const res = await fetch("/api/shipping-settings");
        if (res.ok) {
          const cfg = await res.json();
          setShippingConfig({
            standard_fee: Number(cfg.standard_fee ?? 0),
            standard_free_threshold: Number(cfg.standard_free_threshold ?? 999),
            express_fee: Number(cfg.express_fee ?? 150),
            cod_fee: Number(cfg.cod_fee ?? 0),
            is_cod_allowed: Boolean(cfg.is_cod_allowed ?? true),
          });
        }
      } catch (err) {
        console.error("Failed to load shipping settings:", err);
      }
    }
    loadShippingRules();
  }, []);

  // Indian Postal PIN Code API integration
  const handlePincodeChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setPostalCode(cleaned);
    setPincodeSuccess(false);

    if (cleaned.length === 6) {
      try {
        setPincodeLoading(true);
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
        const data = await res.json();

        if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          const foundCity = po.District || po.Division || po.Block || po.Name;
          const foundState = po.State;
          if (foundCity) setCity(foundCity);
          if (foundState) setState(foundState);
          setPincodeSuccess(true);
          setAddressError("");
        }
      } catch (err) {
        console.error("Failed to fetch postal pincode details:", err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // Step 1 Validation & Proceed
  const handleProceedToStep2 = async () => {
    setAddressError("");
    if (!fullName.trim()) {
      setAddressError("Please enter your full name.");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setAddressError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!addressLine1.trim()) {
      setAddressError("Please enter your street address / flat / building.");
      return;
    }
    if (!postalCode.trim() || postalCode.length !== 6) {
      setAddressError("Please enter a valid 6-digit postal PIN code.");
      return;
    }
    if (!city.trim() || !state.trim()) {
      setAddressError("Please enter your city and state.");
      return;
    }

    // Auto-save new address to profile for future checkouts
    if (addressMode === "new" && saveToProfile && currentUser) {
      try {
        await fetch("/api/user/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            phone,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
            isDefault: savedAddresses.length === 0,
          }),
        });
      } catch {
        // Non-blocking
      }
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 2 Proceed
  const handleProceedToStep3 = () => {
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Dynamic live shipping calculation based on Admin Rules:
  const isStandardFree = subtotal >= shippingConfig.standard_free_threshold || shippingConfig.standard_fee === 0;
  const activeStandardRate = isStandardFree ? 0 : shippingConfig.standard_fee;
  const activeExpressRate = shippingConfig.express_fee;
  const activeCodFee = paymentMethod === "cod" ? (shippingConfig.cod_fee || 0) : 0;
  const baseShippingRate = shippingMethod === "vip" ? activeExpressRate : activeStandardRate;
  const shippingCost = baseShippingRate + activeCodFee;
  const grandTotal = subtotal + shippingCost;

  // Step 3 Fast/Instant Payment & Place Order (No artificial delays & double-click protected)
  const handlePlaceOrder = async () => {
    if (isProcessingRef.current || isProcessing) return;
    isProcessingRef.current = true;
    setOrderError("");
    setIsProcessing(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout to prevent infinite spinner

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          customerName: fullName,
          customerEmail: email || currentUser?.email,
          customerPhone: phone,
          shippingAddress: {
            fullName,
            phone,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
          },
          items,
          paymentMethod,
          shippingCost,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order.");
      }

      // Clear the local cart
      clearCart();

      // Show immediate celebration modal with smooth animation and instant confirmation
      setConfirmedOrder({
        orderNumber: data.order.order_number,
        totalAmount: data.order.total_amount || grandTotal,
        customerName: fullName,
        city: city,
      });

      // Smooth transition to /order-success/[order_number] after celebratory animation begins
      setTimeout(() => {
        router.push(`/order-success/${data.order.order_number}`);
      }, 1800);
    } catch (err: unknown) {
      console.error("Payment error:", err);
      if (err instanceof DOMException && err.name === "AbortError") {
        setOrderError("The order request timed out. Please check your network connection and try again.");
      } else {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
        setOrderError(msg);
      }
      setIsProcessing(false);
      isProcessingRef.current = false;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-neutral-900 animate-spin mb-4" />
        <p className="text-xs uppercase tracking-[0.2em] font-medium text-neutral-600">
          Loading Secure Checkout...
        </p>
      </div>
    );
  }

  if (items.length === 0 && !isProcessing) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-200/60 flex items-center justify-center mb-4">
          <ShoppingBag className="w-7 h-7 text-neutral-500" />
        </div>
        <h1 className="text-xl sm:text-2xl font-serif text-neutral-900 mb-2">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-xs text-neutral-500 max-w-sm mb-6 font-light">
          Explore our handcrafted Florentine silhouettes and add items to your bag before proceeding to checkout.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all rounded-xs"
        >
          <span>Discover Collection</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 pb-20">
      {/* Top Luxury Checkout Bar */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-block">
            <div className="relative h-7 w-36 sm:h-8 sm:w-40">
              <Image
                src="/images/logo.png"
                alt="DNORA"
                fill
                sizes="180px"
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium tracking-wide">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">256-Bit Encrypted</span>
            <span className="text-neutral-300">|</span>
            <span>Maison Concierge</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Step Indicator Progress Header */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto text-center">
            {/* Step 1 */}
            <div
              className={`pb-2 border-b-2 transition-all ${
                currentStep >= 1 ? "border-neutral-950 text-neutral-950" : "border-neutral-200 text-neutral-400"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <span
                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    currentStep > 1
                      ? "bg-neutral-950 text-white"
                      : currentStep === 1
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {currentStep > 1 ? <Check className="w-3 h-3" /> : "1"}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                  Address
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`pb-2 border-b-2 transition-all ${
                currentStep >= 2 ? "border-neutral-950 text-neutral-950" : "border-neutral-200 text-neutral-400"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <span
                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    currentStep > 2
                      ? "bg-neutral-950 text-white"
                      : currentStep === 2
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {currentStep > 2 ? <Check className="w-3 h-3" /> : "2"}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                  Review
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`pb-2 border-b-2 transition-all ${
                currentStep === 3 ? "border-neutral-950 text-neutral-950" : "border-neutral-200 text-neutral-400"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <span
                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    currentStep === 3 ? "bg-neutral-950 text-white" : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  3
                </span>
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                  Payment
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Interaction Area (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: DELIVERY ADDRESS */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-5 h-5 text-neutral-900" />
                    <h2 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-neutral-900">
                      Step 1: Delivery Address
                    </h2>
                  </div>
                  <span className="text-xs text-neutral-500 font-light">
                    Recipient: <strong className="font-medium text-neutral-900">{currentUser?.email}</strong>
                  </span>
                </div>

                {/* Clear Option to choose between Saved Address OR New Address */}
                {savedAddresses.length > 0 && (
                  <div className="flex items-center gap-2 p-1.5 bg-neutral-100/90 rounded-xl mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setAddressMode("saved");
                        const defaultAddr = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
                        setSelectedAddressId(defaultAddr.id);
                        applySavedAddress(defaultAddr);
                      }}
                      className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        addressMode === "saved"
                          ? "bg-white text-neutral-950 shadow-xs"
                          : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      Use Saved Address ({savedAddresses.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddressMode("new");
                        setSelectedAddressId("new");
                        setFullName(currentUser?.full_name || "");
                        setPhone(currentUser?.phone || "");
                        setAddressLine1("");
                        setAddressLine2("");
                        setPostalCode("");
                        setCity("");
                        setState("");
                        setPincodeSuccess(false);
                      }}
                      className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        addressMode === "new"
                          ? "bg-white text-neutral-950 shadow-xs"
                          : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      + Deliver to New Address
                    </button>
                  </div>
                )}

                {/* MODE A: SELECT FROM SAVED ADDRESSES */}
                {savedAddresses.length > 0 && addressMode === "saved" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            applySavedAddress(addr);
                          }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? "border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950"
                              : "border-neutral-200 hover:border-neutral-400 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-neutral-900 truncate">
                              {addr.full_name}
                            </span>
                            {addr.is_default && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-xs bg-neutral-200 text-neutral-700 font-semibold">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-600 line-clamp-2 font-light">
                            {addr.address_line1}, {addr.address_line2 ? `${addr.address_line2}, ` : ""}{addr.city}, {addr.state} - {addr.postal_code}
                          </p>
                          <p className="text-[11px] text-neutral-500 mt-2 font-mono">
                            Ph: {addr.phone}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleProceedToStep2}
                        className="w-full py-3.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
                      >
                        <span>Deliver to This Address →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* MODE B: NEW ADDRESS FORM (IN EXACT SEQUENCE REQUESTED: Name -> Number -> Address -> Landmark -> Pincode -> City & State) */}
                {(savedAddresses.length === 0 || addressMode === "new") && (
                  <div className="space-y-4">
                    {/* 1. Name */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1 uppercase tracking-wider">
                        1. Full Name *
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Elena Rossi"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 bg-white"
                      />
                    </div>

                    {/* 2. Number */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1 uppercase tracking-wider">
                        2. Mobile Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 bg-white font-mono"
                      />
                    </div>

                    {/* 3. Address */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1 uppercase tracking-wider">
                        3. Delivery Address (House / Flat / Street) *
                      </label>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="e.g. Flat 402, Royal Palms, Opp. Heritage Park"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 bg-white"
                      />
                    </div>

                    {/* 4. Landmark */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1 uppercase tracking-wider">
                        4. Landmark / Area (Optional)
                      </label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="e.g. Near West Avenue Circle"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 bg-white"
                      />
                    </div>

                    {/* 5. Postal PIN Code */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1 uppercase tracking-wider flex items-center justify-between">
                        <span>5. Postal PIN Code (India) *</span>
                        {pincodeLoading && (
                          <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-normal">
                            <Loader2 className="w-3 h-3 animate-spin" /> Fetching location...
                          </span>
                        )}
                        {pincodeSuccess && (
                          <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> State & City Identified
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          maxLength={6}
                          placeholder="e.g. 395006 or 110001"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 bg-white font-mono tracking-wider"
                        />
                        {pincodeSuccess && (
                          <div className="absolute right-3 top-2.5 text-emerald-600">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500 mt-1 font-light">
                        Type 6-digit PIN code to automatically detect City and State.
                      </p>
                    </div>

                    {/* 6. State & City (Pre-populated by PIN code) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1 uppercase tracking-wider">
                          City / District *
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1 uppercase tracking-wider">
                          State *
                        </label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="State"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 bg-white"
                        />
                      </div>
                    </div>

                    {/* Auto-save to profile checkbox */}
                    <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveToProfile}
                        onChange={(e) => setSaveToProfile(e.target.checked)}
                        className="w-4 h-4 rounded-xs border-neutral-300 text-neutral-900 focus:ring-neutral-950"
                      />
                      <span className="text-xs text-neutral-700 font-light">
                        Auto-save this address to my DNORA profile for all future orders
                      </span>
                    </label>

                    {addressError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                        {addressError}
                      </div>
                    )}

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleProceedToStep2}
                        className="w-full py-3.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
                      >
                        <span>Continue to Order Review</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: REVIEW & SHIPPING METHOD */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-5 h-5 text-neutral-900" />
                    <h2 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-neutral-900">
                      Step 2: Shipping & Review
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-neutral-600 hover:text-neutral-950 underline font-medium cursor-pointer"
                  >
                    Edit Address
                  </button>
                </div>

                {/* Selected Address Summary Card */}
                <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900">{fullName}</span>
                    <span className="text-neutral-500 font-mono text-[11px]">{phone}</span>
                  </div>
                  <p className="text-neutral-600 font-light">
                    {addressLine1}, {addressLine2 ? `${addressLine2}, ` : ""}{city}, {state} - {postalCode}, {country}
                  </p>
                </div>

                {/* Shipping Method Options */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                    Select Delivery Experience
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Standard / Complimentary */}
                    <div
                      onClick={() => setShippingMethod("complimentary")}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        shippingMethod === "complimentary"
                          ? "border-neutral-950 bg-neutral-50/80 ring-1 ring-neutral-950"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-neutral-900">Standard Express Courier</span>
                        <span
                          className={`text-xs font-semibold uppercase ${
                            isStandardFree ? "text-emerald-600" : "text-neutral-900 font-mono"
                          }`}
                        >
                          {isStandardFree ? "FREE" : formatPrice(activeStandardRate)}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light">
                        {isStandardFree
                          ? `Complimentary insured delivery (Eligible over ₹${shippingConfig.standard_free_threshold}).`
                          : `Fast express tracked dispatch (3-5 business days).`}
                      </p>
                    </div>

                    {/* VIP Courier */}
                    <div
                      onClick={() => setShippingMethod("vip")}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        shippingMethod === "vip"
                          ? "border-neutral-950 bg-neutral-50/80 ring-1 ring-neutral-950"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-neutral-900">VIP White-Glove Air</span>
                        <span className="text-xs font-semibold text-neutral-900 font-mono">
                          {formatPrice(activeExpressRate)}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light">
                        Priority express air courier dispatch with dedicated white-glove luxury packaging.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                    Items in Shipment ({items.length})
                  </p>
                  <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto pr-2">
                    {items.map((item, idx) => (
                      <div key={`${item.product.id}-${idx}`} className="py-3 flex items-center gap-3">
                        <div className="relative w-14 h-16 rounded-md overflow-hidden bg-white shrink-0 border border-neutral-200/60">
                          <Image
                            src={item.product.images?.[0]?.secure_url || "/images/placeholder.jpg"}
                            alt={item.product.name}
                            fill
                            className="object-contain p-0.5"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-neutral-900 truncate">
                            {item.product.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                            {item.selectedColor && (
                              <span>Color: {item.selectedColor}</span>
                            )}
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-neutral-900">
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="py-3.5 px-5 border border-neutral-300 text-neutral-700 text-xs font-semibold uppercase tracking-wider rounded-xs hover:bg-neutral-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToStep3}
                    className="flex-1 py-3.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT GATEWAY */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-neutral-900" />
                    <h2 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-neutral-900">
                      Step 3: Payment Gateway
                    </h2>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-500 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Instant Processing</span>
                  </div>
                </div>

                {/* Payment Method Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`py-3 px-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      paymentMethod === "upi"
                        ? "border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950 text-neutral-950 font-semibold"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-xs">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`py-3 px-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      paymentMethod === "card"
                        ? "border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950 text-neutral-950 font-semibold"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs">Cards</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("netbanking")}
                    className={`py-3 px-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      paymentMethod === "netbanking"
                        ? "border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950 text-neutral-950 font-semibold"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs">Net Banking</span>
                  </button>

                  <button
                    type="button"
                    disabled={!shippingConfig.is_cod_allowed}
                    onClick={() => shippingConfig.is_cod_allowed && setPaymentMethod("cod")}
                    className={`py-3 px-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                      !shippingConfig.is_cod_allowed
                        ? "border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-60"
                        : paymentMethod === "cod"
                        ? "border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950 text-neutral-950 font-semibold cursor-pointer"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300 cursor-pointer"
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-xs font-bold text-emerald-800">
                      COD{shippingConfig.cod_fee > 0 ? ` (+₹${shippingConfig.cod_fee})` : ""}
                    </span>
                  </button>
                </div>

                {/* Sub-form based on Payment Method */}
                <div className="p-4 bg-neutral-50/80 rounded-xl border border-neutral-200/80">
                  {/* UPI */}
                  {paymentMethod === "upi" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-neutral-900" />
                        <p className="text-xs font-semibold text-neutral-900">
                          Instant UPI & Mobile Apps (GPay, PhonePe, Paytm, BHIM)
                        </p>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                          Enter UPI Virtual ID (VPA)
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. 9016047308@upi or name@okhdfcbank"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 bg-white font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-500">
                        <span className="px-2 py-0.5 rounded-xs bg-white border border-neutral-200 text-[10px] font-mono">
                          Zero Surcharge
                        </span>
                        <span>Supported: Google Pay, PhonePe, Paytm, BHIM</span>
                      </div>
                    </div>
                  )}

                  {/* Card */}
                  {paymentMethod === "card" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Name as printed on card"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                          16-Digit Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                            setCardNumber(val.replace(/(\d{4})/g, "$1 ").trim());
                          }}
                          placeholder="4000 1234 5678 9010"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 bg-white font-mono tracking-widest"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                              if (val.length >= 3) {
                                setCardExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
                              } else {
                                setCardExpiry(val);
                              }
                            }}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                            CVV / CVC
                          </label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="•••"
                            maxLength={4}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 bg-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Netbanking */}
                  {paymentMethod === "netbanking" && (
                    <div className="space-y-3">
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                        Select Your Bank
                      </label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 bg-white"
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="State Bank of India">State Bank of India</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                        <option value="Punjab National Bank">Punjab National Bank</option>
                      </select>
                      <p className="text-[11px] text-neutral-500 font-light">
                        You will be redirected securely to authenticate with your bank portal.
                      </p>
                    </div>
                  )}

                  {/* Cash On Delivery */}
                  {paymentMethod === "cod" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-neutral-900">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Cash On Delivery (COD) Selected</span>
                        </div>
                        {shippingConfig.cod_fee > 0 && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            +₹{shippingConfig.cod_fee} Cash Handling Fee
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600 font-light leading-relaxed">
                        Pay in cash or digital UPI scan upon receiving your order from the courier agent.
                        {shippingConfig.cod_fee > 0 &&
                          ` An authorized courier fee of ₹${shippingConfig.cod_fee} has been added for cash handling.`}
                      </p>
                    </div>
                  )}
                </div>

                {orderError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                    {orderError}
                  </div>
                )}

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setCurrentStep(2)}
                    className="py-3.5 px-5 border border-neutral-300 text-neutral-700 text-xs font-semibold uppercase tracking-wider rounded-xs hover:bg-neutral-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handlePlaceOrder}
                    className="flex-1 py-3.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Placing Order Instantly...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          {paymentMethod === "cod"
                            ? `Confirm COD Order (${formatPrice(grandTotal)})`
                            : `Pay ${formatPrice(grandTotal)} & Place Order`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl border border-neutral-200/80 p-6 shadow-xs space-y-4 sticky top-24">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 border-b border-neutral-200 pb-3">
                Order Summary
              </h3>

              {/* Items summary */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-neutral-100">
                {items.map((it, idx) => (
                  <div key={`${it.product.id}-${idx}`} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="relative w-10 h-12 rounded-sm overflow-hidden bg-white shrink-0 border border-neutral-200/60">
                        <Image
                          src={it.product.images?.[0]?.secure_url || "/images/placeholder.jpg"}
                          alt={it.product.name}
                          fill
                          className="object-contain p-0.5"
                        />
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="font-medium text-neutral-900 truncate">{it.product.name}</p>
                        <p className="text-[10px] text-neutral-500">
                          Qty: {it.quantity} {it.selectedColor ? `• ${it.selectedColor}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-neutral-900 font-mono shrink-0">
                      {formatPrice(it.product.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-neutral-200 pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Bag Subtotal</span>
                  <span className="font-mono">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Insured Delivery</span>
                  <span className="font-mono">
                    {shippingCost === 0 ? "Complimentary" : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Import Taxes & Duties</span>
                  <span className="text-[11px] font-medium text-emerald-600">Included</span>
                </div>
                <div className="border-t border-neutral-200 pt-3 flex items-center justify-between text-sm font-bold text-neutral-950">
                  <span>Total Amount</span>
                  <span className="font-mono text-base">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="border-t border-neutral-100 pt-3 text-[11px] text-neutral-500 space-y-2 font-light">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-neutral-800 shrink-0" />
                  <span>100% Certified Italian Vegetable-Tanned Leather</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-neutral-800 shrink-0" />
                  <span>Complimentary 14-Day Atelier Exchanges</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Celebratory Order Confirmed Modal */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-neutral-200 text-center space-y-6 animate-in zoom-in-95 duration-200">
            {/* Animated Celebration Icon with Pulse */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-emerald-200 animate-ping opacity-30" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30">
                <Check className="w-10 h-10 stroke-[3] animate-in zoom-in duration-300" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-[0.25em]">
                Order Confirmed
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-neutral-950 font-normal">
                Thank You, {confirmedOrder.customerName}!
              </h2>
              <p className="text-xs text-neutral-600 font-light max-w-sm mx-auto leading-relaxed">
                Your order has been officially allocated and registered with our Florentine atelier. We are generating your tax invoice.
              </p>
            </div>

            {/* Order Snippet Box */}
            <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-neutral-200/80 text-left grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">Order Ref Number</p>
                <p className="text-neutral-950 font-mono font-bold mt-0.5">{confirmedOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">Delivery City</p>
                <p className="text-neutral-950 font-medium mt-0.5 truncate">{confirmedOrder.city || "India"}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-[11px] text-neutral-600">Total Order Value</span>
                <span className="font-mono font-bold text-sm text-neutral-950">
                  {formatPrice(confirmedOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Smooth Progress / Redirect Indicator */}
            <div className="space-y-3 pt-1">
              <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-600 h-1.5 rounded-full animate-pulse w-full" />
              </div>
              <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 font-light">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-700" />
                <span>Redirecting to your full tax invoice & order tracker...</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/order-success/${confirmedOrder.orderNumber}`)}
              className="w-full py-3 px-5 bg-neutral-950 hover:bg-black text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>View Order Receipt Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
