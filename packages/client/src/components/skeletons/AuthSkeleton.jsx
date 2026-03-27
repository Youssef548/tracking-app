export default function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-4xl shadow-lg">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-5 w-56 mb-8" />
        <div className="space-y-5">
          <div>
            <div className="skeleton h-4 w-16 mb-1" />
            <div className="skeleton h-14 w-full rounded-2xl" />
          </div>
          <div>
            <div className="skeleton h-4 w-16 mb-1" />
            <div className="skeleton h-14 w-full rounded-2xl" />
          </div>
          <div className="skeleton h-14 w-full rounded-2xl" />
        </div>
        <div className="skeleton h-4 w-52 mx-auto mt-6" />
      </div>
    </div>
  );
}
