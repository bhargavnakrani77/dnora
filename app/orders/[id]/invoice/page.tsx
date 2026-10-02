import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import InvoiceControls from "@/components/InvoiceControls";
import { getOrderById } from "@/lib/data/account";
import { formatPrice } from "@/lib/utils";

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const shippingAddr = (order.shipping_address || {}) as Record<string, string | undefined>;
  const invoiceNumber = `INV-${order.order_number}`;
  const invoiceDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-neutral-100 py-6 sm:py-10 px-4 print:p-0 print:bg-white text-neutral-900">
      {/* Top Controls Bar (Hidden during Print/PDF export) */}
      <InvoiceControls orderNumber={order.order_number} />

      {/* Main Printable Bill / Tax Invoice Canvas */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl print:rounded-none shadow-sm print:shadow-none border print:border-none border-neutral-200/80 p-8 sm:p-12 space-y-8">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-neutral-200 pb-8">
          <div>
            <div className="relative h-8 w-44 mb-3">
              <Image
                src="/images/logo.png"
                alt="DNORA Luxury House"
                fill
                sizes="180px"
                className="object-contain"
                priority
              />
            </div>
            <p className="text-[11px] text-neutral-500 font-light max-w-xs leading-relaxed">
              Via de&apos; Tornabuoni 14, 50123 Firenze, Italy
              <br />
              Atelier Support & Concierge: +91 90160 47308
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
              <strong className="font-medium text-neutral-800">Order Ref:</strong> {order.order_number}
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
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Billed To
            </span>
            <p className="font-semibold text-neutral-950 text-sm">{order.customer_name}</p>
            <p className="text-neutral-600">{order.customer_email}</p>
            {order.customer_phone && (
              <p className="text-neutral-500 font-mono">Mobile: {order.customer_phone}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Shipped To
            </span>
            {shippingAddr ? (
              <div className="text-neutral-700 font-light leading-relaxed">
                <p className="font-medium text-neutral-900">{shippingAddr.fullName}</p>
                <p>{shippingAddr.addressLine1}</p>
                {shippingAddr.addressLine2 && <p>{shippingAddr.addressLine2}</p>}
                <p>
                  {shippingAddr.city}, {shippingAddr.state} - {shippingAddr.postalCode}
                </p>
                <p>{shippingAddr.country || "India"}</p>
              </div>
            ) : (
              <p className="text-neutral-400 italic">No delivery address stored.</p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-4">
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
              {order.items?.map((item, idx) => {
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
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="border-t-2 border-neutral-900 pt-4 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="max-w-xs space-y-1 text-[11px] text-neutral-500 font-light">
            <p className="font-medium text-neutral-800">Payment Notes:</p>
            <p>
              {order.payment_method === "cod"
                ? "Cash On Delivery: Payment due upon signature handover."
                : "Payment successfully received and verified through secure merchant gateway."}
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
              <span>GST & Customs Duties</span>
              <span className="text-[11px] text-emerald-600 font-medium">Included</span>
            </div>
            <div className="border-t border-neutral-300 pt-2 flex items-center justify-between font-bold text-sm text-neutral-950">
              <span>Grand Total</span>
              <span className="font-mono text-base">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Footer & Signature Stamp */}
        <div className="border-t border-neutral-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px] text-neutral-500 font-light">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-medium text-neutral-800">DNORA Luxury House Certified Authenticity</p>
            <p>Handcrafted Florentine Calfskin • 14-Day Atelier Exchanges</p>
          </div>

          <div className="text-center sm:text-right space-y-2">
            <div className="w-32 h-10 border-b border-neutral-400 mx-auto sm:ml-auto" />
            <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-700 font-semibold">
              Authorized Signatory
            </p>
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
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .min-h-screen {
                min-height: auto !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
            }
          `,
        }}
      />
    </div>
  );
}
