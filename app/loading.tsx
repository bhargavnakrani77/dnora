export default function Loading() {
  return (
    <div className="w-full flex-1 min-h-[70vh] flex flex-col items-center justify-center py-24 px-4 bg-white select-none">
      <div className="flex flex-col items-center gap-4">
        {/* Subtle luxury brand spinner */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-neutral-200" />
          <div className="absolute inset-0 rounded-full border-2 border-[#C5A880] border-t-transparent animate-spin" />
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-neutral-900 font-sans">
            DNORA ATELIER
          </p>
          <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-neutral-400">
            LOADING COLLECTION...
          </p>
        </div>
      </div>
    </div>
  );
}
