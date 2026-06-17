export default function Loading() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      <div className="h-9 w-36 bg-white/[0.07] rounded-xl" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <div className="h-6 w-44 bg-white/[0.07] rounded-lg" />
          <div className="h-56 w-full bg-white/[0.03] rounded-xl relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-violet-500/10 to-transparent" />
          </div>
        </div>
      ))}
    </div>
  )
}
