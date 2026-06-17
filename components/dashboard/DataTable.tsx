"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { EmptyState } from "./EmptyState";
import { Package } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  pageSize?: number;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  selectedRows?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
}

type SortDir = "asc" | "desc" | null;

function getCellValue<T extends Record<string, unknown>>(
  row: T,
  key: keyof T | string
): unknown {
  const k = key as string;
  if (k.includes(".")) {
    return k.split(".").reduce<unknown>((obj, part) => {
      if (obj !== null && obj !== undefined && typeof obj === "object") {
        return (obj as Record<string, unknown>)[part];
      }
      return undefined;
    }, row);
  }
  return row[k as keyof T];
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  pageSize = 10,
  searchable = false,
  searchKeys = [],
  loading = false,
  emptyTitle = "No data found",
  emptyDescription,
  onRowClick,
  actions,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const handleSort = useCallback(
    (key: keyof T | string) => {
      if (sortKey === key) {
        setSortDir((prev) =>
          prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
        );
        if (sortDir === "desc") setSortKey(null);
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      setPage(1);
    },
    [sortKey, sortDir]
  );

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => {
        const val = getCellValue(row, k as string);
        return String(val ?? "").toLowerCase().includes(q);
      })
    );
  }, [data, search, searchable, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = getCellValue(a, sortKey);
      const bVal = getCellValue(b, sortKey);
      const aStr = String(aVal ?? "");
      const bStr = String(bVal ?? "");
      const cmp = aStr.localeCompare(bStr, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedData = sorted.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const showFrom = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showTo = Math.min(safePage * pageSize, sorted.length);

  const allPageIds = paginatedData.map((row) => String(row[keyField]));
  const allSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedRows.includes(id));

  const SortIcon = ({ col }: { col: Column<T> }) => {
    if (!col.sortable) return null;
    if (sortKey !== col.key) return <ChevronsUpDown className="w-3.5 h-3.5 text-white/30" />;
    if (sortDir === "asc") return <ChevronUp className="w-3.5 h-3.5 text-violet-400" />;
    if (sortDir === "desc") return <ChevronDown className="w-3.5 h-3.5 text-violet-400" />;
    return <ChevronsUpDown className="w-3.5 h-3.5 text-white/30" />;
  };

  // Skeleton
  if (loading) {
    return (
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="bg-white/[0.05] px-4 py-3 flex gap-4 border-b border-white/[0.05]">
            {columns.map((col) => (
              <div key={String(col.key)} className="h-3 bg-white/[0.06] rounded flex-1" />
            ))}
          </div>
          {/* Row skeletons */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-4 flex gap-4 border-b border-white/[0.05] last:border-0"
            >
              {columns.map((col) => (
                <div
                  key={String(col.key)}
                  className="h-4 bg-white/[0.04] animate-pulse rounded flex-1"
                  style={{ width: col.width }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-white/[0.06] border border-white/[0.12] rounded-xl pl-10 pr-3.5 py-2.5 text-white text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none placeholder:text-white/30 transition-all"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.05] border-b border-white/[0.05]">
                {/* Select all checkbox */}
                {onSelectRow && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => {
                        if (onSelectAll) {
                          onSelectAll(allSelected ? [] : allPageIds);
                        }
                      }}
                      className="rounded border-white/20 bg-white/[0.06] accent-violet-500 cursor-pointer"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="px-4 py-3 text-left text-[11px] text-white/40 uppercase tracking-wider font-semibold"
                    style={{ width: col.width }}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1.5 hover:text-white/70 transition-colors"
                      >
                        {col.label}
                        <SortIcon col={col} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
                {actions && (
                  <th className="px-4 py-3 text-right text-[11px] text-white/40 uppercase tracking-wider font-semibold w-24">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      columns.length +
                      (onSelectRow ? 1 : 0) +
                      (actions ? 1 : 0)
                    }
                  >
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      icon={Package}
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const rowId = String(row[keyField]);
                  const isSelected = selectedRows.includes(rowId);
                  return (
                    <tr
                      key={rowId}
                      onClick={() => onRowClick?.(row)}
                      className={[
                        "border-b border-white/[0.05] last:border-0 transition-colors text-white/80",
                        onRowClick ? "cursor-pointer" : "",
                        isSelected
                          ? "bg-violet-500/10"
                          : "hover:bg-white/[0.04]",
                      ].join(" ")}
                    >
                      {/* Row checkbox */}
                      {onSelectRow && (
                        <td
                          className="px-4 py-3.5 w-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelectRow(rowId)}
                            className="rounded border-white/20 bg-white/[0.06] accent-violet-500 cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={String(col.key)}
                          className="px-4 py-3.5 text-white/80"
                          style={{ width: col.width }}
                        >
                          {col.render
                            ? col.render(row)
                            : String(getCellValue(row, col.key) ?? "—")}
                        </td>
                      ))}
                      {actions && (
                        <td
                          className="px-4 py-3.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {actions(row)}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-white/30">
            Showing{" "}
            <span className="text-white/60 font-medium">
              {showFrom}–{showTo}
            </span>{" "}
            of{" "}
            <span className="text-white/60 font-medium">{sorted.length}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.1] text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (safePage <= 3) {
                pageNum = i + 1;
              } else if (safePage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = safePage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={[
                    "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all",
                    safePage === pageNum
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                      : "bg-white/[0.05] border border-white/[0.1] text-white/60 hover:text-white hover:border-white/20",
                  ].join(" ")}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.1] text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
