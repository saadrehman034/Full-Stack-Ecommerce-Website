"use client";

import { useEffect, useState, useMemo } from "react";
import { Star, Search, Trash2, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, truncate } from "@/lib/utils";
import { toast } from "sonner";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConfirmModal } from "@/components/dashboard/ConfirmModal";

type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  body: string;
  is_verified_purchase: boolean;
  created_at: string;
  products: { name: string } | null;
  users: { full_name: string | null; email: string } | null;
};

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={n <= rating ? "fill-[#C8F04B] text-[#C8F04B]" : "fill-transparent text-[#333]"}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const supabase = createClient();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*, products(name), users(full_name, email)")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load reviews");
    } else {
      setReviews((data as unknown as Review[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Summary stats
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const starBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: totalReviews > 0
      ? (reviews.filter((r) => r.rating === star).length / totalReviews) * 100
      : 0,
  }));

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (starFilter !== null && r.rating !== starFilter) return false;
      if (productSearch) {
        const q = productSearch.toLowerCase();
        if (!(r.products?.name ?? "").toLowerCase().includes(q)) return false;
      }
      if (verifiedFilter === "verified" && !r.is_verified_purchase) return false;
      if (verifiedFilter === "unverified" && r.is_verified_purchase) return false;
      return true;
    });
  }, [reviews, starFilter, productSearch, verifiedFilter]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", confirmDelete.id);
      if (error) throw error;
      toast.success("Review deleted");
      setConfirmDelete(null);
      await fetchReviews();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-syne text-3xl font-bold text-white">Reviews</h1>
        <p className="text-[#A0A0A0] text-sm mt-1">Monitor and moderate customer reviews</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-6">
        {/* Rating Overview */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="font-syne text-5xl font-bold text-white">{avgRating.toFixed(1)}</p>
              <StarRating rating={Math.round(avgRating)} size={16} />
              <p className="text-xs text-[#555] mt-1">{totalReviews} reviews</p>
            </div>
            <div className="flex-1 space-y-2">
              {starBreakdown.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-[#555] w-4">{star}</span>
                  <Star className="w-3 h-3 text-[#C8F04B] fill-[#C8F04B]" />
                  <div className="flex-1 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C8F04B] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#555] w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm text-[#A0A0A0]">Total Reviews</p>
            <p className="font-syne text-4xl font-bold text-white mt-1">{totalReviews}</p>
          </div>
          <div className="flex items-center gap-6 mt-4">
            <div>
              <p className="text-xs text-[#555]">Verified</p>
              <p className="text-lg font-bold text-green-400">
                {reviews.filter((r) => r.is_verified_purchase).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#555]">Unverified</p>
              <p className="text-lg font-bold text-[#A0A0A0]">
                {reviews.filter((r) => !r.is_verified_purchase).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#555]">5-Star</p>
              <p className="text-lg font-bold text-[#C8F04B]">
                {reviews.filter((r) => r.rating === 5).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Star filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStarFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              starFilter === null
                ? "bg-[#C8F04B] text-black font-semibold"
                : "border border-[#2A2A2A] text-[#A0A0A0] hover:border-[#444]"
            }`}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(starFilter === s ? null : s)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1 ${
                starFilter === s
                  ? "bg-[#C8F04B] text-black font-semibold"
                  : "border border-[#2A2A2A] text-[#A0A0A0] hover:border-[#444]"
              }`}
            >
              {s} <Star className="w-3 h-3" />
            </button>
          ))}
        </div>

        {/* Verified filter */}
        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value as "all" | "verified" | "unverified")}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2 text-white text-sm focus:border-[#C8F04B] outline-none"
        >
          <option value="all">All Reviews</option>
          <option value="verified">Verified Only</option>
          <option value="unverified">Unverified Only</option>
        </select>

        {/* Product search */}
        <div className="relative ml-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input
            type="text"
            placeholder="Search by product..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] pl-10 pr-3.5 py-2 text-white text-sm focus:border-[#C8F04B] outline-none placeholder:text-[#555] w-52"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#161616] text-[11px] text-[#666] uppercase tracking-wider">
              <th className="px-6 py-3 text-left">Product</th>
              <th className="px-6 py-3 text-left">Customer</th>
              <th className="px-6 py-3 text-left">Rating</th>
              <th className="px-6 py-3 text-left">Review</th>
              <th className="px-6 py-3 text-left">Verified</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-[#1A1A1A] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredReviews.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState title="No reviews found" icon={MessageSquare} />
                </td>
              </tr>
            ) : (
              filteredReviews.map((review) => (
                <tr key={review.id} className="border-b border-[#1A1A1A] hover:bg-[#161616] transition-colors">
                  <td className="px-6 py-4 text-sm text-white font-semibold max-w-[160px]">
                    {review.products?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                    {review.users?.full_name ?? review.users?.email ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <StarRating rating={review.rating} />
                  </td>
                  <td className="px-6 py-4 text-sm text-[#A0A0A0] max-w-[220px]">
                    <p className="line-clamp-2">{review.body}</p>
                  </td>
                  <td className="px-6 py-4">
                    {review.is_verified_purchase ? (
                      <span className="text-[11px] font-semibold text-green-400 bg-green-950/30 px-2.5 py-0.5 rounded-full">
                        Verified
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#555] bg-[#1A1A1A] px-2.5 py-0.5 rounded-full">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#A0A0A0]">
                    {formatDate(review.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setConfirmDelete(review)}
                      className="p-1.5 rounded-lg text-[#555] hover:text-red-400 hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Review"
        message={`Delete this review by ${confirmDelete?.users?.full_name ?? confirmDelete?.users?.email ?? "customer"}? This cannot be undone.`}
        danger
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  );
}
