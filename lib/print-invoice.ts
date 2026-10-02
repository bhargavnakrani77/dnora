import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";

/**
 * Builds a pristine, self-contained, print-optimized A4 HTML invoice document.
 * Includes embedded CSS, proper page sizing, and Florentine atelier luxury formatting.
 */
export function generateInvoiceHtml(order: Order, origin?: string): string {
  const baseOrigin =
    origin || (typeof window !== "undefined" ? window.location.origin : "");

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

  const paymentModeText =
    order.payment_method === "cod"
      ? "Cash On Delivery"
      : order.payment_method
      ? order.payment_method.toUpperCase()
      : "Secure Online Gateway";

  const isPaid = order.payment_status === "paid";

  const itemsRows = (order.items && order.items.length > 0)
    ? order.items
        .map((item, idx) => {
          const totalItemPrice = item.price * item.quantity;
          const taxPart = Math.round(totalItemPrice * 0.18);
          const colorAttr = item.attributes?.selectedColor
            ? `<div style="font-size: 10px; color: #666; margin-top: 2px;">Color: ${item.attributes.selectedColor}</div>`
            : "";

          return `
            <tr>
              <td style="padding: 9px 8px; border-bottom: 1px solid #e5e5e5; font-weight: 600; color: #111;">
                ${item.product_name}
                ${colorAttr}
              </td>
              <td style="padding: 9px 8px; border-bottom: 1px solid #e5e5e5; text-align: center; font-family: monospace; font-size: 11px;">
                ${item.quantity}
              </td>
              <td style="padding: 9px 8px; border-bottom: 1px solid #e5e5e5; text-align: right; font-family: monospace; color: #444; font-size: 11px;">
                ${formatPrice(item.price)}
              </td>
              <td style="padding: 9px 8px; border-bottom: 1px solid #e5e5e5; text-align: right; font-family: monospace; color: #666; font-size: 11px;">
                ${formatPrice(taxPart)}
              </td>
              <td style="padding: 9px 8px; border-bottom: 1px solid #e5e5e5; text-align: right; font-family: monospace; font-weight: 700; color: #111; font-size: 11px;">
                ${formatPrice(totalItemPrice)}
              </td>
            </tr>
          `;
        })
        .join("")
    : `
        <tr>
          <td colspan="5" style="padding: 14px 8px; text-align: center; color: #888; font-style: italic;">
            Standard Order Fulfillment
          </td>
        </tr>
      `;

  const logoSrc = `${baseOrigin}/images/logo.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice - ${order.order_number}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #ffffff !important;
      color: #111111 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11.5px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .invoice-wrapper {
      max-width: 186mm;
      margin: 0 auto;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #111;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #000;
      margin-bottom: 4px;
    }
    .atelier-sub {
      font-size: 10px;
      color: #555;
      line-height: 1.4;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      background: #f1f1f1;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 5px;
    }
    .invoice-num {
      font-size: 16px;
      font-weight: 800;
      font-family: monospace;
      color: #000;
    }
    .info-grid {
      display: table;
      width: 100%;
      margin-bottom: 16px;
      border-bottom: 1px solid #eee;
      padding-bottom: 14px;
    }
    .info-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      font-size: 11px;
    }
    .info-col:last-child {
      padding-left: 20px;
    }
    .info-title {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 4px;
    }
    .info-name {
      font-weight: 700;
      font-size: 12px;
      color: #000;
      margin-bottom: 2px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .items-table th {
      background: #f9f9f9;
      border-top: 1px solid #111;
      border-bottom: 2px solid #111;
      padding: 8px;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #111;
    }
    .totals-grid {
      display: table;
      width: 100%;
      border-top: 2px solid #111;
      padding-top: 12px;
      margin-bottom: 18px;
    }
    .notes-col {
      display: table-cell;
      width: 55%;
      vertical-align: top;
      font-size: 10.5px;
      color: #555;
      padding-right: 20px;
    }
    .amounts-col {
      display: table-cell;
      width: 45%;
      vertical-align: top;
    }
    .amounts-table {
      width: 100%;
      font-size: 11px;
      border-collapse: collapse;
    }
    .amounts-table td {
      padding: 3px 0;
    }
    .grand-total-row td {
      border-top: 1px solid #ddd;
      padding-top: 6px !important;
      font-size: 13px;
      font-weight: 800;
      color: #000;
    }
    .footer-section {
      border-top: 1px solid #e0e0e0;
      padding-top: 12px;
      display: table;
      width: 100%;
      font-size: 10px;
      color: #666;
    }
    .footer-left {
      display: table-cell;
      width: 60%;
      vertical-align: middle;
    }
    .footer-right {
      display: table-cell;
      width: 40%;
      vertical-align: middle;
      text-align: right;
    }
    .signature-line {
      display: inline-block;
      width: 120px;
      border-bottom: 1px solid #888;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <!-- Header -->
    <table class="header-table" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align: top;">
          <img src="${logoSrc}" alt="DNORA" style="height: 30px; width: auto; max-width: 180px; object-fit: contain; object-position: left; display: block; margin-bottom: 6px;" onerror="this.outerHTML='<div class=\\'brand-title\\'>DNORA</div>'" />
          <div class="atelier-sub">
            Florentine Luxury Leather Goods • Via de' Tornabuoni 14, 50123 Firenze, Italy<br />
            Atelier Concierge: +91 90160 47308 | Web: dnora.luxury
          </div>
        </td>
        <td style="vertical-align: top;" class="invoice-meta">
          <div class="invoice-badge">Original Tax Invoice</div>
          <div class="invoice-num">${invoiceNumber}</div>
          <div style="font-size: 10.5px; color: #444; margin-top: 3px;">
            <strong>Date:</strong> ${invoiceDate}
          </div>
          <div style="font-size: 10.5px; color: #444;">
            <strong>Order Ref:</strong> ${order.order_number}
          </div>
          <div style="margin-top: 4px; font-size: 10px; color: #333;">
            ${isPaid ? '<span style="display:inline-block; padding: 1px 6px; background: #e6f4ea; color: #137333; font-weight:bold; border-radius:3px; margin-right:4px;">PAID</span>' : ''}
            <span>Payment: ${paymentModeText}</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Client & Address Info -->
    <div class="info-grid">
      <div class="info-col">
        <div class="info-title">Billed To</div>
        <div class="info-name">${order.customer_name}</div>
        <div style="color: #444;">${order.customer_email}</div>
        ${order.customer_phone ? `<div style="color: #666; font-family: monospace;">Phone: ${order.customer_phone}</div>` : ""}
      </div>
      <div class="info-col">
        <div class="info-title">Shipped To</div>
        ${
          shippingAddr.addressLine1
            ? `<div class="info-name">${shippingAddr.fullName}</div>
               <div style="color: #444;">${shippingAddr.addressLine1}</div>
               ${shippingAddr.addressLine2 ? `<div style="color: #444;">${shippingAddr.addressLine2}</div>` : ""}
               <div style="color: #444;">${shippingAddr.city}, ${shippingAddr.state} - ${shippingAddr.postalCode}</div>
               <div style="color: #444;">${shippingAddr.country}</div>`
            : `<div style="color: #888; font-style: italic;">No shipping address recorded.</div>`
        }
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: left;">Item Description</th>
          <th style="text-align: center; width: 45px;">Qty</th>
          <th style="text-align: right; width: 85px;">Unit Price</th>
          <th style="text-align: right; width: 85px;">Tax (18%)</th>
          <th style="text-align: right; width: 95px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Totals and Notes -->
    <div class="totals-grid">
      <div class="notes-col">
        <div style="font-weight: 700; color: #111; margin-bottom: 2px;">Payment Terms & Notes:</div>
        <div>${order.payment_method === "cod" ? "Cash On Delivery — Amount payable at delivery handover." : "Transaction verified through secure electronic payment gateway."}</div>
        ${order.carrier && order.tracking_number ? `<div style="margin-top: 6px; font-family: monospace; color: #333;">Courier: ${order.carrier} | AWB: ${order.tracking_number}</div>` : ""}
      </div>
      <div class="amounts-col">
        <table class="amounts-table">
          <tr>
            <td style="color: #666;">Subtotal</td>
            <td style="text-align: right; font-family: monospace;">${formatPrice(order.total_amount)}</td>
          </tr>
          <tr>
            <td style="color: #666;">Delivery Charges</td>
            <td style="text-align: right; font-family: monospace; color: #137333;">Complimentary</td>
          </tr>
          <tr>
            <td style="color: #666;">GST (Included 18%)</td>
            <td style="text-align: right; font-family: monospace;">Included</td>
          </tr>
          <tr class="grand-total-row">
            <td>Grand Total</td>
            <td style="text-align: right; font-family: monospace;">${formatPrice(order.total_amount)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer Seal & Signature -->
    <div class="footer-section">
      <div class="footer-left">
        <div style="font-weight: 700; color: #222;">DNORA Luxury House Certified Authenticity</div>
        <div>Handcrafted Florentine Leather • Official Brand Atelier Purchase</div>
      </div>
      <div class="footer-right">
        <div class="signature-line"></div>
        <div style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">
          Authorized Signatory
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Ultra-fast, isolated printing function.
 * Creates an invisible iframe containing ONLY the pristine A4 invoice,
 * ensuring 0 background elements (no navigation, no account page, no footer)
 * get sent to the printer.
 */
export function printDirectInvoice(order: Order): void {
  if (typeof window === "undefined") return;

  const html = generateInvoiceHtml(order);

  // Remove any stale print iframes
  const existingFrame = document.getElementById("dnora-invoice-print-frame");
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "dnora-invoice-print-frame";
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  // Position offscreen so it is completely invisible
  iframe.style.position = "fixed";
  iframe.style.right = "-9999px";
  iframe.style.bottom = "-9999px";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  iframe.style.zIndex = "-1";

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error("Could not access iframe document for printing.");
    // Fallback to window.print if iframe fails
    window.print();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Print execution failed:", e);
      window.print();
    } finally {
      // Remove iframe after print dialog is closed or after 60s
      setTimeout(() => {
        iframe.remove();
      }, 60000);
    }
  };

  // Wait a tick for fonts/layout to settle then print instantly
  setTimeout(triggerPrint, 40);
}
