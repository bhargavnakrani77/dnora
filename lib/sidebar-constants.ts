import { SidebarMenuItem } from "@/types";

export const DEFAULT_SIDEBAR_ITEMS: SidebarMenuItem[] = [
  {
    id: "nav-dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: "LayoutDashboard",
    is_active: true,
  },
  {
    id: "nav-orders",
    label: "Order Master",
    href: "/admin/orders",
    icon: "Package",
    is_active: true,
  },
  {
    id: "nav-categories",
    label: "Category Master",
    href: "/admin/categories",
    icon: "Folder",
    is_active: true,
  },
  {
    id: "nav-products",
    label: "Product Master",
    href: "/admin/products",
    icon: "ShoppingBag",
    is_active: true,
  },
  {
    id: "nav-customization",
    label: "Customization",
    href: "/admin/customization",
    icon: "Sliders",
    is_active: true,
    submenus: [
      { id: "sub-cust-announcement", label: "Announcement Bar", href: "/admin/customization/announcementbar" },
      { id: "sub-cust-hero", label: "Hero Banner", href: "/admin/customization/herobanner" },
      { id: "sub-cust-category", label: "Category", href: "/admin/customization/category" },
      { id: "sub-cust-bestsellers", label: "Best Sellers", href: "/admin/customization/bestsellers" },
      { id: "sub-cust-middlebanner", label: "Middle Banner", href: "/admin/customization/middlebanner" },
      { id: "sub-cust-newin", label: "New In", href: "/admin/customization/newin" },
      { id: "sub-cust-seenonyou", label: "Seen On You", href: "/admin/customization/seenonyou" },
      { id: "sub-cust-reviews", label: "Customer Review", href: "/admin/customization/customerreview" },
      { id: "sub-cust-footer", label: "Footer", href: "/admin/customization/footer" },
    ],
  },
  {
    id: "nav-storefront",
    label: "Go To Store Front",
    href: "/",
    icon: "ExternalLink",
    is_active: true,
  },
];
