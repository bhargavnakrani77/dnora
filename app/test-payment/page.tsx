"use client";

import React, { useState } from "react";
import { RazorpayCheckoutButton } from "@/components/RazorpayCheckoutButton";
import { ShieldCheck, CheckCircle2, CreditCard, RefreshCw } from "lucide-react";

export default function TestPaymentPage() {
  const [testAmount, setTestAmount] = useState<number>(500); // in Rupees
  const [customerName, setCustomerName] = useState<string>("Bespoke Customer");
  const [customerEmail, setCustomerEmail] = useState<string>("customer@dnora.luxury");
  const [customerPhone, setCustomerPhone] = useState<string>("9876543210");
  const [paymentResult, setPaymentResult] = useState<{
    paymentId: string;
    orderId: string;
    signature: string;
    verification: Record<string, unknown>;
  } | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);


  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold tracking-wider uppercase border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Razorpay Standard Web Checkout Integration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-neutral-900 font-normal">
            Razorpay Payment Test Bench
          </h1>
          <p className="text-xs text-neutral-600 max-w-md mx-auto">
            Test the end-to-end Razorpay Standard Checkout flow: Order Creation, Modal Popup, and HMAC-SHA256 Signature Verification.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-neutral-900" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                Payment Details
              </h2>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono">Test Mode</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Amount (INR / ₹)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={testAmount}
                onChange={(e) => setTestAmount(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-hidden focus:border-neutral-950 font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Will be converted to {testAmount * 100} paise (Minimum 100 paise = ₹1).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-hidden focus:border-neutral-950"
              />
            </div>
          </div>

          {/* Razorpay Standard Checkout Button */}
          <div className="pt-2">
            <RazorpayCheckoutButton
              amount={testAmount}
              amountInRupees={true}
              currency="INR"
              customerName={customerName}
              customerEmail={customerEmail}
              customerPhone={customerPhone}
              buttonText={`Pay ₹${testAmount.toLocaleString("en-IN")} via Razorpay`}
              onSuccess={(result) => {
                setPaymentResult(result);
                setLastError(null);
              }}
              onError={(err) => {
                setLastError(err);
              }}
            />
          </div>

          {/* Error display */}
          {lastError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {lastError}
            </div>
          )}


          {/* Success details card */}
          {paymentResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Payment Verified Successfully
                </h3>
              </div>
              <div className="space-y-1 text-xs text-emerald-900 font-mono">
                <p>
                  <span className="font-semibold">Razorpay Order ID:</span>{" "}
                  {paymentResult.orderId}
                </p>
                <p>
                  <span className="font-semibold">Payment ID:</span>{" "}
                  {paymentResult.paymentId}
                </p>
                <p className="truncate">
                  <span className="font-semibold">Signature:</span>{" "}
                  {paymentResult.signature}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentResult(null)}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-800 underline hover:text-emerald-950 cursor-pointer pt-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Test Another Transaction</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
