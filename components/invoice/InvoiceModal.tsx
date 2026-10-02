"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Printer, ExternalLink, ShieldCheck, Loader2 } from "lucide-react";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import { printDirectInvoice } from "@/lib/print-invoice";

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key & intercept Ctrl+P for fast pure A4 invoice printing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        if (order) {
          setIsPrinting(true);
          printDirectInvoice(order);
          setTimeout(() => setIsPrinting(false), 800);
        }
      }
    };

    if (order) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("dnora-invoice-open");
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.classList.remove("dnora-invoice-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [order, onClose]);

  if (!mounted || !order) return null;

  const rawAddr = (order.shipping_address || {}) as Record<string, string | undefined>;
  const shippingAddr = {
    fullName: rawAddr.fullName || rawAddr.full_name || order.customer_name || "",
    phone: rawAddr.phone || rawAddr.customer_phone || order.customer_phone || "",
    addressLine1: rawAddr.addressLine1 || rawAddr.address_line1 || "",
    addressLine2: rawAddr.addressLine2 || rawAddr.address_line2 || "",
    city: rawAddr.city || "",
    state: rawAddr.state || "",
    postalCode: rawAddr.postalCode || rawAddr.postal_code || "",
    country: rawAddr.country || "India",
  };

  const invoiceNumber = `INV-${order.order_number}`;
  const invoiceDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handlePrint = () => {
    setIsPrinting(true);
    printDirectInvoice(order);
    setTimeout(() => setIsPrinting(false), 800);
  };

  const modalContent = (
    <div id="dnora-invoice-portal" className="print:block print:w-full print:m-0 print:p-0">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
        {/* Background click to dismiss (hidden in print) */}
        <div className="fixed inset-0 print:hidden" onClick={onClose} />

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-3xl bg-neutral-100 rounded-2xl shadow-2xl overflow-hidden my-auto border border-neutral-300 print:border-none print:shadow-none print:rounded-none print:m-0 print:w-full print:max-w-none print:bg-white animate-in fade-in zoom-in-95 duration-150">
          {/* Top Controls Bar (Hidden during Print) */}
          <div className="p-4 bg-neutral-900 text-white flex items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-wider font-semibold text-neutral-300">
                {invoiceNumber}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                Instant Preview
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/orders/${order.order_number}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition cursor-pointer"
                title="Open full page in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Tab</span>
              </a>

              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-neutral-950 text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition cursor-pointer shadow-sm active:scale-95 disabled:opacity-75"
              >
                {isPrinting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                <span>{isPrinting ? "Opening Print..." : "Print / Save PDF"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Tax Invoice Canvas */}
          <div
            id="printable-invoice"
            className="p-6 sm:p-10 bg-white space-y-7 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0"
          >
            {/* Header with Logo & Atelier Info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-neutral-200 pb-6">
              <div>
                <div className="relative h-9 w-44 mb-2">
                  <Image
                    src="/images/logo.png"
                    alt="DNORA Luxury House"
                    fill
                    sizes="180px"
                    className="object-contain object-left"
                    priority
                  />
                </div>
                <p className="text-[11px] text-neutral-500 font-light max-w-xs leading-relaxed">
                  Via de&apos; Tornabuoni 14, 50123 Firenze, Italy
                  <br />
                  Atelier Concierge: +91 90160 47308
                  <br />
                  Email: concierge@dnora.it | Web: dnora.luxury
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-[10px] font-bold uppercase tracking-widest border border-neutral-200 mb-1">
                  Original Tax Invoice
                </span>
                <p className="text-lg font-bold font-mono text-neutral-950">{invoiceNumber}</p>
                <p className="text-xs text-neutral-600 font-light">
                  <strong className="font-medium text-neutral-800">Date:</strong> {invoiceDate}
                </p>
                <p className="text-xs text-neutral-600 font-light">
                  <strong className="font-medium text-neutral-800">Order Ref:</strong>{" "}
                  {order.order_number}
                </p>
                <div className="pt-1 flex items-center sm:justify-end gap-2">
                  {order.payment_status === "paid" && (
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      PAID
                    </span>
                  )}
                  <span className="text-[10px] uppercase font-mono text-neutral-500">
                    Mode: {order.payment_method === "cod" ? "Cash On Delivery" : order.payment_method || "Online"}
                  </span>
                </div>
              </div>
            </div>

            {/* Client & Shipping Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-neutral-100 pb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Billed To
                </span>
                <p className="font-semibold text-neutral-950 text-sm">{order.customer_name}</p>
                <p className="text-neutral-600">{order.customer_email}</p>
                {order.customer_phone && (
                  <p className="text-neutral-500 font-mono">Mobile: {order.customer_phone}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Shipped To
                </span>
                {shippingAddr.addressLine1 ? (
                  <div className="text-neutral-700 font-light leading-relaxed">
                    <p className="font-medium text-neutral-900">{shippingAddr.fullName}</p>
                    <p>{shippingAddr.addressLine1}</p>
                    {shippingAddr.addressLine2 && <p>{shippingAddr.addressLine2}</p>}
                    <p>
                      {shippingAddr.city}, {shippingAddr.state} - {shippingAddr.postalCode}
                    </p>
                    <p>{shippingAddr.country}</p>
                  </div>
                ) : (
                  <p className="text-neutral-400 italic">No delivery address stored.</p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-900 text-neutral-900 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Item Description</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                    <th className="py-2.5 text-right">Tax (18%)</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => {
                      const totalItemPrice = item.price * item.quantity;
                      const taxPart = Math.round(totalItemPrice * 0.18);
                      return (
                        <tr key={item.id || idx}>
                          <td className="py-3 pr-4">
                            <p className="font-semibold text-neutral-950">{item.product_name}</p>
                            {Boolean(item.attributes?.selectedColor) && (
                              <p className="text-[11px] text-neutral-500">
                                Color: {String(item.attributes?.selectedColor)}
                              </p>
                            )}
                          </td>
                          <td className="py-3 text-center font-mono">{item.quantity}</td>
                          <td className="py-3 text-right font-mono text-neutral-700">
                            {formatPrice(item.price)}
                          </td>
                          <td className="py-3 text-right font-mono text-neutral-500">
                            {formatPrice(taxPart)}
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-neutral-950">
                            {formatPrice(totalItemPrice)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-neutral-400 italic">
                        Standard Order Fulfillment
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="border-t-2 border-neutral-900 pt-4 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="max-w-xs space-y-1 text-[11px] text-neutral-500 font-light">
                <p className="font-medium text-neutral-800">Payment Notes:</p>
                <p>
                  {order.payment_method === "cod"
                    ? "Cash On Delivery: Amount payable at delivery handover."
                    : "Verified through secure online payment gateway."}
                </p>
                {order.carrier && order.tracking_number && (
                  <p className="font-mono pt-1 text-neutral-700">
                    Courier: {order.carrier} | AWB: {order.tracking_number}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Delivery Charges</span>
                  <span className="font-mono">Complimentary</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>GST (Goods & Services Tax)</span>
                  <span className="text-[11px] text-emerald-600 font-medium">Included (18%)</span>
                </div>
                <div className="border-t border-neutral-300 pt-2 flex items-center justify-between font-bold text-sm text-neutral-950">
                  <span>Grand Total</span>
                  <span className="font-mono text-base">{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Footer & Signature Stamp */}
            <div className="border-t border-neutral-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px] text-neutral-500 font-light">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-neutral-800 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
                  <span>DNORA Luxury House Certified Authenticity</span>
                </div>
                <p>Handcrafted Florentine Calfskin • 14-Day Atelier Exchanges</p>
              </div>

              <div className="text-center sm:text-right space-y-1.5">
                <div className="w-32 h-8 border-b border-neutral-400 mx-auto sm:ml-auto" />
                <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-700 font-semibold">
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Strict A4 Print Sheet Styling */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 10mm 12mm;
                }
                body > *:not(#dnora-invoice-portal) {
                  display: none !important;
                }
                #dnora-invoice-portal {
                  display: block !important;
                  position: static !important;
                  width: 100% !important;
                }
                html, body {
                  background: #ffffff !important;
                  color: #000000 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                #printable-invoice {
                  width: 100% !important;
                  max-width: 186mm !important;
                  margin: 0 auto !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                  page-break-inside: avoid !important;
                }
              }
            `,
          }}
        />
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
