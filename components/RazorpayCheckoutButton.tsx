"use client";

import React, { useState } from "react";
import { Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface RazorpayModalOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler?: (response: RazorpaySuccessResponse) => void | Promise<void>;
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (data: RazorpayFailureResponse) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayModalOptions) => RazorpayInstance;
  }
}

export interface RazorpayCheckoutButtonProps {
  /** Amount in paise (minimum 100 paise = ₹1) or rupees if amountInRupees is true */
  amount: number;
  amountInRupees?: boolean;
  currency?: string;
  receipt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: Record<string, string>;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
  onSuccess?: (result: {
    paymentId: string;
    orderId: string;
    signature: string;
    verification: Record<string, unknown>;
  }) => void;
  onError?: (error: string) => void;
  onDismiss?: () => void;
}


export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      if (window.Razorpay) {
        resolve(true);
      } else {
        existingScript.addEventListener("load", () => resolve(true), { once: true });
        existingScript.addEventListener("error", () => resolve(false), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpayCheckoutButton({
  amount,
  amountInRupees = false,
  currency = "INR",
  receipt,
  customerName = "",
  customerEmail = "",
  customerPhone = "",
  notes = {},
  buttonText,
  className = "",
  disabled = false,
  onSuccess,
  onError,
  onDismiss,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ paymentId: string; orderId: string } | null>(null);

  // Convert to paise if specified in rupees
  const amountInPaise = Math.round(amountInRupees ? amount * 100 : amount);

  const displayAmount = amountInRupees
    ? `₹${amount.toLocaleString("en-IN")}`
    : `₹${(amount / 100).toLocaleString("en-IN")}`;

  const defaultButtonLabel = buttonText || `Pay with Razorpay (${displayAmount})`;

  const handlePayment = async () => {
    if (loading || disabled) return;

    setErrorMessage(null);
    setSuccessInfo(null);
    setLoading(true);

    try {
      // 1. Validate minimum amount (100 paise = ₹1)
      if (amountInPaise < 100) {
        const err = "Amount must be at least 100 paise (₹1).";
        setErrorMessage(err);
        onError?.(err);
        setLoading(false);
        return;
      }

      // 2. Ensure Razorpay checkout.js script is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !window.Razorpay) {
        const err = "Unable to load Razorpay Checkout SDK. Please check your network connection.";
        setErrorMessage(err);
        onError?.(err);
        setLoading(false);
        return;
      }

      // 3. STEP 1: Call backend /api/create-order to create order on Razorpay
      const createOrderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          notes,
        }),
      });

      const orderData = await createOrderRes.json().catch(() => null);

      if (!createOrderRes.ok || !orderData?.order_id) {
        const err = orderData?.error || "Failed to initialize payment order on server.";
        setErrorMessage(err);
        onError?.(err);
        setLoading(false);
        return;
      }

      const keyId =
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_Tn2hLkLFDVYPjU";

      // 4. STEP 2: Configure Razorpay modal options
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || currency,
        name: "DNORA Luxury Atelier",
        description: "Official Order Payment",
        image: "/favicon.ico",
        order_id: orderData.order_id,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        notes: {
          ...notes,
          order_receipt: orderData.receipt || receipt || "",
        },
        theme: {
          color: "#0E0E0E",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setErrorMessage("Payment was cancelled. You can retry anytime.");
            onDismiss?.();
          },
        },
        handler: async function (response: RazorpaySuccessResponse) {
          try {
            // 5. STEP 3: Call backend /api/verify-payment to verify signature
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json().catch(() => null);

            if (!verifyRes.ok || !verifyData?.success) {
              const err =
                verifyData?.error ||
                "Payment verification failed: cryptographic signature mismatch.";
              setErrorMessage(err);
              onError?.(err);
              setLoading(false);
              return;
            }

            // Payment verified successfully!
            setSuccessInfo({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            });
            setLoading(false);

            onSuccess?.({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              verification: verifyData as Record<string, unknown>,
            });
          } catch (verifyErr: unknown) {
            console.error("Verification error:", verifyErr);
            const err = "Network error while verifying payment signature.";
            setErrorMessage(err);
            onError?.(err);
            setLoading(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      // Handle payment.failed event
      razorpayInstance.on("payment.failed", function (failResponse: RazorpayFailureResponse) {
        console.error("Payment failed event:", failResponse?.error);
        const description =
          failResponse?.error?.description ||
          failResponse?.error?.reason ||
          "Payment failed. Please try a different card or UPI method.";
        setErrorMessage(`Payment Failed: ${description}`);
        onError?.(description);
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err: unknown) {
      console.error("Razorpay Checkout Error:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred during checkout.";
      setErrorMessage(message);
      onError?.(message);
      setLoading(false);
    }
  };


  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={handlePayment}
        className={
          className ||
          "w-full py-3.5 px-6 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        }
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5" />
            <span>{defaultButtonLabel}</span>
          </>
        )}
      </button>

      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {successInfo && (
        <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1">
            <p className="font-semibold">Payment Verified Successfully!</p>
            <p className="text-[11px] font-mono mt-0.5 text-emerald-700">
              Payment ID: {successInfo.paymentId}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
