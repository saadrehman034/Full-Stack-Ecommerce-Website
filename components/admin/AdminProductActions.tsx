"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Eye, ToggleLeft, Trash2, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AdminProductActions({ productId, slug, isActive }: { productId: string; slug: string; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const toggleActive = async () => {
    const supabase = createClient();
    await supabase.from("products").update({ is_active: !isActive }).eq("id", productId);
    toast.success(isActive ? "Product deactivated" : "Product activated");
    router.refresh();
    setOpen(false);
  };

  const deleteProduct = async () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", productId);
    toast.success("Product deleted");
    router.refresh();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-border bg-white py-1 shadow-lg dark:bg-[#111]">
            <Link href={`/admin/products/${productId}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
            <Link href={`/products/${slug}`} target="_blank"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <Eye className="h-3.5 w-3.5" /> View Live
            </Link>
            <button onClick={toggleActive}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <ToggleLeft className="h-3.5 w-3.5" /> {isActive ? "Deactivate" : "Activate"}
            </button>
            <button onClick={deleteProduct}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
