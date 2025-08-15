import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

interface AlertItem {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  aiConfidence?: number;
  patientId?: string;
  acknowledged?: boolean;
}

const mockAlerts: AlertItem[] = [
  {
    id: "1",
    type: "critical",
    title: "Atrial Fibrillation Detected",
    message: "AI detected irregular heart rhythm pattern. Immediate attention required.",
    timestamp: "2 min ago",
    aiConfidence: 94,
    patientId: "P-001",
    acknowledged: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Blood Pressure Elevation",
    message: "Patient's BP has been consistently above normal range for the past hour.",
    timestamp: "15 min ago",
    aiConfidence: 87,
    patientId: "P-002",
    acknowledged: false,
  },
  {
    id: "3",
    type: "info",
    title: "Medication Reminder",
    message: "Patient scheduled for medication administration in 30 minutes.",
    timestamp: "25 min ago",
    patientId: "P-003",
    acknowledged: true,
  },
  {
    id: "4",
    type: "warning",
    title: "Glucose Level Drop",
    message: "Blood glucose dropping rapidly. Monitor for hypoglycemic symptoms.",
    timestamp: "1 hour ago",
    aiConfidence: 91,
    patientId: "P-001",
    acknowledged: false,
  },
];

export function AlertsPanel() {
  // Initialize from localStorage if available for real-time dashboard stats
  const initialAlerts = useMemo<AlertItem[]>(() => {
    const stored = localStorage.getItem("alerts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AlertItem[];
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return mockAlerts;
  }, []);

  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);

  // Persist alerts so other widgets (quick stats) can compute real values
  useEffect(() => {
    localStorage.setItem("alerts", JSON.stringify(alerts));
  }, [alerts]);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  const filteredAlerts = useMemo(() => {
    const base = filter === "all" ? alerts : alerts.filter((alert) => alert.type === filter);
    // Show newest first
    return [...base].sort((a, b) => a.id < b.id ? 1 : -1);
  }, [alerts, filter]);

  const unacknowledgedCount = alerts.filter((alert) => !alert.acknowledged).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
      case "warning":
        return AlertTriangle;
      case "info":
        return Info;
      default:
        return Bell;
    }
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, acknowledged: true } : alert))
    );
    toast.success("Alert acknowledged");
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    toast.info("Alert dismissed");
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>AI Alerts & Notifications</CardTitle>
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="animate-pulse-glow">
                {unacknowledgedCount}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Real-time AI-powered health monitoring alerts
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {(["all", "critical", "warning", "info"] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterType)}
              className="capitalize"
            >
              {filterType}
            </Button>
          ))}
        </div>

        {/* Alerts list */}
        <div className="space-y-3 max-h-80  pr-2">
          {filteredAlerts.map((alert) => {
            const IconComponent = getAlertIcon(alert.type);
            return (
              <Alert
                key={alert.id}
                className={`border-l-4 ${
                  alert.type === "critical"
                    ? "border-l-vital-critical bg-vital-critical/5"
                    : alert.type === "warning"
                    ? "border-l-vital-warning bg-vital-warning/5"
                    : "border-l-primary bg-primary/5"
                } ${!alert.acknowledged ? "animate-fade-in" : "opacity-70"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <IconComponent
                      className={`w-4 h-4 mt-0.5 ${
                        alert.type === "critical"
                          ? "text-vital-critical"
                          : alert.type === "warning"
                          ? "text-vital-warning"
                          : "text-primary"
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                        {alert.aiConfidence && (
                          <Badge variant="outline" className="text-xs">
                            AI: {alert.aiConfidence}%
                          </Badge>
                        )}
                        {alert.patientId && (
                          <Badge variant="secondary" className="text-xs">
                            {alert.patientId}
                          </Badge>
                        )}
                      </div>
                      <AlertDescription className="text-sm">{alert.message}</AlertDescription>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                        <div className="flex space-x-1">
                          {!alert.acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissAlert(alert.id)}
                            className="h-6 px-2 text-xs"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Alert>
            );
          })}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-vital-normal mx-auto mb-3" />
            <p className="text-muted-foreground">No alerts for this category</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
