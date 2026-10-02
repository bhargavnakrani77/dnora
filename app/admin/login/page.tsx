"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, ArrowRight, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/admin";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Incorrect admin password.");
      }

      router.push(redirectParam.startsWith("/admin") ? redirectParam : "/admin");
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Incorrect admin password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] flex flex-col justify-center items-center px-4 sm:px-6 relative select-none">
      {/* Background Decorative Blur */}
      <div className="absolute w-96 h-96 bg-white/[0.03] rounded-full blur-3xl pointer-events-none -top-20 -right-20" />
      <div className="absolute w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none -bottom-20 -left-20" />

      <div className="max-w-md w-full bg-[#121215] border border-white/10 p-8 sm:p-10 rounded-xl shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <div className="relative h-8 w-36">
              <Image
                src="/images/logo.png"
                alt="DNORA"
                fill
                className="object-contain invert brightness-200"
                priority
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-[0.2em] text-white/70">
            <ShieldCheck className="w-3.5 h-3.5 text-white/80" />
            <span>Administrative Suite</span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Enter the master administrator key to manage the live storefront.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Password-Only Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-300 mb-2">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#08080A] border border-white/15 pl-10 pr-10 py-3 text-sm text-white rounded-lg focus:outline-hidden focus:border-white/50 transition-colors placeholder:text-neutral-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-bold uppercase tracking-[0.2em] rounded-lg transition-all shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? "Verifying..." : "Enter Admin Suite"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Back Link */}
        <div className="text-center pt-6 border-t border-white/10 mt-6">
          <Link
            href="/"
            className="text-xs text-neutral-400 hover:text-white transition-colors tracking-wider"
          >
            ← Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08080A] flex items-center justify-center text-white text-xs font-mono uppercase tracking-widest">
          Loading Security Suite...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
