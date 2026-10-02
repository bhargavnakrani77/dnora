import React from "react";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/user-session";
import { getUserOrders, getUserAddresses } from "@/lib/data/account";
import AccountPortalClient from "./AccountPortalClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Client Portal | Maison DNORA",
  description: "Manage your luxury orders, live tracking, bespoke wishlist, and account details.",
};

export default async function AccountPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login?redirect=/account");
  }

  const [orders, addresses] = await Promise.all([
    getUserOrders(session.id, session.email),
    getUserAddresses(session.id),
  ]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      <AccountPortalClient
        user={session}
        initialOrders={orders}
        initialAddresses={addresses}
      />
    </div>
  );
}
