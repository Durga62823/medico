import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataPoint {
  time: string;
  value: number;
}

interface TimelineChartProps {
  title: string;
  data: DataPoint[];
  color?: string;
  unit: string;
  icon: React.ReactNode;
}

export const TimelineChart = ({ title, data, color = "hsl(var(--chart-1))", unit, icon }: TimelineChartProps) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="h-32 relative">
          <svg className="w-full h-full">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={data
                .map((point, index) => {
                  const x = (index / (data.length - 1)) * 100;
                  const y = 100 - ((point.value - minValue) / range) * 80;
                  return `${x}%,${y}%`;
                })
                .join(" ")}
            />
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((point.value - minValue) / range) * 80;
              return (
                <circle
                  key={index}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="4"
                  fill={color}
                />
              );
            })}
          </svg>
        </div>
        <div className="flex justify-between mt-4 text-xs text-muted-foreground">
          {data.map((point, index) => (
            <div key={index} className="text-center">
              <div className="font-medium">{point.value} {unit}</div>
              <div className="mt-1">{point.time}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
