
"use client"

import * as React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

interface DreamProgressChartProps {
  data: { name: string; value: number; fill: string }[];
  progress: number;
}

export function DreamProgressChart({ data, progress }: DreamProgressChartProps) {
  return (
    <div className="relative h-40 w-40">
      <PieChart width={160} height={160}>
        <Pie
          data={data}
          cx={75}
          cy={75}
          innerRadius={60}
          outerRadius={80}
          paddingAngle={0}
          dataKey="value"
          startAngle={90}
          endAngle={450}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
          ))}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-foreground">
          {`${Math.round(progress)}%`}
        </span>
      </div>
    </div>
  );
}
