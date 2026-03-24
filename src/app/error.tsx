"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-lg border border-[#F0E0E8]">
        <div className="text-4xl mb-4">😢</div>
        <h2 className="font-playfair text-xl font-bold text-[#3D2C35] mb-2">
          Something went wrong
        </h2>
        <p className="text-[#9A8490] text-sm mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white border-none cursor-pointer"
          style={{ background: "#84A98C" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
