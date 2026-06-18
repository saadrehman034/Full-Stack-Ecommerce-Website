import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { UserCheck } from "lucide-react";

export const revalidate = 60;

export default async function AdminStaffPage() {
  const supabase = createClient();

  const { data: staff } = await supabase
    .from("users")
    .select("id, full_name, phone, role, created_at")
    .in("role", ["staff", "admin"])
    .order("role");

  const { data: sessions } = await supabase
    .from("pos_sessions")
    .select("*, users(full_name)")
    .order("opened_at", { ascending: false })
    .limit(20);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="font-syne text-3xl font-bold">Staff</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage team members and view shift history.</p>
      </div>

      {/* Staff list */}
      <div>
        <h2 className="mb-4 font-syne text-lg font-bold">Team Members</h2>
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border/30 dark:bg-[#111] overflow-x-auto">
          {!staff?.length ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <UserCheck className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No staff found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["Name", "Role", "Phone", "Joined"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-border/20 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {(s.full_name || "S")[0].toUpperCase()}
                        </div>
                        <p className="font-semibold">{s.full_name || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${s.role === "admin" ? "bg-primary/10 text-primary" : "bg-blue-100 text-blue-700"}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Shift history */}
      <div>
        <h2 className="mb-4 font-syne text-lg font-bold">Recent Shifts</h2>
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border/30 dark:bg-[#111] overflow-x-auto">
          {!sessions?.length ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No shifts recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["Staff", "Opened", "Closed", "Opening Cash", "Closing Cash"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s: any) => (
                  <tr key={s.id} className="border-b border-border/20 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.users?.full_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(s.opened_at).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.closed_at ? new Date(s.closed_at).toLocaleString("en-US") : <span className="text-green-600 font-medium">Open</span>}
                    </td>
                    <td className="px-4 py-3">${s.opening_cash?.toFixed(2)}</td>
                    <td className="px-4 py-3">{s.closing_cash ? `$${s.closing_cash.toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
