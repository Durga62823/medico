import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";


// Assume this API service exists for fetching and updating alerts
const alertAPI = {
  getAlerts: async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/alerts", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch alerts");
    return res.json(); // Returns array of alerts
  },
  acknowledge: async (id: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/alerts/${id}/acknowledge`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to acknowledge");
    return res.json();
  },
  dismiss: async (id: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/alerts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to dismiss");
    return res.json();
  }
};


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


export function AlertsPanel() {
  const queryClient = useQueryClient();


  const { data: alerts = [], isLoading } = useQuery<AlertItem[]>({
    queryKey: ["alerts"],
    queryFn: alertAPI.getAlerts,
  });


  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");


  // Real-time updates with Socket.IO
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("token") || "" },
    });


    socket.on("connect", () => console.log("✅ WebSocket connected for alerts"));


    socket.on("alert:created", (newAlert: AlertItem) => {
      queryClient.setQueryData(["alerts"], (old: AlertItem[] | undefined) =>
        old ? [newAlert, ...old] : [newAlert]
      );
      toast.success("New alert received");
    });


    socket.on("alert:updated", (updatedAlert: AlertItem) => {
      queryClient.setQueryData(["alerts"], (old: AlertItem[] | undefined) =>
        old?.map(a => a.id === updatedAlert.id ? updatedAlert : a)
      );
    });


    socket.on("alert:deleted", (deletedId: string) => {
      queryClient.setQueryData(["alerts"], (old: AlertItem[] | undefined) =>
        old?.filter(a => a.id !== deletedId)
      );
    });


    return () => socket.disconnect();
  }, [queryClient]);


  const filteredAlerts = useMemo(() => {
    const base = filter === "all" ? alerts : alerts.filter((alert) => alert.type === filter);
    return [...base].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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


  const acknowledgeAlert = async (id: string) => {
    try {
      await alertAPI.acknowledge(id);
      queryClient.invalidateQueries(["alerts"]);
      toast.success("Alert acknowledged");
    } catch (error) {
      toast.error("Failed to acknowledge alert");
    }
  };


  const dismissAlert = async (id: string) => {
    try {
      await alertAPI.dismiss(id);
      queryClient.invalidateQueries(["alerts"]);
      toast.info("Alert dismissed");
    } catch (error) {
      toast.error("Failed to dismiss alert");
    }
  };


  if (isLoading) return <div>Loading alerts...</div>;


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
        <div className="space-y-3 max-h-80 pr-2">
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
