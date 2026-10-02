"use client";

import React from "react";
import { Printer, ArrowLeft } from "lucide-react";

interface InvoiceControlsProps {
  orderNumber?: string;
}

export default function InvoiceControls({ orderNumber }: InvoiceControlsProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/account";
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-black transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-950 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-black transition-all shadow-sm cursor-pointer"
      >
        <Printer className="w-4 h-4" />
        <span>Print / Download PDF Bill</span>
      </button>
    </div>
  );
}
