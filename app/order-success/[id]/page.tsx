import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Package, ArrowRight, MapPin } from "lucide-react";
import { getOrderById } from "@/lib/data/account";
import { formatPrice } from "@/lib/utils";
import InvoicePrintButton from "@/components/InvoicePrintButton";

interface OrderSuccessPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  const shippingAddr = (order?.shipping_address || null) as Record<string, string | undefined> | null;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Instant Animated Celebration Notification Alert */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-emerald-700/50 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Order Confirmed Successfully
              </p>
              <p className="text-xs text-emerald-100/90 font-light mt-0.5">
                Ref: <span className="font-mono font-bold text-white">{order?.order_number || id}</span> — Registered in our Florentine system.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-emerald-800/80 text-emerald-200 border border-emerald-600/50 font-semibold">
            Verified
          </span>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-10 shadow-xs text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">
              Payment & Allocation Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-neutral-950 font-normal">
              Thank You for Your Order
            </h1>
            <p className="text-xs text-neutral-600 font-light max-w-md mx-auto leading-relaxed">
              Your bespoke silhouette is being prepared at our Florentine atelier. We have dispatched a confirmation receipt to{" "}
              <strong className="font-medium text-neutral-950">{order?.customer_email || "your email"}</strong>.
            </p>
          </div>

          {/* Order Details Badge Box */}
          <div className="bg-neutral-50 rounded-xl p-4 sm:p-5 border border-neutral-200/80 text-left grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Order Number</p>
              <p className="text-neutral-950 font-mono font-bold mt-0.5">{order?.order_number || id}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Order Status</p>
              <p className="text-emerald-700 font-semibold mt-0.5 capitalize">{order?.status || "Processing"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Total Paid</p>
              <p className="text-neutral-950 font-mono font-bold mt-0.5">
                {order ? formatPrice(order.total_amount) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Payment Mode</p>
              <p className="text-neutral-900 font-medium uppercase mt-0.5">{order?.payment_method || "Online"}</p>
            </div>
          </div>

          {/* Delivery Address if present */}
          {shippingAddr && (
            <div className="text-left bg-neutral-50/50 rounded-xl p-4 border border-neutral-100 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-700 font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>Shipping Address</span>
              </div>
              <p className="text-neutral-800 font-medium">{shippingAddr.fullName} ({shippingAddr.phone})</p>
              <p className="text-neutral-600 font-light">
                {shippingAddr.addressLine1}, {shippingAddr.addressLine2 ? `${shippingAddr.addressLine2}, ` : ""}
                {shippingAddr.city}, {shippingAddr.state} - {shippingAddr.postalCode}, {shippingAddr.country}
              </p>
            </div>
          )}

          {/* Purchased Items List */}
          {order?.items && order.items.length > 0 && (
            <div className="text-left space-y-3 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                Ordered Silhouettes
              </p>
              <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                {order.items.map((it) => (
                  <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {it.image_url ? (
                        <div className="relative w-12 h-14 rounded-md overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200/60">
                          <Image src={it.image_url} alt={it.product_name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-14 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-neutral-950">{it.product_name}</p>
                        <p className="text-[11px] text-neutral-500">
                          Qty: {it.quantity} {it.attributes?.selectedColor ? `• ${it.attributes.selectedColor}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-neutral-950">
                      {formatPrice(it.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 space-y-2.5">
            <InvoicePrintButton order={order} />

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Link
                href="/orders"
                className="w-full sm:flex-1 py-3 px-4 border border-neutral-300 text-neutral-800 text-xs font-semibold uppercase tracking-wider rounded-xs hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Order History</span>
              </Link>
              <Link
                href="/shop"
                className="w-full sm:flex-1 py-3 px-4 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider rounded-xs hover:bg-black transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
