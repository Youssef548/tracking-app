export default function HabitsSkeleton() {
  return (
    <>
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="skeleton h-10 w-52 mb-3" />
          <div className="skeleton h-5 w-72" />
        </div>
        <div className="skeleton h-14 w-40 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-container-lowest p-7 rounded-4xl border border-outline-variant/10">
            <div className="flex justify-between items-start mb-6">
              <div className="skeleton w-12 h-12 rounded-2xl" />
            </div>
            <div className="skeleton h-6 w-36 mb-2" />
            <div className="flex items-center gap-3 mb-6">
              <div className="skeleton h-6 w-16 rounded-lg" />
              <div className="skeleton h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
