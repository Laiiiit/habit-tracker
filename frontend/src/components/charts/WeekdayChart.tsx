'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface Props {
  data: { day: string; count: number }[];
  color?: string;
}

export function WeekdayChart({ data, color = '#6366f1' }: Props) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-4">Активность по дням недели</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-3 py-2 text-xs">
                  <p className="text-gray-500">{payload[0].payload.day}</p>
                  <p className="font-semibold" style={{ color }}>
                    {payload[0].value} выполнений
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={color}
                opacity={entry.count === max ? 1 : 0.4 + (entry.count / max) * 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
