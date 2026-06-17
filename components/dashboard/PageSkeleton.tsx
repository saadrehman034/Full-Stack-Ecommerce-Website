export function PageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-white/[0.07] rounded-xl" />
          <div className="h-4 w-36 bg-white/[0.04] rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-violet-500/20 rounded-xl border border-violet-500/20" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          'bg-violet-500/10 border-violet-500/20',
          'bg-cyan-500/10 border-cyan-500/20',
          'bg-emerald-500/10 border-emerald-500/20',
          'bg-amber-500/10 border-amber-500/20',
        ].map((cls, i) => (
          <div key={i} className={`border rounded-2xl p-5 space-y-3 ${cls}`}>
            <div className="w-9 h-9 rounded-xl bg-white/[0.08]" />
            <div className="h-7 w-20 bg-white/[0.08] rounded-lg" />
            <div className="h-3 w-24 bg-white/[0.05] rounded" />
          </div>
        ))}
      </div>

      <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="bg-white/[0.05] h-11 border-b border-white/[0.06]" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]">
            <div className="h-4 w-36 bg-white/[0.07] rounded" />
            <div className="h-4 w-28 bg-white/[0.05] rounded" />
            <div className="h-4 w-20 bg-white/[0.05] rounded ml-auto" />
            <div className="h-6 w-16 bg-white/[0.06] rounded-lg" />
            <div className="h-8 w-8 bg-white/[0.05] rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
