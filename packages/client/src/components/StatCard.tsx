import { memo } from 'react';

interface StatCardProps {
  icon: string;
  value: React.ReactNode;
  label: string;
  iconColor?: string;
}

const StatCard = memo(function StatCard({ icon, value, label, iconColor = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-surface-container-low p-5 rounded-xl">
      <span className={`material-symbols-outlined mb-2 ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
        {icon}
      </span>
      <div className="text-2xl font-extrabold font-headline">{value}</div>
      <div className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">{label}</div>
    </div>
  );
});

export default StatCard;
