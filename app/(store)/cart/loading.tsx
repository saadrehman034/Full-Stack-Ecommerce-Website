export default function Loading() {
  return (
    <div className="min-h-screen bg-[#060810] py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-12 w-48 rounded-xl bg-white/[0.06] animate-pulse mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-white/[0.04] animate-pulse" />
        </div>
      </div>
    </div>
  )
}
