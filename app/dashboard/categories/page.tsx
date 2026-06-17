"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConfirmModal } from "@/components/dashboard/ConfirmModal";
import { SlideOver } from "@/components/dashboard/SlideOver";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  products: { count: number }[];
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
};

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
};

export default function CategoriesPage() {
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*, products(count)")
      .order("sort_order");

    if (error) {
      toast.error("Failed to load categories");
    } else {
      setCategories((data as Category[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAdd = () => {
    setEditingCategory(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      image_url: cat.image_url ?? "",
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || slugify(formData.name),
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id);
        if (error) throw error;
        toast.success("Category updated");
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
        toast.success("Category created");
      }

      setShowForm(false);
      await fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);

    if (error) {
      toast.error("Failed to update");
    } else {
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
      );
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", confirmDelete.id);
      if (error) throw error;
      toast.success("Category deleted");
      setConfirmDelete(null);
      await fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const getProductCount = (cat: Category) =>
    cat.products?.[0]?.count ?? 0;

  const activeCount = categories.filter((c) => c.is_active).length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-3xl font-bold text-white">Categories</h1>
          <p className="text-[#A0A0A0] text-sm mt-1">
            {categories.length} categories · {activeCount} active
          </p>
        </div>
        <button onClick={openAdd} className="bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Category List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl">
          <EmptyState
            title="No categories yet"
            description="Create your first category to organise products"
            icon={Layers}
            action={{ label: "Add Category", onClick: openAdd }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const productCount = getProductCount(cat);
            return (
              <div
                key={cat.id}
                className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-4 flex items-center gap-4"
              >
                {/* Image */}
                <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] overflow-hidden shrink-0 flex items-center justify-center">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Layers className="w-5 h-5 text-[#555]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-syne font-bold text-white text-sm">{cat.name}</p>
                  <p className="text-xs text-[#555] mt-0.5">/{cat.slug}</p>
                </div>

                {/* Product count */}
                <div className="px-3 py-1 rounded-full bg-[#1A1A1A] text-xs text-[#A0A0A0]">
                  {productCount} products
                </div>

                {/* Sort order */}
                <div className="px-3 py-1 rounded-full bg-[#1A1A1A] text-xs text-[#555]">
                  Order: {cat.sort_order}
                </div>

                {/* Active Toggle */}
                <button
                  onClick={() => handleToggleActive(cat)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${
                    cat.is_active ? "bg-[#C8F04B]" : "bg-[#2A2A2A]"
                  }`}
                  style={{ minWidth: "40px", height: "22px" }}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform ${
                      cat.is_active ? "translate-x-[18px]" : "translate-x-0"
                    }`}
                  />
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEdit(cat)}
                  className="p-2 rounded-lg text-[#555] hover:text-white hover:bg-[#1A1A1A] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => setConfirmDelete(cat)}
                  className="p-2 rounded-lg text-[#555] hover:text-red-400 hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit SlideOver */}
      <SlideOver
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingCategory ? "Edit Category" : "Add Category"}
        subtitle={editingCategory ? `Editing: ${editingCategory.name}` : "Create a new product category"}
      >
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  name,
                  slug: slugify(name),
                }));
              }}
              placeholder="e.g. Grains & Cereals"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555]"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="grains-cereals"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555] font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this category..."
              rows={3}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555] resize-none"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">Image URL</label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555]"
            />
            {formData.image_url && (
              <div className="mt-2 rounded-xl overflow-hidden w-20 h-20 bg-[#1A1A1A]">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Sort Order */}
          <div>
            <label className="text-xs text-[#555] uppercase tracking-wider mb-1.5 block">Sort Order</label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value, 10) || 0 }))}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2.5 text-white text-sm focus:border-[#C8F04B] outline-none"
            />
          </div>

          {/* Active */}
          <div className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-xl">
            <div>
              <p className="text-sm text-white font-semibold">Active</p>
              <p className="text-xs text-[#555] mt-0.5">Visible to customers</p>
            </div>
            <button
              onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
              className={`relative rounded-full transition-colors`}
              style={{
                width: "40px",
                height: "22px",
                backgroundColor: formData.is_active ? "#C8F04B" : "#2A2A2A",
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform"
                style={{ transform: formData.is_active ? "translateX(18px)" : "translateX(0)" }}
              />
            </button>
          </div>

          {/* Save */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 border border-[#2A2A2A] text-white rounded-full px-5 py-2.5 text-sm hover:border-[#444] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#C8F04B] text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {saving ? "Saving…" : editingCategory ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </SlideOver>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={
          confirmDelete && getProductCount(confirmDelete) > 0
            ? `Cannot delete: reassign ${getProductCount(confirmDelete)} product(s) first`
            : `Delete "${confirmDelete?.name}"? This cannot be undone.`
        }
        danger
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  );
}
