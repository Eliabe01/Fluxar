
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
          paddingAngle={2}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          cornerRadius={10}
        >
          {data.map((entry, index) => (
             <Cell 
               key={`cell-${index}`} 
               fill={progress >= 100 && index === 0 ? 'hsl(45 93% 47%)' : entry.fill} // Dourado se estiver 100%
               stroke="transparent"
             />
          ))}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex items-center justify-center -top-2 -left-2">
         {progress >= 100 ? (
            <div className="flex flex-col items-center justify-center animate-bounce duration-1000">
               <span className="text-3xl">🏆</span>
               <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">Concluído</span>
            </div>
         ) : (
            <span className="text-2xl font-bold text-foreground font-headline tracking-tighter">
              {`${Math.round(progress)}%`}
            </span>
         )}
      </div>
    </div>
  );
}
