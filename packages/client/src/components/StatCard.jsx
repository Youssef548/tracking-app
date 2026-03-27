export default function StatCard({ icon, value, label, iconColor = 'text-primary' }) {
  return (
    <div className="bg-surface-container-low p-5 rounded-xl">
      <span className={`material-symbols-outlined mb-2 ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
      <div className="text-2xl font-extrabold font-headline">{value}</div>
      <div className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">{label}</div>
    </div>
  );
}
