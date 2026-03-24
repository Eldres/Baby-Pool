export default function AdminLoading() {
  const shimmer = "animate-pulse bg-[#F0E0E8] rounded-lg";
  const sectionClass = "bg-white rounded-2xl p-6 mb-4 shadow-sm border border-[#F0E0E8]";

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-10">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className={`w-40 h-8 ${shimmer}`} />
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full ${shimmer}`} />
            <div className={`w-12 h-4 ${shimmer}`} />
          </div>
        </div>

        {/* Baby Details section */}
        <div className={sectionClass}>
          <div className={`w-28 h-5 mb-4 ${shimmer}`} />
          <div className={`w-24 h-3 mb-2 ${shimmer}`} />
          <div className={`w-full h-9 mb-3 ${shimmer}`} />
          <div className={`w-24 h-3 mb-2 ${shimmer}`} />
          <div className={`w-full h-9 mb-3 ${shimmer}`} />
          <div className={`w-16 h-3 mb-2 ${shimmer}`} />
          <div className={`w-full h-9 mb-4 ${shimmer}`} />
          <div className={`w-24 h-9 rounded-xl ${shimmer}`} />
        </div>

        {/* QR Code section */}
        <div className={sectionClass}>
          <div className={`w-36 h-5 mb-4 ${shimmer}`} />
          <div className={`w-32 h-32 mb-3 ${shimmer}`} />
          <div className={`w-full h-9 mb-3 ${shimmer}`} />
          <div className={`w-full h-20 mb-3 ${shimmer}`} />
          <div className={`w-28 h-9 rounded-xl ${shimmer}`} />
        </div>

        {/* Results section */}
        <div className={sectionClass}>
          <div className={`w-36 h-5 mb-4 ${shimmer}`} />
          <div className="flex gap-2 mb-3">
            <div className={`flex-1 h-9 ${shimmer}`} />
            <div className={`flex-1 h-9 ${shimmer}`} />
          </div>
          <div className="flex gap-2 mb-3">
            <div className={`flex-1 h-9 ${shimmer}`} />
            <div className={`flex-1 h-9 ${shimmer}`} />
          </div>
          <div className={`w-24 h-9 rounded-xl ${shimmer}`} />
        </div>

        {/* Entries section */}
        <div className={sectionClass}>
          <div className={`w-28 h-5 mb-4 ${shimmer}`} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-[#F0E0E8] last:border-0">
              <div>
                <div className={`w-24 h-4 mb-1 ${shimmer}`} />
                <div className={`w-40 h-3 ${shimmer}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
