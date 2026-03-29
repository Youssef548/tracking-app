export default function MonthPageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 w-32 bg-surface-container-high rounded" />
        <div className="h-8 w-20 bg-surface-container-high rounded" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface-container-lowest rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="h-5 w-28 bg-surface-container-high rounded" />
            <div className="h-4 w-16 bg-surface-container-high rounded" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-surface-container-high" />
                <div className="flex-1 h-4 bg-surface-container-high rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
