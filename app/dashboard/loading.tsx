export default function DashboardLoading() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-9 w-52 bg-white/[0.07] rounded-xl" />
        <div className="h-4 w-80 bg-white/[0.04] rounded-lg" />
      </div>

      {/* 6 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          'bg-violet-500/10 border-violet-500/20',
          'bg-cyan-500/10 border-cyan-500/20',
          'bg-emerald-500/10 border-emerald-500/20',
          'bg-fuchsia-500/10 border-fuchsia-500/20',
          'bg-amber-500/10 border-amber-500/20',
          'bg-rose-500/10 border-rose-500/20',
        ].map((cls, i) => (
          <div key={i} className={`border rounded-2xl p-6 space-y-4 ${cls}`}>
            <div className="w-11 h-11 rounded-xl bg-white/[0.08]" />
            <div className="h-8 w-20 bg-white/[0.08] rounded-lg" />
            <div className="h-3 w-16 bg-white/[0.05] rounded" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 h-80 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 w-40 bg-white/[0.07] rounded-lg" />
            <div className="flex gap-2">
              {['7D','30D','90D','1Y'].map(p => (
                <div key={p} className="h-8 w-10 bg-white/[0.05] rounded-lg" />
              ))}
            </div>
          </div>
          <div className="flex-1 h-48 bg-white/[0.03] rounded-xl relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-violet-500/10 to-transparent rounded-xl" />
          </div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <div className="h-6 w-36 bg-white/[0.07] rounded-lg" />
          <div className="w-36 h-36 rounded-full border-[14px] border-white/[0.05] mx-auto mt-6" style={{ boxShadow: 'inset 0 0 0 14px rgba(139,92,246,0.15)' }} />
          <div className="space-y-2 mt-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/[0.15]" />
                  <div className="h-3 w-20 bg-white/[0.06] rounded" />
                </div>
                <div className="h-3 w-6 bg-white/[0.06] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="bg-white/[0.05] h-12 border-b border-white/[0.06] flex items-center px-6 gap-4">
            {['Order','Customer','Date','Total','Status'].map(h => (
              <div key={h} className="h-3 w-16 bg-white/[0.07] rounded" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]">
              <div className="h-4 w-24 bg-violet-500/15 rounded font-mono" />
              <div className="space-y-1">
                <div className="h-3.5 w-28 bg-white/[0.07] rounded" />
                <div className="h-2.5 w-20 bg-white/[0.04] rounded" />
              </div>
              <div className="h-3 w-20 bg-white/[0.05] rounded ml-auto" />
              <div className="h-6 w-16 bg-white/[0.06] rounded-lg" />
            </div>
          ))}
        </div>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 space-y-5">
          <div className="h-6 w-28 bg-white/[0.07] rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-32 bg-white/[0.07] rounded" />
                <div className="h-3 w-14 bg-white/[0.05] rounded" />
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full">
                <div className="h-full bg-gradient-to-r from-violet-500/40 to-purple-500/30 rounded-full" style={{ width: `${70 - i * 12}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
