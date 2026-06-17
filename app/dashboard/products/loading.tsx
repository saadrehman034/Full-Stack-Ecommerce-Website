export default function Loading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-9 w-36 bg-white/[0.07] rounded-xl" />
        <div className="h-10 w-40 bg-violet-500/20 rounded-xl border border-violet-500/20" />
      </div>
      <div className="h-12 bg-white/[0.04] border border-white/[0.07] rounded-2xl" />
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="bg-white/[0.05] h-11 border-b border-white/[0.06]" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]">
            <div className="w-12 h-12 rounded-xl bg-white/[0.07] shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-44 bg-white/[0.07] rounded" />
              <div className="h-3 w-20 bg-white/[0.04] rounded" />
            </div>
            <div className="h-4 w-20 bg-white/[0.05] rounded" />
            <div className="h-4 w-16 bg-white/[0.07] rounded" />
            <div className="h-6 w-16 bg-emerald-500/15 rounded-lg" />
            <div className="h-8 w-16 bg-white/[0.05] rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
