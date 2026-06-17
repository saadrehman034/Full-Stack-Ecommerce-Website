interface StatusBadgeProps {
  status: string;
  type?: "order" | "payment" | "source" | "stock";
}

type StyleMap = Record<string, { bg: string; color: string; border: string }>;

const ORDER_STYLES: StyleMap = {
  pending:   { bg: "rgba(245,158,11,0.15)",  color: "#FCD34D", border: "rgba(245,158,11,0.25)"  },
  confirmed: { bg: "rgba(59,130,246,0.15)",  color: "#93C5FD", border: "rgba(59,130,246,0.25)"  },
  packing:   { bg: "rgba(139,92,246,0.15)",  color: "#C4B5FD", border: "rgba(139,92,246,0.25)"  },
  shipped:   { bg: "rgba(6,182,212,0.15)",   color: "#67E8F9", border: "rgba(6,182,212,0.25)"   },
  delivered: { bg: "rgba(16,185,129,0.15)",  color: "#6EE7B7", border: "rgba(16,185,129,0.25)"  },
  cancelled: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.1)" },
  refunded:  { bg: "rgba(244,63,94,0.15)",   color: "#FDA4AF", border: "rgba(244,63,94,0.25)"   },
};

const PAYMENT_STYLES: StyleMap = {
  paid:     { bg: "rgba(16,185,129,0.15)",  color: "#6EE7B7", border: "rgba(16,185,129,0.25)"  },
  unpaid:   { bg: "rgba(245,158,11,0.15)",  color: "#FCD34D", border: "rgba(245,158,11,0.25)"  },
  refunded: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.1)" },
  failed:   { bg: "rgba(244,63,94,0.15)",   color: "#FCA5A5", border: "rgba(244,63,94,0.25)"   },
};

const SOURCE_STYLES: StyleMap = {
  online: { bg: "rgba(59,130,246,0.15)",  color: "#93C5FD", border: "rgba(59,130,246,0.25)"  },
  pos:    { bg: "rgba(139,92,246,0.15)",  color: "#C4B5FD", border: "rgba(139,92,246,0.25)"  },
};

const STOCK_STYLES: StyleMap = {
  in_stock: { bg: "rgba(16,185,129,0.15)", color: "#6EE7B7", border: "rgba(16,185,129,0.25)" },
  low:      { bg: "rgba(245,158,11,0.15)", color: "#FCD34D", border: "rgba(245,158,11,0.25)" },
  out:      { bg: "rgba(244,63,94,0.15)",  color: "#FCA5A5", border: "rgba(244,63,94,0.25)"  },
};

const FALLBACK: StyleMap[string] = {
  bg: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.4)",
  border: "rgba(255,255,255,0.1)",
};

function resolveStyles(
  status: string,
  type?: StatusBadgeProps["type"]
): { bg: string; color: string; border: string } {
  const key = status.toLowerCase();

  if (type === "payment") return PAYMENT_STYLES[key] ?? FALLBACK;
  if (type === "source")  return SOURCE_STYLES[key]  ?? FALLBACK;
  if (type === "stock")   return STOCK_STYLES[key]   ?? FALLBACK;
  if (type === "order")   return ORDER_STYLES[key]   ?? FALLBACK;

  // Auto-detect
  return (
    ORDER_STYLES[key] ??
    PAYMENT_STYLES[key] ??
    SOURCE_STYLES[key] ??
    STOCK_STYLES[key] ??
    FALLBACK
  );
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const { bg, color, border } = resolveStyles(status, type);

  return (
    <span
      className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize border"
      style={{ background: bg, color, borderColor: border }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
