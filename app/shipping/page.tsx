import React from "react";
import { Truck, ShieldCheck, Clock, MapPin } from "lucide-react";

export const metadata = {
  title: "Shipping & Worldwide Customs | DNORA Luxury House",
  description: "Information regarding complimentary insured courier shipping and dispatch timelines.",
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-neutral-200/80 p-8 sm:p-12 shadow-xs space-y-8">
        <div className="border-b border-neutral-100 pb-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">
            Client Logistics
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-neutral-950 font-normal">
            Shipping & Worldwide Customs
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            White-glove courier dispatch with full signature insurance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-1 text-xs">
            <p className="font-semibold text-neutral-900">Complimentary Express</p>
            <p className="text-neutral-600 font-light">3 – 5 Business Days across India</p>
            <p className="text-emerald-700 font-medium">Included on all orders</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-1 text-xs">
            <p className="font-semibold text-neutral-900">VIP White-Glove Handcraft</p>
            <p className="text-neutral-600 font-light">1 – 2 Business Days priority routing</p>
            <p className="text-neutral-900 font-medium">₹150 (Complimentary over ₹2,500)</p>
          </div>
        </div>

        <div className="space-y-6 text-xs text-neutral-700 font-light leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              Discreet Luxury Packaging
            </h2>
            <p>
              Each DNORA handbag arrives wrapped in custom unbleached organic cotton dust bags, encased in our rigid architectural gift box, sealed with tamper-evident security tape.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
              Live Order Tracking
            </h2>
            <p>
              Once your parcel leaves our central dispatch hub, an SMS and email notification with your Air Waybill (AWB) number and live tracking link will be sent automatically.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
