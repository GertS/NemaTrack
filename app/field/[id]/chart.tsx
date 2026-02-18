'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';

type Point = {
  date: string;
  [key: string]: string | number;
};

export default function FieldTrendChart({ data, analytes }: { data: Point[]; analytes: string[] }) {
  const colors = ['#166534', '#2563eb', '#dc2626', '#7c3aed', '#ea580c', '#0891b2'];

  return (
    <div style={{ width: '100%', height: 360 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {analytes.map((analyte, index) => (
            <Line key={analyte} type="monotone" dataKey={analyte} stroke={colors[index % colors.length]} dot />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
