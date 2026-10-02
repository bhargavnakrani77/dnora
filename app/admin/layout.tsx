"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Admin sidebar defaults to collapsed/closed as requested
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // If on login page, render standalone clean view without sidebar or layout restrictions
  const isLoginPage = pathname?.startsWith("/admin/login") ?? false;

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/admin-check");
        if (!res.ok && isMounted) {
          router.replace("/admin/login");
        }
      } catch {
        if (isMounted) {
          router.replace("/admin/login");
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [isLoginPage, router, pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-neutral-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[padding-left] duration-300 ease-[cubic-bezier(0.2,0,0,1)] will-change-[padding-left] ${
          sidebarCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <AdminHeader
          onOpenMobileSidebar={() => {
            if (typeof window !== "undefined" && window.innerWidth >= 768) {
              setSidebarCollapsed((prev) => !prev);
            } else {
              setMobileSidebarOpen(true);
            }
          }}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
