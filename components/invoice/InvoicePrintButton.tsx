"use client";

import React, { useState } from "react";
import { Printer } from "lucide-react";
import { Order } from "@/types";
import InvoiceModal from "./InvoiceModal";

export default function InvoicePrintButton({ order }: { order: Order | null }) {
  const [open, setOpen] = useState(false);

  if (!order) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-3 px-4 border border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-950 text-xs font-semibold uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
      >
        <Printer className="w-4 h-4 text-neutral-800" />
        <span>Download / Print Tax Invoice (PDF)</span>
      </button>

      <InvoiceModal order={open ? order : null} onClose={() => setOpen(false)} />
    </>
  );
}
