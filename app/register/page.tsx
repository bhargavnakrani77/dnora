import React, { Suspense } from "react";
import { Metadata } from "next";
import { Loader2 } from "lucide-react";
import AuthFlipPortal from "@/components/auth/AuthFlipPortal";

export const metadata: Metadata = {
  title: "Client Registration | DNORA Atelier",
  description: "Join the Maison DNORA client collective for curated private drops, order archives, and dedicated concierge.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-8 sm:py-14 bg-gradient-to-b from-[#FBF9F6] via-[#F6F4F0] to-[#EFECE6] relative overflow-hidden">
      {/* Subtle luxury ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="w-full max-w-lg bg-white/90 border border-neutral-200 rounded-3xl p-12 flex flex-col items-center justify-center shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-800 mb-3" />
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-bold">
              Loading Atelier Registration...
            </span>
          </div>
        }
      >
        <AuthFlipPortal initialMode="register" />
      </Suspense>
    </div>
  );
}
