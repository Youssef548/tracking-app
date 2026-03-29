export default function WeekPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-40 bg-surface-container-high rounded" />
        <div className="h-8 w-24 bg-surface-container-high rounded" />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="flex gap-2 mb-3">
            <div className="w-28 h-4 bg-surface-container-high rounded" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 h-4 bg-surface-container-high rounded" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center border-t border-outline-variant/20 pt-2">
              <div className="w-28 h-5 bg-surface-container-high rounded" />
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="flex-1 h-6 bg-surface-container-high rounded-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
