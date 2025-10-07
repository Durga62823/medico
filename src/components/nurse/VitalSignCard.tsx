import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VitalSignCardProps {
  title: string;
  value: string;
  unit: string;
  trend?: "up" | "down";
  status: "normal" | "warning" | "critical";
  range: string;
  icon: React.ReactNode;
}

export const VitalSignCard = ({
  title,
  value,
  unit,
  trend,
  status,
  range,
  icon,
}: VitalSignCardProps) => {
  const statusColors = {
    normal: "text-success",
    warning: "text-warning",
    critical: "text-destructive",
  };

  const statusBgColors = {
    normal: "bg-success/10",
    warning: "bg-warning/10",
    critical: "bg-destructive/10",
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${statusBgColors[status]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{value}</span>
          <span className="text-lg text-muted-foreground">{unit}</span>
          {trend && (
            <div className={statusColors[status]}>
              {trend === "down" ? (
                <ArrowDown className="w-5 h-5" />
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBgColors[status]} ${statusColors[status]}`}>
            {status.toUpperCase()}
          </span>
          <span className="text-xs text-muted-foreground">Range: {range}</span>
        </div>
      </CardContent>
    </Card>
  );
};
