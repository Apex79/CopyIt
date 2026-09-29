export function DocumentSkeleton() {
  return (
    <div className="animate-fade-in macos-window overflow-hidden">
      {/* macOS window header skeleton */}
      <div className="flex items-center px-4 py-3 border-b border-[#DCE8E0] dark:border-white/10 bg-white/50 dark:bg-surface-800/40 gap-2">
        <div className="w-3 h-3 rounded-full bg-surface-300/70 dark:bg-surface-700" />
        <div className="w-3 h-3 rounded-full bg-surface-300/70 dark:bg-surface-700" />
        <div className="w-3 h-3 rounded-full bg-surface-300/70 dark:bg-surface-700" />
      </div>

      {/* Document content skeleton */}
      <div className="px-6 py-6 sm:px-10 sm:py-8 lg:px-14 lg:py-10 space-y-6">
        <div className="skeleton h-8 w-2/3 max-w-lg" />
        <div className="skeleton h-4 w-40" />
        <div className="space-y-3 pt-4">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
        </div>
        <div className="skeleton h-40 w-full rounded-xl" />
        <div className="space-y-3">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="macos-card overflow-hidden">
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="skeleton h-5 w-40" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border-b border-surface-100 dark:border-surface-800 last:border-0"
        >
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-24" />
          <div className="flex-1" />
          <div className="skeleton h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="macos-card p-6 space-y-3">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-6 w-40" />
      <div className="skeleton h-3 w-32" />
    </div>
  );
}
