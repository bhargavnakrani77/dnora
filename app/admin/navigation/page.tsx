"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Link2,
} from "lucide-react";
import { SidebarMenuItem, SidebarSubmenuItem } from "@/types";

export default function AdminNavigationPage() {
  const [items, setItems] = useState<SidebarMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit / Modal state for top-level navigation item
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SidebarMenuItem | null>(null);
  const [formId, setFormId] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formHref, setFormHref] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formIcon, setFormIcon] = useState("ShoppingBag");
  const [formIsActive, setFormIsActive] = useState(true);

  // Submenu manager modal
  const [submenuModalOpen, setSubmenuModalOpen] = useState(false);
  const [selectedParentItem, setSelectedParentItem] = useState<SidebarMenuItem | null>(null);
  const [submenus, setSubmenus] = useState<SidebarSubmenuItem[]>([]);
  const [newSubLabel, setNewSubLabel] = useState("");
  const [newSubHref, setNewSubHref] = useState("");
  const [newSubBadge, setNewSubBadge] = useState("");

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      }
    } catch {
      // ignore
    }
  };

  const fetchNavigation = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/navigation?target=storefront");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        showStatus("error", "Failed to fetch navigation items");
      }
    } catch {
      showStatus("error", "Error loading navigation API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigation();
    fetchCategories();
  }, []);

  // Dynamically compute all active system URLs from existing navigation items + standard luxury routes + live categories
  const activeUrlOptions = React.useMemo(() => {
    const defaultRoutes = [
      { label: "Home (Maison) — /", value: "/" },
      { label: "All Collections — /shop", value: "/shop" },
      { label: "New In Drop — /shop?sort=newest", value: "/shop?sort=newest" },
      { label: "Architectural Totes — /category/tote-bags", value: "/category/tote-bags" },
      { label: "Crossbody Silhouettes — /category/crossbody-bags", value: "/category/crossbody-bags" },
      { label: "Handbags & Top Handles — /category/handbags", value: "/category/handbags" },
      { label: "Shoulder Bags — /category/shoulder-bags", value: "/category/shoulder-bags" },
      { label: "Miniature Evening Bags — /category/mini-bags", value: "/category/mini-bags" },
      { label: "Monochrome Noir — /shop?color=black", value: "/shop?color=black" },
      { label: "Tuscan Tan & Caramel — /shop?color=caramel", value: "/shop?color=caramel" },
      { label: "Best Sellers — /#best-sellers", value: "/#best-sellers" },
      { label: "New Arrivals Section — /#new-arrivals", value: "/#new-arrivals" },
      { label: "Featured Categories — /#categories", value: "/#categories" },
      { label: "Track Your Order — /account?tab=orders", value: "/account?tab=orders" },
      { label: "Member Portal — /account", value: "/account" },
      { label: "Atelier Story — /#story", value: "/#story" },
      { label: "Craftsmanship Editorial — /#editorial", value: "/#editorial" },
    ];

    const dynamicFromCats: { label: string; value: string }[] = categories.map((cat) => ({
      label: `${cat.name} — /category/${cat.slug}`,
      value: `/category/${cat.slug}`,
    }));

    const dynamicFromNav: { label: string; value: string }[] = [];
    items.forEach((item) => {
      if (item.href && !defaultRoutes.some((r) => r.value === item.href) && !dynamicFromNav.some((d) => d.value === item.href)) {
        dynamicFromNav.push({ label: `${item.label} — ${item.href}`, value: item.href });
      }
      item.submenus?.forEach((sub) => {
        if (sub.href && !defaultRoutes.some((r) => r.value === sub.href) && !dynamicFromNav.some((d) => d.value === sub.href)) {
          dynamicFromNav.push({ label: `${sub.label} — ${sub.href}`, value: sub.href });
        }
      });
    });

    // Merge uniquely by value
    const all = [...defaultRoutes];
    [...dynamicFromCats, ...dynamicFromNav].forEach((entry) => {
      if (!all.some((existing) => existing.value === entry.value)) {
        all.push(entry);
      }
    });

    return all;
  }, [items, categories]);

  const saveNavigationToServer = async (newItems: SidebarMenuItem[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "storefront", items: newItems }),
      });

      if (res.ok) {
        setItems(newItems);
        showStatus("success", "Navigation menu updated successfully");
      } else {
        showStatus("error", "Failed to save navigation menu");
      }
    } catch {
      showStatus("error", "Server communication error");
    } finally {
      setSaving(false);
    }
  };

  const openAddItemModal = () => {
    setEditingItem(null);
    setFormId(`nav-${Date.now()}`);
    setFormLabel("");
    setFormHref("/shop");
    setFormBadge("");
    setFormIcon("ShoppingBag");
    setFormIsActive(true);
    setItemModalOpen(true);
  };

  const openEditItemModal = (item: SidebarMenuItem) => {
    setEditingItem(item);
    setFormId(item.id);
    setFormLabel(item.label);
    setFormHref(item.href || "/shop");
    setFormBadge(item.badge || "");
    setFormIcon(item.icon || "ShoppingBag");
    setFormIsActive(item.is_active);
    setItemModalOpen(true);
  };

  const handleSaveItemModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) {
      showStatus("error", "Navigation label is required");
      return;
    }

    let updatedList: SidebarMenuItem[];
    if (editingItem) {
      updatedList = items.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              label: formLabel.trim(),
              href: formHref.trim(),
              badge: formBadge.trim() || undefined,
              icon: formIcon,
              is_active: formIsActive,
            }
          : item
      );
    } else {
      const newItem: SidebarMenuItem = {
        id: formId,
        label: formLabel.trim(),
        href: formHref.trim(),
        badge: formBadge.trim() || undefined,
        icon: formIcon,
        is_active: formIsActive,
        submenus: [],
      };
      updatedList = [...items, newItem];
    }

    await saveNavigationToServer(updatedList);
    setItemModalOpen(false);
  };

  const handleDeleteItem = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to delete navigation tab "${label}"?`)) return;
    const filtered = items.filter((item) => item.id !== id);
    await saveNavigationToServer(filtered);
  };

  const handleToggleActive = async (item: SidebarMenuItem) => {
    const updated = items.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    await saveNavigationToServer(updated);
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const copy = [...items];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    await saveNavigationToServer(copy);
  };

  // Submenu management
  const openSubmenuManager = (item: SidebarMenuItem) => {
    setSelectedParentItem(item);
    setSubmenus(item.submenus || []);
    setNewSubLabel("");
    setNewSubHref("");
    setNewSubBadge("");
    setSubmenuModalOpen(true);
  };

  const handleAddSubmenu = () => {
    if (!newSubLabel.trim() || !newSubHref.trim()) {
      alert("Both subcategory label and link are required");
      return;
    }
    const newSub: SidebarSubmenuItem = {
      id: `sub-${Date.now()}`,
      label: newSubLabel.trim(),
      href: newSubHref.trim(),
      badge: newSubBadge.trim() || undefined,
      is_active: true,
    };
    setSubmenus((prev) => [...prev, newSub]);
    setNewSubLabel("");
    setNewSubHref("");
    setNewSubBadge("");
  };

  const handleDeleteSubmenu = (subId: string) => {
    setSubmenus((prev) => prev.filter((s) => s.id !== subId));
  };

  const handleSaveSubmenus = async () => {
    if (!selectedParentItem) return;
    const finalSubmenus = [...submenus];
    if (newSubLabel.trim() && newSubHref.trim()) {
      finalSubmenus.push({
        id: `sub-${Date.now()}`,
        label: newSubLabel.trim(),
        href: newSubHref.trim(),
        badge: newSubBadge.trim() || undefined,
        is_active: true,
      });
      setNewSubLabel("");
      setNewSubHref("");
      setNewSubBadge("");
    }
    const updated = items.map((item) =>
      item.id === selectedParentItem.id ? { ...item, submenus: finalSubmenus } : item
    );
    await saveNavigationToServer(updated);
    setSubmenuModalOpen(false);
  };

  const activeItems = items.filter((i) => i.is_active);

  return (
    <div className="space-y-8 w-full pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 uppercase">
            Navigation Bar Studio
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Fully control storefront category tabs, badges, URLs, and mega-menu subcategories across desktop and mobile.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchNavigation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openAddItemModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-black rounded-lg hover:bg-neutral-800 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Nav Tab
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div
          className={`flex items-center gap-2.5 p-3.5 text-xs rounded-lg font-medium transition animate-in fade-in ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Live Navigation Bar Preview Box */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-800">
              Live Desktop Navigation Bar Preview
            </h2>
          </div>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-black"
          >
            <span>Open Storefront</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Navigation Bar simulation */}
        <div className="p-6 bg-white border-b border-neutral-100">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-6 sm:gap-8 flex-wrap py-2 border-y border-neutral-100">
            {activeItems.map((item) => (
              <div key={item.id} className="relative group inline-flex items-center gap-1.5 py-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900 group-hover:text-black">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-black text-white rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.submenus && item.submenus.length > 0 && (
                  <span className="text-[9px] text-neutral-400 font-mono">
                    ({item.submenus.length})
                  </span>
                )}
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Items Manager Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
              Active Category Tabs ({items.length})
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Drag or use arrows to change the display sequence. Click &quot;Subcategories&quot; to manage dropdown items.
            </p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {items.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === items.length - 1;
            const subCount = item.submenus?.length || 0;

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  item.is_active ? "bg-white hover:bg-neutral-50/50" : "bg-neutral-50/80 opacity-75"
                }`}
              >
                {/* Left: Tab info */}
                <div className="flex items-center gap-4 min-w-0">
                  <span className="w-6 text-xs font-mono font-bold text-neutral-400">
                    #{index + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-neutral-900 tracking-wide uppercase">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black text-white">
                          {item.badge}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          item.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {item.is_active ? "Active" : "Hidden"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                      <span className="font-mono text-neutral-600">{item.href || "/shop"}</span>
                      {subCount > 0 && (
                        <span className="text-neutral-400">
                          • {subCount} subcategory {subCount === 1 ? "link" : "links"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Reorder Arrows */}
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => handleMoveOrder(index, "up")}
                    className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-md disabled:opacity-30 cursor-pointer"
                    title="Move Left/Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMoveOrder(index, "down")}
                    className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-md disabled:opacity-30 cursor-pointer"
                    title="Move Right/Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Manage Dropdown Subcategories */}
                  <button
                    type="button"
                    onClick={() => openSubmenuManager(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Subcategories ({subCount})</span>
                  </button>

                  {/* Toggle Active */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                      item.is_active
                        ? "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                        : "bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600"
                    }`}
                  >
                    {item.is_active ? "Hide" : "Show"}
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => openEditItemModal(item)}
                    className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                    title="Edit Tab"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id, item.label)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Delete Tab"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Dialog for Tab Create/Edit */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900 uppercase">
                {editingItem ? "Edit Navigation Tab" : "Add Navigation Tab"}
              </h3>
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItemModal} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Tab Label (e.g. NEW IN, HANDBAGS, TOTES)
                </label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black uppercase font-semibold"
                  placeholder="e.g. CROSSBODY"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Destination URL
                </label>
                <select
                  value={activeUrlOptions.some((opt) => opt.value === formHref) ? formHref : "__custom__"}
                  onChange={(e) => {
                    if (e.target.value !== "__custom__") {
                      setFormHref(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-black"
                >
                  <option value="" disabled>Choose Active Link URL...</option>
                  {activeUrlOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="__custom__">Custom / Manual URL...</option>
                </select>
                <input
                  type="text"
                  required
                  value={formHref}
                  onChange={(e) => setFormHref(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black"
                  placeholder="/category/crossbody-bags or /shop"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Optional Badge (e.g. New, Hot, 20% Off)
                </label>
                <input
                  type="text"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black"
                  placeholder="Leave empty for no badge"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-black"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    Visible in Storefront
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setItemModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "Saving..." : editingItem ? "Update Tab" : "Add Tab"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submenus Manager Modal */}
      {submenuModalOpen && selectedParentItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-neutral-900 uppercase">
                  Dropdown Items for: &quot;{selectedParentItem.label}&quot;
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Sub-links that display in the hover mega-menu dropdown and mobile drawer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmenuModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List of current submenus */}
            <div className="my-4 max-h-60 overflow-y-auto divide-y divide-neutral-100 border border-neutral-200 rounded-xl p-2 bg-neutral-50/50">
              {submenus.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-400">
                  No subcategory links yet. Add one below!
                </div>
              ) : (
                submenus.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-2.5 flex items-center justify-between gap-3 bg-white rounded-lg mb-1"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-900">{sub.label}</span>
                        {sub.badge && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-neutral-100 rounded text-neutral-700">
                            {sub.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400">{sub.href}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubmenu(sub.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                      title="Remove sublink"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add new subcategory input form */}
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
                Add Subcategory Link
              </span>
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Subcategory Label *
                    </label>
                    <input
                      type="text"
                      value={newSubLabel}
                      onChange={(e) => setNewSubLabel(e.target.value)}
                      placeholder="e.g. Architectural Totes"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Select Link from Active URLs *
                    </label>
                    <select
                      value={activeUrlOptions.some((opt) => opt.value === newSubHref) ? newSubHref : "__custom__"}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== "__custom__") {
                          setNewSubHref(val);
                          if (!newSubLabel.trim()) {
                            const found = activeUrlOptions.find((o) => o.value === val);
                            if (found) {
                              const cleanName = found.label.split(" — ")[0].trim();
                              setNewSubLabel(cleanName);
                            }
                          }
                        }
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-md font-mono"
                    >
                      <option value="" disabled>Choose Active Link URL...</option>
                      {activeUrlOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      <option value="__custom__">Custom URL / Manual Input...</option>
                    </select>
                  </div>
                </div>
                <input
                  type="text"
                  value={newSubHref}
                  onChange={(e) => setNewSubHref(e.target.value)}
                  placeholder="Or enter custom URL: /category/... or /shop?..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-md font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubBadge}
                  onChange={(e) => setNewSubBadge(e.target.value)}
                  placeholder="Optional badge (e.g. Exclusive)"
                  className="px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-md flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddSubmenu}
                  className="px-3 py-1.5 text-xs font-bold uppercase bg-black text-white rounded-md hover:bg-neutral-800 transition cursor-pointer shrink-0"
                >
                  Add Link
                </button>
              </div>
            </div>

            {/* Save submenus footer */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100 mt-4">
              <button
                type="button"
                onClick={() => setSubmenuModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSubmenus}
                disabled={saving}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving..." : "Save Subcategories"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
