export default function AnalyticsSkeleton() {
  return (
    <>
      <div className="mb-10">
        <div className="skeleton h-12 w-64 mb-2" />
        <div className="skeleton h-5 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 bg-surface-container-lowest p-8 rounded-3xl">
          <div className="skeleton h-5 w-24 rounded-full mb-8" />
          <div className="skeleton h-20 w-32 mb-2" />
          <div className="skeleton h-4 w-28 mb-12" />
          <div className="skeleton h-2 w-full rounded-full" />
        </div>
        <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-3xl">
          <div className="skeleton h-6 w-40 mb-8" />
          <div className="skeleton h-48 w-full rounded-xl" />
        </div>
        <div className="md:col-span-7 bg-surface-container-lowest p-8 rounded-3xl">
          <div className="skeleton h-6 w-44 mb-8" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="skeleton h-3 w-24 mb-2" />
                <div className="skeleton h-8 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-5 bg-secondary-container/30 p-8 rounded-3xl">
          <div className="skeleton h-8 w-8 mb-4 rounded" />
          <div className="skeleton h-7 w-36 mb-3" />
          <div className="skeleton h-16 w-full" />
        </div>
      </div>
    </>
  );
}
