export default function Loading() {
  return (
    <div className="flex h-screen bg-[#030014] animate-pulse overflow-hidden">
      <div className="flex-1 flex flex-col border-r border-white/[0.07]">
        <div className="h-14 bg-black/40 border-b border-white/[0.07]" />
        <div className="h-12 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-2 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-20 bg-white/[0.06] rounded-full" />
          ))}
        </div>
        <div className="flex-1 p-3 grid grid-cols-3 lg:grid-cols-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white/[0.05] border border-white/[0.07] aspect-square" />
          ))}
        </div>
      </div>
      <div className="w-[40%] flex flex-col bg-black/40 backdrop-blur-xl">
        <div className="h-12 border-b border-white/[0.07] flex items-center px-4">
          <div className="h-5 w-32 bg-white/[0.07] rounded" />
        </div>
        <div className="flex-1 p-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.05] border border-white/[0.07]" />
          ))}
        </div>
        <div className="p-3 border-t border-white/[0.07] space-y-3">
          <div className="h-10 bg-white/[0.05] rounded-xl" />
          <div className="h-14 bg-violet-500/20 border border-violet-500/20 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
