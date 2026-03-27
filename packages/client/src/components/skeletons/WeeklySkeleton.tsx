export default function WeeklySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="skeleton w-48 h-6 rounded-lg" />
          <div className="skeleton w-8 h-8 rounded-lg" />
        </div>
        <div className="skeleton w-36 h-10 rounded-xl" />
      </div>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton w-24 h-8 rounded-full" />
        ))}
      </div>
      <div className="skeleton w-full h-72 rounded-xl mb-6" />
      <div className="skeleton w-32 h-5 rounded-lg mb-3" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton w-full h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
