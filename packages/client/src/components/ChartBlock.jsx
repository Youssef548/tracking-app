import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TrendChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eaeff2" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} stroke="#acb3b7"
          tickFormatter={(v) => ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date(v).getUTCDay()]} />
        <YAxis hide />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#005bc4" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ComparisonBar({ data = [] }) {
  return (
    <div className="space-y-6">
      {data.map((item, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-on-surface-variant">
            <span>{item.label}</span>
            <span className={i === 0 ? 'text-primary' : ''}>{item.completed} / {item.target}</span>
          </div>
          <div className="h-8 w-full bg-surface-container rounded-xl overflow-hidden">
            <div className={`h-full rounded-l-xl ${i === 0 ? 'bg-primary-container' : 'bg-surface-dim'}`}
              style={{ width: `${item.target > 0 ? (item.completed / item.target) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
