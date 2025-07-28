"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChartIcon } from "lucide-react";
import * as React from "react";

const chartConfig = {
  value: { label: "Valor" },
  food: { label: "Alimentação", color: "hsl(var(--chart-1))" },
  transport: { label: "Transporte", color: "hsl(var(--chart-2))" },
  shopping: { label: "Compras", color: "hsl(var(--chart-3))" },
  housing: { label: "Moradia", color: "hsl(var(--chart-4))" },
  bills: { label: "Contas", color: "hsl(var(--chart-5))" },
  leisure: { label: "Lazer", color: "hsl(var(--chart-1))" },
  health: { label: "Saúde", color: "hsl(var(--chart-2))" },
  education: { label: "Educação", color: "hsl(var(--chart-3))" },
  other: { label: "Outros", color: "hsl(var(--chart-4))" },
  salary: { label: "Salário" },
  investment: { label: "Investimentos" },
  gift: { label: "Presente" },
  extra: { label: "Renda Extra" },
} satisfies ChartConfig;

interface ExpenseBreakdownChartProps {
    data: { name: string; value: number }[];
    loading: boolean;
}

export function ExpenseBreakdownChart({ data, loading }: ExpenseBreakdownChartProps) {
  const totalExpenses = data.reduce((acc, curr) => acc + curr.value, 0);

  const chartDataWithColors = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
      fill: chartConfig[item.name as keyof typeof chartConfig]?.color || "hsl(var(--muted))",
    }));
  }, [data]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>Distribuição dos seus gastos no mês.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        {loading ? (
             <div className="min-h-[250px] w-full flex items-center justify-center">
                <Skeleton className="h-[250px] w-[250px] rounded-full" />
             </div>
        ) : totalExpenses === 0 ? (
            <div className="flex h-full min-h-[250px] flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-center">
                <PieChartIcon className="h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                    Nenhuma despesa registrada neste mês para exibir no gráfico.
                </p>
            </div>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full w-full max-h-[300px]">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                    formatter={(value, name) => `${(chartConfig[name as keyof typeof chartConfig]?.label || name)}: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value as number)}`}
                    hideLabel 
                />}
              />
              <Pie
                data={chartDataWithColors}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
                outerRadius={80}
              >
                {chartDataWithColors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
