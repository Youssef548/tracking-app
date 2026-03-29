export default function ReviewPageSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex justify-between items-center">
        <div className="h-6 w-36 bg-surface-container-high rounded" />
        <div className="h-4 w-20 bg-surface-container-high rounded" />
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-28 bg-surface-container-high rounded" />
            <div className="h-4 w-16 bg-surface-container-high rounded" />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="h-4 w-40 bg-surface-container-high rounded" />
          <div className="h-20 w-full bg-surface-container-high rounded-xl" />
        </div>
      ))}
    </div>
  );
}
