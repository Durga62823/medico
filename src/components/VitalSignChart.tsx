import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface VitalData {
  time: string;
  value: number;
  normal?: boolean;
}

interface VitalSignChartProps {
  title: string;
  currentValue: number;
  unit: string;
  normalRange: [number, number];
  data: VitalData[];
  icon?: React.ComponentType<any>;
  isLoading?: boolean;  // Added for loading state
}

export function VitalSignChart({ 
  title, 
  currentValue, 
  unit, 
  normalRange, 
  data, 
  icon: Icon,
  isLoading = false
}: VitalSignChartProps) {
  const isNormal = currentValue >= normalRange[0] && currentValue <= normalRange[1];
  const isHigh = currentValue > normalRange[1];

  // Dynamic trend calculation from data (instead of prop)
  const trend = data.length >= 2 
    ? (data[data.length - 1].value > data[data.length - 2].value ? 'up' 
      : data[data.length - 1].value < data[data.length - 2].value ? 'down' : 'stable')
    : 'stable';

  // Static mappings for safe Tailwind classes
  const statusStyles = {
    normal: { color: "text-green-600", bg: "bg-green-600", stroke: "#22c55e" },
    high: { color: "text-red-600", bg: "bg-red-600", stroke: "#ef4444" },
    low: { color: "text-yellow-600", bg: "bg-yellow-600", stroke: "#eab308" },
  };

  const status = isNormal ? statusStyles.normal : isHigh ? statusStyles.high : statusStyles.low;
  const statusText = isNormal ? "Normal" : isHigh ? "High" : "Low";

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // Unique gradient ID to avoid conflicts
  const gradientId = `gradient-${title.replace(/\s+/g, '-').toLowerCase()}`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Loading {title} data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="w-5 h-5 text-primary" />}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge 
            variant={isNormal ? "secondary" : "destructive"}
            className={`${status.bg} text-white`}
          >
            {statusText}
          </Badge>
        </div>
        <CardDescription>
          Normal range: {normalRange[0]}-{normalRange[1]} {unit}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`text-3xl font-bold ${status.color}`}>
                {currentValue}
              </span>
              <span className="text-muted-foreground">{unit}</span>
              <TrendIcon 
                className={`w-4 h-4 ${
                  trend === 'up' ? "text-red-600" 
                  : trend === 'down' ? "text-yellow-600" 
                  : "text-muted-foreground"
                }`} 
              />
            </div>
            <p className="text-sm text-muted-foreground">Current reading</p>
          </div>
          
          {!isNormal && (
            <div className="flex items-center space-x-1 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-600 font-medium">Alert</span>
            </div>
          )}
        </div>
        
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={status.stroke} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={status.stroke} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={status.stroke}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                strokeWidth={2}
              />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  fontSize: '12px'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
