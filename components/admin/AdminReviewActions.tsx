"use client";

import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AdminReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();

  const deleteReview = async () => {
    if (!confirm("Delete this review?")) return;
    const supabase = createClient();
    await supabase.from("reviews").delete().eq("id", reviewId);
    toast.success("Review deleted");
    router.refresh();
  };

  return (
    <button onClick={deleteReview} className="text-muted-foreground hover:text-destructive transition-colors">
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
