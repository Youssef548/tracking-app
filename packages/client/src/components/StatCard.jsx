export default function StatCard({ icon, value, label, iconColor = 'text-primary' }) {
  return (
    <div className="bg-surface-container-low p-5 rounded-xl">
      <span className="material-symbols-outlined mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
        <span className={iconColor}>{icon}</span>
      </span>
      <div className="text-2xl font-extrabold font-headline">{value}</div>
      <div className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">{label}</div>
    </div>
  );
}
