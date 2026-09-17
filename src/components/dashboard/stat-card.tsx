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
  
  const iconColor = icon === 'trending-up' ? 'text-success bg-success/10' : 
                    icon === 'trending-down' ? 'text-destructive bg-destructive/10' : 
                    'text-primary bg-primary/10';

  return (
    <Card className="border-border/40 card-shadow transition-all hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
        <div className={cn("p-2 rounded-xl", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-3/4 mt-2" />
        ) : (
          <div className={cn("text-3xl font-bold tracking-tight mt-1", valueClassName)}>
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

