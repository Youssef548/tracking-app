export default function CalendarSkeleton() {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="skeleton h-10 w-56" />
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton w-10 h-10 rounded-xl" />
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
          <div className="bg-surface-container-lowest rounded-3xl p-4 md:p-8">
            <div className="grid grid-cols-7 mb-4">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-center py-2">
                  <div className="skeleton h-3 w-6 mx-auto" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square p-3">
                  <div className="skeleton h-4 w-4 mb-2" />
                  <div className="flex gap-1">
                    <div className="skeleton w-1.5 h-1.5 rounded-full" />
                    <div className="skeleton w-1.5 h-1.5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="w-full lg:w-96 shrink-0">
          <div className="bg-surface-container-low rounded-3xl p-8">
            <div className="skeleton h-4 w-20 mb-2" />
            <div className="skeleton h-8 w-40 mb-8" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
