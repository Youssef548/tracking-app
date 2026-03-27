import { motion } from 'framer-motion';

export default function ProgressRing({ percent = 0, size = 192, strokeWidth = 12, color = 'text-secondary' }) {
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="currentColor"
          strokeWidth={strokeWidth} className="text-surface-container" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="currentColor"
          strokeWidth={strokeWidth} strokeDasharray={circumference}
          strokeLinecap="round" className={color}
          style={{ filter: 'drop-shadow(0 0 8px rgba(0, 109, 74, 0.2))' }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-headline text-4xl font-extrabold text-on-surface">{percent}%</span>
        <span className="text-on-surface-variant text-xs font-bold tracking-widest uppercase">ON TRACK</span>
      </div>
    </div>
  );
}
