import { redirect } from "next/navigation";

export default function AdminItemsNewRedirect() {
  redirect("/admin/products/new");
}
