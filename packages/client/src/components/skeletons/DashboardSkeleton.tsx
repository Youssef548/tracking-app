export default function DashboardSkeleton() {
  return (
    <>
      <section className="mb-10">
        <div className="skeleton h-10 w-72 mb-2" />
        <div className="skeleton h-5 w-40" />
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="skeleton h-6 w-32" />
            <div className="skeleton h-7 w-36 rounded-full" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-container-lowest p-6 rounded-xl flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="skeleton w-10 h-10 rounded-lg" />
                  <div className="skeleton h-5 w-40" />
                </div>
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
              <div className="ml-8">
                <div className="skeleton w-12 h-12 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest p-8 rounded-xl">
            <div className="skeleton h-6 w-28 mb-8" />
            <div className="flex flex-col items-center">
              <div className="skeleton w-48 h-48 rounded-full" />
              <div className="skeleton h-4 w-48 mt-6" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-5 rounded-xl">
              <div className="skeleton w-6 h-6 mb-2" />
              <div className="skeleton h-8 w-12 mb-1" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="bg-surface-container-low p-5 rounded-xl">
              <div className="skeleton w-6 h-6 mb-2" />
              <div className="skeleton h-8 w-12 mb-1" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
