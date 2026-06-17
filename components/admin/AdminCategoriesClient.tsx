"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, Pencil, Trash2, Plus, Check, X, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Category {
  id: string; name: string; slug: string; description: string | null;
  image_url: string | null; sort_order: number; is_active: boolean;
}

interface EditState {
  name: string;
  description: string;
  image_url: string;
}

export function AdminCategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: "", description: "", image_url: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImage, setNewImage] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const editFileRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function uploadCategoryImage(file: File, categoryId: string | "new"): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditState({ name: cat.name, description: cat.description || "", image_url: cat.image_url || "" });
  };

  const saveEdit = async (id: string) => {
    if (!editState.name.trim()) return;
    setIsLoading(true);
    const { error } = await supabase.from("categories").update({
      name: editState.name,
      description: editState.description || null,
      image_url: editState.image_url || null,
    }).eq("id", id);
    if (error) { toast.error(error.message); } else {
      toast.success("Category updated");
      setEditingId(null);
      router.refresh();
    }
    setIsLoading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("categories").update({ is_active: !active }).eq("id", id);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: !active } : c));
    toast.success(active ? "Category hidden" : "Category shown");
  };

  const addCategory = async () => {
    if (!newName.trim()) return;
    setIsLoading(true);
    const slug = newName.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-");
    const { error } = await supabase.from("categories").insert({
      name: newName, slug, description: newDesc || null,
      image_url: newImage || null,
      sort_order: categories.length + 1,
    });
    if (error) { toast.error(error.message); } else {
      toast.success("Category added");
      setNewName(""); setNewDesc(""); setNewImage(""); setShowAdd(false);
      router.refresh();
    }
    setIsLoading(false);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Products in it will become uncategorised.")) return;
    await supabase.from("categories").delete().eq("id", id);
    setCategories(prev => prev.filter(c => c.id !== id));
    toast.success("Category deleted");
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setShowAdd(true)}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105">
        <Plus className="h-4 w-4" /> Add Category
      </button>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/30 dark:bg-[#111]">
            <h3 className="mb-4 font-syne font-bold">New Category</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name"
                  className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Short description"
                  className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Category Image</label>
                <div className="mt-1 flex gap-2">
                  <input value={newImage} onChange={e => setNewImage(e.target.value)} placeholder="Paste image URL, or upload"
                    className="flex-1 h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    disabled={uploadingFor === "new"}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-muted px-3 text-sm font-medium hover:bg-muted/70 disabled:opacity-50 whitespace-nowrap">
                    {uploadingFor === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload
                  </button>
                  <input type="file" accept="image/*" ref={fileRef} className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingFor("new");
                      const url = await uploadCategoryImage(file, "new");
                      if (url) setNewImage(url);
                      setUploadingFor(null);
                      e.target.value = "";
                    }} />
                </div>
                {newImage && (
                  <div className="mt-2 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={newImage} alt="" className="h-12 w-20 rounded-lg object-cover border border-border" />
                    <span className="text-xs text-muted-foreground truncate max-w-xs">{newImage}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={addCategory} disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Save</>}
              </button>
              <button onClick={() => { setShowAdd(false); setNewName(""); setNewDesc(""); setNewImage(""); }}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border/30 dark:bg-[#111] overflow-hidden">
        {categories.map((cat) => (
          <div key={cat.id} className="border-b border-border/20 last:border-0">
            {editingId === cat.id ? (
              /* ── EXPANDED EDIT ROW ── */
              <div className="p-4 space-y-3 bg-muted/20">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Name</label>
                    <input value={editState.name} onChange={e => setEditState(s => ({ ...s, name: e.target.value }))} autoFocus
                      className="mt-1 h-9 w-full rounded-lg border border-border px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                    <input value={editState.description} onChange={e => setEditState(s => ({ ...s, description: e.target.value }))}
                      className="mt-1 h-9 w-full rounded-lg border border-border px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Category Image</label>
                    <div className="mt-1 flex gap-2">
                      <input value={editState.image_url} onChange={e => setEditState(s => ({ ...s, image_url: e.target.value }))}
                        placeholder="Paste image URL, or upload"
                        className="flex-1 h-9 rounded-lg border border-border px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
                      <button type="button" onClick={() => editFileRef.current?.click()}
                        disabled={uploadingFor === cat.id}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 text-sm font-medium hover:bg-muted/70 disabled:opacity-50 whitespace-nowrap">
                        {uploadingFor === cat.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Upload
                      </button>
                      <input type="file" accept="image/*" ref={editFileRef} className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingFor(cat.id);
                          const url = await uploadCategoryImage(file, cat.id);
                          if (url) setEditState(s => ({ ...s, image_url: url }));
                          setUploadingFor(null);
                          e.target.value = "";
                        }} />
                    </div>
                    {editState.image_url && (
                      <div className="mt-2 flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={editState.image_url} alt="" className="h-12 w-20 rounded-lg object-cover border border-border" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(cat.id)} disabled={isLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5" /> Save</>}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── NORMAL ROW ── */
              <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                {/* Image preview */}
                {cat.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.image_url} alt={cat.name} className="h-10 w-14 rounded-lg object-cover border border-border shrink-0" />
                ) : (
                  <div className="h-10 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{cat.name}</p>
                  {cat.description && <p className="text-xs text-muted-foreground truncate">{cat.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(cat.id, cat.is_active)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cat.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {cat.is_active ? "Active" : "Hidden"}
                  </button>
                  <button onClick={() => startEdit(cat)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteCategory(cat.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
