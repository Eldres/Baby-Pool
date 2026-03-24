export default function Loading() {
  const shimmer = "animate-pulse bg-[#F0E0E8] rounded-lg";

  return (
    <div className="min-h-screen bg-[#FFF8F0] relative overflow-hidden pb-16">
      {/* Header skeleton */}
      <div className="text-center px-5 pt-12 pb-6">
        <div className={`w-10 h-10 mx-auto mb-2 rounded-full ${shimmer}`} />
        <div className={`w-48 h-8 mx-auto mb-2 ${shimmer}`} />
        <div className={`w-32 h-4 mx-auto ${shimmer}`} />
      </div>

      {/* Tab bar skeleton */}
      <div className="flex justify-center gap-2 mb-7">
        <div className={`w-36 h-10 rounded-full ${shimmer}`} />
        <div className={`w-36 h-10 rounded-full ${shimmer}`} />
      </div>

      {/* Card skeleton */}
      <div className="max-w-lg mx-auto px-4">
        <div
          className="bg-white rounded-3xl p-8"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.07)" }}
        >
          {/* Title */}
          <div className={`w-32 h-6 mb-6 ${shimmer}`} />

          {/* Name field */}
          <div className={`w-20 h-3 mb-2 ${shimmer}`} />
          <div className={`w-full h-10 mb-4 ${shimmer}`} />

          {/* Weight fields */}
          <div className={`w-24 h-3 mb-2 ${shimmer}`} />
          <div className="flex gap-2 mb-4">
            <div className={`flex-1 h-10 ${shimmer}`} />
            <div className={`flex-1 h-10 ${shimmer}`} />
          </div>

          {/* Length fields */}
          <div className={`w-24 h-3 mb-2 ${shimmer}`} />
          <div className="flex gap-2 mb-6">
            <div className={`flex-1 h-10 ${shimmer}`} />
            <div className={`flex-1 h-10 ${shimmer}`} />
          </div>

          {/* Submit button */}
          <div className={`w-full h-12 rounded-2xl ${shimmer}`} />
        </div>
      </div>
    </div>
  );
}
