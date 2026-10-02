"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutList,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Layers,
  Sparkles,
  Star,
  Tag,
  ShoppingBag,
  Grid,
  Check,
  X,
} from "lucide-react";
import { HomepageSection, HomepageSectionType, ProductCategory, Product } from "@/types";

export default function AdminHomepageSectionsPage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formType, setFormType] = useState<HomepageSectionType>("category");
  const [formCategorySlug, setFormCategorySlug] = useState("");
  const [formProductIds, setFormProductIds] = useState<string[]>([]);
  const [formDisplayStyle, setFormDisplayStyle] = useState<"grid" | "carousel">("grid");
  const [formLimit, setFormLimit] = useState(8);
  const [formViewAllLink, setFormViewAllLink] = useState("/shop");
  const [formViewAllText, setFormViewAllText] = useState("VIEW ALL");
  const [formIsActive, setFormIsActive] = useState(true);

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [secRes, catRes, prodRes] = await Promise.all([
        fetch("/api/homepage-sections"),
        fetch("/api/categories"),
        fetch("/api/products"),
      ]);

      if (secRes.ok) {
        const secJson = await secRes.json();
        setSections(secJson.sections || []);
      }
      if (catRes.ok) {
        const catJson = await catRes.json();
        const cats = catJson.data || [];
        setCategories(cats);
        if (cats.length > 0 && !formCategorySlug) {
          setFormCategorySlug(cats[0].slug);
        }
      }
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        setProducts(prodJson.products || []);
      }
    } catch {
      showStatus("error", "Failed to load homepage sections data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingSection(null);
    setFormTitle("");
    setFormSubtitle("");
    setFormType("category");
    setFormCategorySlug(categories[0]?.slug || "");
    setFormProductIds([]);
    setFormDisplayStyle("grid");
    setFormLimit(8);
    setFormViewAllLink("/shop");
    setFormViewAllText("VIEW ALL");
    setFormIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (sec: HomepageSection) => {
    setEditingSection(sec);
    setFormTitle(sec.title);
    setFormSubtitle(sec.subtitle || "");
    setFormType(sec.type);
    setFormCategorySlug(sec.category_slug || categories[0]?.slug || "");
    setFormProductIds(sec.product_ids || []);
    setFormDisplayStyle(sec.display_style || "grid");
    setFormLimit(sec.limit || 8);
    setFormViewAllLink(sec.view_all_link || "/shop");
    setFormViewAllText(sec.view_all_text || "VIEW ALL");
    setFormIsActive(sec.is_active);
    setModalOpen(true);
  };

  const handleToggleProductSelection = (prodId: string) => {
    setFormProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  // Reordering
  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Update sort_order
    const reordered = updated.map((s, idx) => ({ ...s, sort_order: idx + 1 }));
    setSections(reordered);

    try {
      await fetch("/api/homepage-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: reordered }),
      });
      showStatus("success", "Section order updated");
    } catch {
      showStatus("error", "Failed to update order");
    }
  };

  // Toggle active
  const handleToggleActive = async (sectionId: string) => {
    const updated = sections.map((s) =>
      s.id === sectionId ? { ...s, is_active: !s.is_active } : s
    );
    setSections(updated);

    try {
      await fetch("/api/homepage-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: updated }),
      });
      showStatus("success", "Section visibility updated");
    } catch {
      showStatus("error", "Failed to update status");
    }
  };

  // Delete Section
  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    try {
      const res = await fetch(`/api/homepage-sections?id=${sectionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
        showStatus("success", "Section deleted successfully");
      } else {
        showStatus("error", "Failed to delete section");
      }
    } catch {
      showStatus("error", "Error deleting section");
    }
  };

  // Submit Modal
  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Please enter a section title.");
      return;
    }

    setSaving(true);
    try {
      const sectionPayload: HomepageSection = {
        id: editingSection?.id || `sec-${Date.now()}`,
        title: formTitle.trim(),
        subtitle: formSubtitle.trim() || undefined,
        type: formType,
        category_slug: formType === "category" ? formCategorySlug : undefined,
        product_ids: formType === "custom_products" ? formProductIds : undefined,
        display_style: formDisplayStyle,
        limit: formLimit,
        view_all_link: formViewAllLink.trim() || "/shop",
        view_all_text: formViewAllText.trim() || "VIEW ALL",
        is_active: formIsActive,
        sort_order: editingSection?.sort_order ?? sections.length + 1,
      };

      const res = await fetch("/api/homepage-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: sectionPayload }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save section");
      }

      setSections(data.sections || []);
      setModalOpen(false);
      showStatus("success", editingSection ? "Section updated!" : "New section created!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving section";
      showStatus("error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-medium tracking-wider uppercase">
            <span>Storefront</span>
            <span>/</span>
            <span className="text-neutral-700 font-semibold">Home Sections</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <LayoutList className="w-5 h-5 text-neutral-800" />
            Homepage Section Manager
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Create and organize product sections on the storefront homepage (Best Sellers, New In, Categories, or Custom Product curations).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:text-black rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Live Home</span>
          </Link>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Section</span>
          </button>
        </div>
      </div>

      <div className="w-full pt-6">
        {/* Status Msg */}
        {statusMsg && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-neutral-400 hover:text-black">
              ✕
            </button>
          </div>
        )}

        {/* Section List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-black" />
            <span className="text-xs font-medium">Loading homepage sections...</span>
          </div>
        ) : sections.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-xs">
            <Layers className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-neutral-800">No Homepage Sections Defined</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              Create your first homepage section (e.g. Best Sellers, New Arrivals, or a custom category showcase).
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Section</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {sections.map((sec, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === sections.length - 1;

              return (
                <div
                  key={sec.id}
                  className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
                    sec.is_active ? "border-neutral-200" : "border-neutral-200/60 opacity-60 bg-neutral-50/50"
                  }`}
                >
                  {/* Left: Reorder & Info */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    {/* Move controls */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, "up")}
                        disabled={isFirst}
                        className="p-1 rounded-md text-neutral-400 hover:text-black hover:bg-neutral-100 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-bold text-neutral-400 font-mono">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, "down")}
                        disabled={isLast}
                        className="p-1 rounded-md text-neutral-400 hover:text-black hover:bg-neutral-100 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Section details */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
                          {sec.title}
                        </h3>

                        {/* Type badge */}
                        {sec.type === "best_sellers" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Star className="w-2.5 h-2.5 fill-amber-700" /> Best Sellers
                          </span>
                        )}
                        {sec.type === "new_in" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            <Sparkles className="w-2.5 h-2.5" /> New In
                          </span>
                        )}
                        {sec.type === "category" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Tag className="w-2.5 h-2.5" /> Category: {sec.category_slug}
                          </span>
                        )}
                        {sec.type === "custom_products" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            <ShoppingBag className="w-2.5 h-2.5" /> Custom Products ({sec.product_ids?.length || 0})
                          </span>
                        )}

                        {/* Grid format badge */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-600">
                          <Grid className="w-2.5 h-2.5" /> 2 Mobile / 4 Desktop Grid
                        </span>
                      </div>

                      {sec.subtitle && (
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{sec.subtitle}</p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1.5">
                        <span>Max items: <strong>{sec.limit || 8}</strong></span>
                        <span>•</span>
                        <span>Link: <strong>{sec.view_all_link || "/shop"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Active toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(sec.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
                        sec.is_active
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border border-neutral-200"
                      }`}
                    >
                      {sec.is_active ? "Active" : "Hidden"}
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(sec)}
                      className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Section"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete button (only custom sections or allowed for all) */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(sec.id)}
                      className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT SECTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                  {editingSection ? "Edit Homepage Section" : "Create New Homepage Section"}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Configure products and layout to be rendered dynamically on the storefront.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSection} className="p-5 sm:p-6 space-y-5">
              {/* Title & Subtitle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Section Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. THE FLORENTINE TOTE COLLECTION"
                  required
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-black uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Section Subtitle (Optional narrative)
                </label>
                <input
                  type="text"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="e.g. Handcrafted in limited editions by master Tuscan artisans."
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-black"
                />
              </div>

              {/* Source Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                  Product Source (What to display?)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType("best_sellers")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formType === "best_sellers"
                        ? "border-black bg-neutral-900 text-white shadow-xs"
                        : "border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100"
                    }`}
                  >
                    <Star className="w-4 h-4 mb-1" />
                    <div className="text-xs font-bold">Best Sellers</div>
                    <div className="text-[10px] opacity-75">Flagged products</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType("new_in")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formType === "new_in"
                        ? "border-black bg-neutral-900 text-white shadow-xs"
                        : "border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mb-1" />
                    <div className="text-xs font-bold">New In</div>
                    <div className="text-[10px] opacity-75">Latest arrivals</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType("category")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formType === "category"
                        ? "border-black bg-neutral-900 text-white shadow-xs"
                        : "border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100"
                    }`}
                  >
                    <Tag className="w-4 h-4 mb-1" />
                    <div className="text-xs font-bold">Category</div>
                    <div className="text-[10px] opacity-75">Specific silhouette</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType("custom_products")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formType === "custom_products"
                        ? "border-black bg-neutral-900 text-white shadow-xs"
                        : "border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 mb-1" />
                    <div className="text-xs font-bold">Custom Pick</div>
                    <div className="text-[10px] opacity-75">Select products</div>
                  </button>
                </div>
              </div>

              {/* If Type == Category, show category selector */}
              {formType === "category" && (
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Select Silhouette Category
                  </label>
                  <select
                    value={formCategorySlug}
                    onChange={(e) => {
                      setFormCategorySlug(e.target.value);
                      setFormViewAllLink(`/category/${e.target.value}`);
                    }}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:border-black cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* If Type == Custom Products, show multi-select list */}
              {formType === "custom_products" && (
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Select Products ({formProductIds.length} selected)
                    </label>
                    <span className="text-[11px] text-neutral-500">Tap to toggle</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {products.map((prod) => {
                      const isSelected = formProductIds.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleToggleProductSelection(prod.id)}
                          className={`p-2 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-black text-white border-black"
                              : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-8 h-10 rounded bg-neutral-200 overflow-hidden shrink-0">
                              {prod.images?.[0] && (
                                <Image
                                  src={prod.images[0].secure_url}
                                  alt={prod.name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <span className="text-xs font-medium line-clamp-1">{prod.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono opacity-80">₹{prod.price}</span>
                            {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Limit & Grid Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Max Products to Show
                  </label>
                  <select
                    value={formLimit}
                    onChange={(e) => setFormLimit(parseInt(e.target.value, 10))}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white cursor-pointer"
                  >
                    <option value={4}>4 Products (1 row on desktop, 2 on mobile)</option>
                    <option value={8}>8 Products (2 rows on desktop, 4 on mobile)</option>
                    <option value={12}>12 Products (3 rows on desktop, 6 on mobile)</option>
                    <option value={16}>16 Products</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Display Layout
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 flex items-center gap-2">
                    <Grid className="w-4 h-4 text-neutral-800" />
                    <span>2 on Mobile, 4 on Big Screen (Responsive Grid)</span>
                  </div>
                </div>
              </div>

              {/* View All Text & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    View All Button Text
                  </label>
                  <input
                    type="text"
                    value={formViewAllText}
                    onChange={(e) => setFormViewAllText(e.target.value)}
                    placeholder="VIEW ALL"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 uppercase font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    View All Link Destination
                  </label>
                  <input
                    type="text"
                    value={formViewAllLink}
                    onChange={(e) => setFormViewAllLink(e.target.value)}
                    placeholder="/shop"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Show Section on Storefront
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    When checked, this section will immediately render on the home page.
                  </p>
                </div>
              </label>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Section</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
