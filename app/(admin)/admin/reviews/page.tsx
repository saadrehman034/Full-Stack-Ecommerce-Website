import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Star } from "lucide-react";
import { AdminReviewActions } from "@/components/admin/AdminReviewActions";

export const revalidate = 30;

export default async function AdminReviewsPage() {
  const supabase = createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, products(name), users(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6">
      <div>
        <h1 className="font-syne text-2xl md:text-3xl font-bold">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">{reviews?.length || 0} reviews</p>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border/30 dark:bg-[#111] overflow-x-auto">
        {!reviews?.length ? (
          <p className="px-6 py-16 text-center text-muted-foreground">No reviews yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                {["Product", "Customer", "Rating", "Review", "Date", "Verified", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map((r: any) => (
                <tr key={r.id} className="border-b border-border/20 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{r.products?.name || "â€”"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.users?.full_name || "Anonymous"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-[#C8F04B] text-[#C8F04B]" : "text-muted-foreground/40"}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[240px]">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{r.body || "â€”"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    {r.is_verified_purchase ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">Verified</span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Unverified</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <AdminReviewActions reviewId={r.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

