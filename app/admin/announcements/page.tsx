"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sliders,
  Sparkles,
} from "lucide-react";
import { AnnouncementConfig, AnnouncementItem } from "@/types";
import { DestinationLinkSelect } from "@/components/admin/DestinationLinkSelect";

export default function AnnouncementsAdminPage() {
  const [config, setConfig] = useState<AnnouncementConfig>({
    id: "default",
    interval_seconds: 4,
    is_active: true,
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New item modal or form state
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [itemText, setItemText] = useState("");
  const [itemLink, setItemLink] = useState("/shop");
  const [itemActive, setItemActive] = useState(true);

  // Load config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data: AnnouncementConfig = await res.json();
          if (data && Array.isArray(data.items)) {
            setConfig(data);
          }
        }
      } catch (err) {
        console.error("Failed to load announcements:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSaveConfig = async (newConfig?: AnnouncementConfig) => {
    setSaving(true);
    setStatusMessage(null);
    const toSave = newConfig || config;

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save announcement bar config.");
      }

      setStatusMessage({ type: "success", text: "Announcement bar saved and synchronized live!" });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error saving config.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setItemText("");
    setItemLink("/shop");
    setItemActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AnnouncementItem) => {
    setEditingItem(item);
    setItemText(item.text);
    setItemLink(item.link || "/shop");
    setItemActive(item.is_active);
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemText.trim()) return;

    let updatedItems: AnnouncementItem[];

    if (editingItem) {
      // Edit existing
      updatedItems = config.items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              text: itemText.trim(),
              link: itemLink.trim() || "/shop",
              is_active: itemActive,
            }
          : it
      );
    } else {
      // Create new
      const newItem: AnnouncementItem = {
        id: `ann-${Date.now()}`,
        text: itemText.trim(),
        link: itemLink.trim() || "/shop",
        is_active: itemActive,
        sort_order: config.items.length + 1,
      };
      updatedItems = [...config.items, newItem];
    }

    const newConf = { ...config, items: updatedItems };
    setConfig(newConf);
    setIsModalOpen(false);
    handleSaveConfig(newConf);
  };

  const handleDeleteItem = (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    const updatedItems = config.items.filter((it) => it.id !== id);
    const newConf = { ...config, items: updatedItems };
    setConfig(newConf);
    handleSaveConfig(newConf);
  };

  const handleToggleItemActive = (id: string) => {
    const updatedItems = config.items.map((it) =>
      it.id === id ? { ...it, is_active: !it.is_active } : it
    );
    const newConf = { ...config, items: updatedItems };
    setConfig(newConf);
    handleSaveConfig(newConf);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs uppercase font-mono tracking-widest text-neutral-400">
        Loading Announcement Bar Customizer...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight uppercase">
            Announcement Bar Customizer
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Manage top ticker messages, interval timing, and live display settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Announcement</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveConfig()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Status Feedback */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Live Preview Box */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
            Live Storefront Preview
          </span>
          <span className="text-[11px] text-neutral-500">
            {config.is_active ? "🟢 Visible on Storefront" : "🔴 Hidden on Storefront"}
          </span>
        </div>

        {/* Render Preview */}
        <div className="rounded-lg overflow-hidden border border-neutral-300 shadow-xs">
          <div className="bg-[#e5e5e8] text-neutral-950 px-4 py-2 flex items-center justify-between text-xs min-h-[34px]">
            <ChevronLeft className="w-3.5 h-3.5 text-neutral-500" />
            <div className="flex-1 text-center font-semibold tracking-wider uppercase text-[11px]">
              {config.items.find((i) => i.is_active)?.text || "✦ COMPLIMENTARY EXPRESS DELIVERY ON ALL ORDERS ✦"}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Global Settings Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-3">
          Global Display Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Active Switch */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 border border-neutral-200">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                Announcement Bar Visible
              </label>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Toggle display across the entire storefront
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.is_active}
              onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
              className="w-5 h-5 accent-neutral-950 cursor-pointer"
            />
          </div>

          {/* Interval Slider */}
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Rotation Interval (Seconds)
              </label>
              <span className="text-xs font-mono font-bold text-neutral-950 bg-white px-2 py-0.5 rounded border border-neutral-200">
                {config.interval_seconds}s
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="15"
              step="1"
              value={config.interval_seconds}
              onChange={(e) => setConfig({ ...config, interval_seconds: Number(e.target.value) })}
              className="w-full accent-neutral-950 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Fast (2s)</span>
              <span>Default (4s)</span>
              <span>Slow (15s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Items Table */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            Announcement Items ({config.items.length})
          </h3>
          <span className="text-xs text-neutral-400">
            Items rotate automatically on the storefront
          </span>
        </div>

        {config.items.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500 bg-neutral-50 rounded-lg border border-dashed border-neutral-200 space-y-2">
            <p>No custom announcements created yet.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="text-xs font-bold text-neutral-950 underline cursor-pointer"
            >
              + Add your first announcement message
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
            {config.items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-neutral-900 uppercase tracking-wide">
                      {item.text}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Target Link: <span className="font-mono text-neutral-600">{item.link || "/shop"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {/* Active Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleItemActive(item.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      item.is_active
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                    }`}
                  >
                    {item.is_active ? "Active" : "Disabled"}
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                    title="Edit Item"
                    aria-label="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Delete Item"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative bg-white border border-neutral-200 rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-150 space-y-6">
            <h3 className="text-base font-bold text-neutral-900 uppercase tracking-wide">
              {editingItem ? "Edit Announcement" : "Create New Announcement"}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Announcement Message Text *
                </label>
                <input
                  type="text"
                  required
                  value={itemText}
                  onChange={(e) => setItemText(e.target.value)}
                  placeholder="e.g. COMPLIMENTARY EXPRESS DELIVERY ON ORDERS OVER ₹15,000"
                  className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-xs text-neutral-900 uppercase focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <DestinationLinkSelect
                  value={itemLink}
                  onChange={setItemLink}
                  label="Destination Link (URL)"
                  placeholder="/shop or /category/tote-bags"
                  helperText="Choose an active page, category, or product from dropdown, or customize the URL."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={itemActive}
                  onChange={(e) => setItemActive(e.target.checked)}
                  className="w-4 h-4 accent-neutral-950 cursor-pointer"
                />
                <label htmlFor="activeToggle" className="text-xs font-semibold text-neutral-800 cursor-pointer">
                  Publish this announcement immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-neutral-950 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-all cursor-pointer shadow-md"
                >
                  {editingItem ? "Update Item" : "Add Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
