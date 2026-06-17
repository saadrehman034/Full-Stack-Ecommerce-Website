export default function Loading() {
  return (
    <div className="min-h-screen bg-[#060810] py-16">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="aspect-square rounded-3xl bg-white/[0.04] animate-pulse" />
        <div className="space-y-4 pt-4">
          <div className="h-4 w-24 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="h-10 w-3/4 rounded-xl bg-white/[0.08] animate-pulse" />
          <div className="h-8 w-32 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="space-y-2 pt-4">
            <div className="h-3 w-full rounded bg-white/[0.04] animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-white/[0.04] animate-pulse" />
            <div className="h-3 w-4/6 rounded bg-white/[0.04] animate-pulse" />
          </div>
          <div className="h-14 w-full rounded-2xl bg-white/[0.06] animate-pulse mt-6" />
        </div>
      </div>
    </div>
  )
}
