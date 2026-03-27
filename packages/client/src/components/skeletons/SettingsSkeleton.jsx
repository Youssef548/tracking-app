export default function SettingsSkeleton() {
  return (
    <div className="max-w-lg">
      <div className="skeleton h-9 w-32 mb-2" />
      <div className="skeleton h-4 w-48 mb-6" />

      {/* Profile card */}
      <div className="bg-surface-container-lowest rounded-3xl p-5 mb-4 flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded-full" />
        <div>
          <div className="skeleton h-5 w-28 mb-1" />
          <div className="skeleton h-4 w-40" />
        </div>
      </div>

      {/* Appearance card */}
      <div className="bg-surface-container-lowest rounded-3xl p-5 mb-4">
        <div className="skeleton h-3 w-24 mb-3" />
        <div className="skeleton h-5 w-16 mb-3" />
        <div className="grid grid-cols-3 gap-3">
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-16 rounded-2xl" />
        </div>
      </div>

      {/* Account card */}
      <div className="bg-surface-container-lowest rounded-3xl p-5">
        <div className="skeleton h-3 w-20 mb-4" />
        <div className="skeleton h-4 w-full mb-4" />
        <div className="skeleton h-11 w-full rounded-2xl" />
      </div>
    </div>
  );
}
