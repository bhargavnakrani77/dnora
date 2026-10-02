"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Search, ChevronDown, Package, User as UserIcon, Phone, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { NavCategory } from "./types";

interface TopBarMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  navCategories: NavCategory[];
  mobileAccordion: string | null;
  setMobileAccordion: (id: string | null) => void;
  conciergePhone?: string;
  conciergeEmail?: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  } | null;
  onSignOut?: () => void;
}

export function TopBarMobileDrawer({
  isOpen,
  onClose,
  onOpenSearch,
  navCategories,
  mobileAccordion,
  setMobileAccordion,
  conciergePhone,
  conciergeEmail,
  user,
}: TopBarMobileDrawerProps) {
  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none delay-300"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out cursor-pointer ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
        <div
          className={`w-screen max-w-sm sm:max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-neutral-200">
            <Link href="/" onClick={onClose} className="relative h-7 w-28">
              <Image
                src="/images/logo.png"
                alt="DNORA"
                fill
                className="object-contain"
              />
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Account / Membership Bar in Mobile Drawer */}
          {user ? (
            <div className="flex items-center justify-between px-6 py-3.5 bg-neutral-50/90 border-b border-neutral-200/80">
              <Link
                href="/account"
                onClick={onClose}
                className="flex items-center gap-3 group min-w-0"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white text-xs font-serif uppercase flex items-center justify-center font-bold tracking-wider shrink-0 shadow-xs">
                  {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-black truncate">
                    {user.full_name || "Maison Member"}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono truncate">
                    {user.email}
                  </p>
                </div>
              </Link>
              <Link
                href="/account"
                onClick={onClose}
                className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-800 hover:text-black underline shrink-0 pl-2"
              >
                Portal
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between px-6 py-3 bg-neutral-900 text-white border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-200">
                  Maison Client
                </span>
              </div>
              <Link
                href="/login"
                onClick={onClose}
                className="text-[10.5px] font-bold uppercase tracking-widest text-amber-300 hover:text-white transition-colors"
              >
                Sign In →
              </Link>
            </div>
          )}

          {/* Mobile Search input trigger */}
          <div className="px-6 py-3.5 border-b border-neutral-100 bg-[#f4f4f5]">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-400 tracking-wider uppercase cursor-pointer hover:border-neutral-300 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-neutral-500" />
                <span>Search Maison...</span>
              </span>
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">
                OPEN
              </span>
            </button>
          </div>

          {/* Navigation Categories Accordion - Entire item clickable */}
          <div className="flex-1 overflow-y-auto px-6 py-3 divide-y divide-neutral-100">
            {navCategories.map((cat) => {
              const hasSubs = !!(cat.subcategories && cat.subcategories.length > 0);
              const isExpanded = mobileAccordion === cat.id;

              return (
                <div key={cat.id} className="py-3">
                  {hasSubs ? (
                    <button
                      type="button"
                      onClick={() => setMobileAccordion(isExpanded ? null : cat.id)}
                      className="w-full flex items-center justify-between py-1 text-left cursor-pointer group select-none"
                    >
                      <span className="text-xs font-semibold tracking-[0.2em] uppercase text-neutral-900 group-hover:text-black">
                        {cat.label}
                      </span>
                      <div className="p-1 text-neutral-400 group-hover:text-black transition-colors">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>
                  ) : (
                    <Link
                      href={cat.href}
                      onClick={onClose}
                      className="block py-1 text-xs font-semibold tracking-[0.2em] uppercase text-neutral-900 hover:text-black transition-colors"
                    >
                      {cat.label}
                    </Link>
                  )}

                  {hasSubs && isExpanded && (
                    <div className="mt-3 pl-3 border-l-2 border-neutral-900 space-y-4 pt-1 animate-in fade-in duration-150">
                      <div>
                        <Link
                          href={cat.href}
                          onClick={onClose}
                          className="text-[11px] font-bold text-neutral-900 hover:underline inline-flex items-center gap-1.5 mb-2"
                        >
                          <span>Explore All {cat.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                      {cat.subcategories!.map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-2">
                          <span className="text-[9.5px] uppercase tracking-[0.18em] font-bold text-neutral-400 block">
                            {group.title}
                          </span>
                          <ul className="space-y-2">
                            {group.items.map((sub, sIdx) => (
                              <li key={sIdx}>
                                <Link
                                  href={sub.href}
                                  onClick={onClose}
                                  className="text-xs text-neutral-700 hover:text-black block transition-colors"
                                >
                                  {sub.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Member Services & Concierge Footer */}
          <div className="p-5 border-t border-neutral-200 bg-[#f4f4f5] space-y-4">
            {/* Box 1: Track Order | Box 2: Client Portal (if logged in) or Login / Sign Up */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/account?tab=orders"
                onClick={onClose}
                className="flex items-center justify-center gap-2 p-2.5 bg-white border border-neutral-200 hover:border-black rounded-lg text-xs font-semibold uppercase tracking-wider text-neutral-800 transition-colors shadow-2xs text-center"
              >
                <Package className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                <span className="truncate">Track Order</span>
              </Link>

              {user ? (
                <Link
                  href="/account"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 p-2.5 bg-white border border-neutral-200 hover:border-black rounded-lg text-xs font-semibold uppercase tracking-wider text-neutral-800 transition-colors shadow-2xs text-center"
                >
                  <UserIcon className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                  <span className="truncate">Client Portal</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 p-2.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs text-center"
                >
                  <UserIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="truncate">Login / Sign Up</span>
                </Link>
              )}
            </div>

            <div className="text-[11px] text-neutral-500 space-y-1 pt-1">
              <p className="flex items-center gap-1.5 font-medium">
                <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                <span className="truncate">VIP Concierge: {conciergePhone || "+39 02 8901 3450"}</span>
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                <span className="truncate">{conciergeEmail || "concierge@dnora.luxury"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
