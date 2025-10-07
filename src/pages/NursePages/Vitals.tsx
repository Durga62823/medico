import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { TimelineChart } from "@/components/TimelineChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Thermometer, Droplets, Wind, Activity, TrendingUp, TrendingDown } from "lucide-react";

const Vitals = () => {
  const [selectedPatient, setSelectedPatient] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");

  // Mock data for different time ranges
  const heartRateData = [
    { time: "12:00", value: 72 },
    { time: "14:00", value: 75 },
    { time: "16:00", value: 78 },
    { time: "18:00", value: 74 },
    { time: "20:00", value: 73 },
    { time: "22:00", value: 71 },
  ];

  const temperatureData = [
    { time: "12:00", value: 98.6 },
    { time: "14:00", value: 98.8 },
    { time: "16:00", value: 99.1 },
    { time: "18:00", value: 98.9 },
    { time: "20:00", value: 98.7 },
    { time: "22:00", value: 98.6 },
  ];

  const bpData = [
    { time: "12:00", value: 120 },
    { time: "14:00", value: 118 },
    { time: "16:00", value: 122 },
    { time: "18:00", value: 119 },
    { time: "20:00", value: 121 },
    { time: "22:00", value: 120 },
  ];

  const oxygenData = [
    { time: "12:00", value: 98 },
    { time: "14:00", value: 97 },
    { time: "16:00", value: 98 },
    { time: "18:00", value: 99 },
    { time: "20:00", value: 98 },
    { time: "22:00", value: 99 },
  ];

  const vitalStats = [
    {
      label: "Avg Heart Rate",
      value: "74",
      unit: "BPM",
      trend: "up",
      change: "+2",
      icon: Heart,
      color: "text-chart-1"
    },
    {
      label: "Avg Temperature",
      value: "98.8",
      unit: "°F",
      trend: "up",
      change: "+0.2",
      icon: Thermometer,
      color: "text-chart-4"
    },
    {
      label: "Avg BP",
      value: "120/80",
      unit: "mmHg",
      trend: "down",
      change: "-2",
      icon: Droplets,
      color: "text-chart-1"
    },
    {
      label: "Avg O2 Sat",
      value: "98",
      unit: "%",
      trend: "up",
      change: "+1",
      icon: Wind,
      color: "text-chart-2"
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Vital Signs Monitoring</h1>
          <p className="text-muted-foreground">Track and analyze patient vital signs in real-time</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 animate-fade-in">
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              <SelectItem value="1">John Evans - Room 504</SelectItem>
              <SelectItem value="2">Sarah Li - Room 501</SelectItem>
              <SelectItem value="3">Michael Johnson - Room 503</SelectItem>
              <SelectItem value="4">Emily Chen - Room 502</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {vitalStats.map((stat) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
            return (
              <Card key={stat.label} className="animate-fade-in">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{stat.value}</span>
                    <span className="text-sm text-muted-foreground">{stat.unit}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendIcon className={`w-4 h-4 ${stat.trend === "up" ? "text-success" : "text-destructive"}`} />
                    <span className={`text-xs ${stat.trend === "up" ? "text-success" : "text-destructive"}`}>
                      {stat.change} from yesterday
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Vital Signs Charts */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TimelineChart
              title="Heart Rate Monitor"
              data={heartRateData}
              unit="BPM"
              color="hsl(var(--chart-1))"
              icon={<Heart className="w-5 h-5 text-primary" />}
            />
            <TimelineChart
              title="Temperature Monitor"
              data={temperatureData}
              unit="°F"
              color="hsl(var(--chart-4))"
              icon={<Thermometer className="w-5 h-5 text-primary" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TimelineChart
              title="Blood Pressure Monitor"
              data={bpData}
              unit="mmHg"
              color="hsl(var(--chart-1))"
              icon={<Droplets className="w-5 h-5 text-primary" />}
            />
            <TimelineChart
              title="Oxygen Saturation Monitor"
              data={oxygenData}
              unit="%"
              color="hsl(var(--chart-2))"
              icon={<Wind className="w-5 h-5 text-primary" />}
            />
          </div>
        </div>

        {/* Real-time Status */}
        <Card className="mt-6 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-time Monitoring Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <div>
                <p className="font-medium">All systems operational</p>
                <p className="text-sm text-muted-foreground">
                  Monitoring {selectedPatient === "all" ? "4 patients" : "1 patient"} • Updates every 5 seconds
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Vitals;
