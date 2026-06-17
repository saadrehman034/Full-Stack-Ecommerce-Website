export default function Loading() {
  return (
    <div className="min-h-screen bg-[#060810] py-16">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        <div className="h-10 w-64 rounded-xl bg-white/[0.06] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
          <div className="h-80 rounded-2xl bg-white/[0.04] animate-pulse" />
        </div>
      </div>
    </div>
  )
}
