import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const iconMap = {
  wallet: Wallet,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
};

type StatCardProps = {
  title: string;
  value: string;
  icon: keyof typeof iconMap;
  loading?: boolean;
  valueClassName?: string;
};

export function StatCard({ title, value, icon, loading = false, valueClassName }: StatCardProps) {
  const Icon = iconMap[icon];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
