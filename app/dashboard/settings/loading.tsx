export default function Loading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="space-y-2 mb-8">
        <div className="h-9 w-48 bg-white/[0.07] rounded-xl" />
        <div className="h-4 w-64 bg-white/[0.04] rounded" />
      </div>
      <div className="flex gap-2 border-b border-white/[0.07] mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`h-9 w-28 rounded-t-xl ${i === 0 ? 'bg-violet-500/20 border border-violet-500/20 border-b-0' : 'bg-white/[0.04]'}`} />
        ))}
      </div>
      <div className="space-y-4 max-w-2xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 space-y-3">
            <div className="h-4 w-36 bg-white/[0.07] rounded" />
            <div className="h-11 bg-white/[0.05] rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
