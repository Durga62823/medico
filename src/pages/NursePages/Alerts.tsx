import { useState } from "react";
// import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info, Bell, CheckCircle, X } from "lucide-react";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  time: string;
  patient?: string;
  room?: string;
  resolved: boolean;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "critical",
    title: "Abnormal Heart Rate",
    message: "Heart rate detected at 142 BPM - immediate attention required",
    time: "2 min ago",
    patient: "John Evans",
    room: "504",
    resolved: false
  },
  {
    id: "2",
    type: "critical",
    title: "Low Oxygen Saturation",
    message: "O2 saturation dropped to 89% - action needed",
    time: "8 min ago",
    patient: "John Evans",
    room: "504",
    resolved: false
  },
  {
    id: "3",
    type: "warning",
    title: "Medication Due",
    message: "Amoxicillin administration due in 15 minutes",
    time: "13 min ago",
    patient: "Sarah Li",
    room: "501",
    resolved: false
  },
  {
    id: "4",
    type: "warning",
    title: "Temperature Elevated",
    message: "Temperature reading 99.8°F - monitor closely",
    time: "28 min ago",
    patient: "Sarah Li",
    room: "501",
    resolved: false
  },
  {
    id: "5",
    type: "info",
    title: "Lab Results Available",
    message: "Blood work results are ready for review",
    time: "1 hour ago",
    patient: "Michael Johnson",
    room: "503",
    resolved: false
  },
  {
    id: "6",
    type: "info",
    title: "Shift Change Reminder",
    message: "Shift ends at 7:00 AM - handover notes required",
    time: "2 hours ago",
    resolved: false
  },
  {
    id: "7",
    type: "critical",
    title: "Blood Pressure Spike",
    message: "BP recorded at 160/95 - immediate intervention completed",
    time: "3 hours ago",
    patient: "John Evans",
    room: "504",
    resolved: true
  },
];

const Alerts = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [alerts, setAlerts] = useState(mockAlerts);

  const getIcon = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "info":
        return <Info className="w-5 h-5" />;
    }
  };

  const getBgColor = (type: Alert["type"], resolved: boolean) => {
    if (resolved) return "bg-muted";
    switch (type) {
      case "critical":
        return "bg-destructive/10 border-destructive";
      case "warning":
        return "bg-warning/10 border-warning";
      case "info":
        return "bg-info/10 border-info";
    }
  };

  const getTextColor = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return "text-destructive";
      case "warning":
        return "text-warning";
      case "info":
        return "text-info";
    }
  };

  const resolveAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, resolved: true } : alert
    ));
  };

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const filterAlerts = (type?: Alert["type"], showResolved = true) => {
    let filtered = alerts;
    if (type) {
      filtered = filtered.filter(alert => alert.type === type);
    }
    if (!showResolved) {
      filtered = filtered.filter(alert => !alert.resolved);
    }
    return filtered;
  };

  const unreadCount = alerts.filter(a => !a.resolved).length;
  const criticalCount = alerts.filter(a => a.type === "critical" && !a.resolved).length;
  const warningCount = alerts.filter(a => a.type === "warning" && !a.resolved).length;

  return (
    <div className="flex min-h-screen bg-background">
      {/* <DashboardSidebar /> */}
      
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">AI Alerts & Notifications</h1>
          <p className="text-muted-foreground">Real-time alerts and intelligent notifications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unread Alerts</p>
                  <p className="text-3xl font-bold">{unreadCount}</p>
                </div>
                <Bell className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Critical</p>
                  <p className="text-3xl font-bold text-destructive">{criticalCount}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Warnings</p>
                  <p className="text-3xl font-bold text-warning">{warningCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Alert Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all">
                  All ({alerts.length})
                </TabsTrigger>
                <TabsTrigger value="critical">
                  Critical ({alerts.filter(a => a.type === "critical").length})
                </TabsTrigger>
                <TabsTrigger value="warning">
                  Warning ({alerts.filter(a => a.type === "warning").length})
                </TabsTrigger>
                <TabsTrigger value="info">
                  Info ({alerts.filter(a => a.type === "info").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {filterAlerts().map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${getBgColor(alert.type, alert.resolved)} hover:shadow-md transition-shadow duration-200`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3 flex-1">
                        <div className={`mt-1 ${getTextColor(alert.type)}`}>
                          {getIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${alert.resolved ? "line-through text-muted-foreground" : ""}`}>
                              {alert.title}
                            </h3>
                            {alert.resolved && (
                              <Badge variant="outline" className="text-success border-success">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm mb-2 ${alert.resolved ? "text-muted-foreground" : ""}`}>
                            {alert.message}
                          </p>
                          {alert.patient && (
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{alert.patient}</span>
                              {alert.room && (
                                <>
                                  <span>•</span>
                                  <span>Room {alert.room}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{alert.time}</span>
                            </div>
                          )}
                          {!alert.patient && (
                            <p className="text-xs text-muted-foreground">{alert.time}</p>
                          )}
                        </div>
                      </div>
                      {!alert.resolved && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                            className="gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissAlert(alert.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              {["critical", "warning", "info"].map((type) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  {filterAlerts(type as Alert["type"]).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${getBgColor(alert.type, alert.resolved)} hover:shadow-md transition-shadow duration-200`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 flex-1">
                          <div className={`mt-1 ${getTextColor(alert.type)}`}>
                            {getIcon(alert.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold ${alert.resolved ? "line-through text-muted-foreground" : ""}`}>
                                {alert.title}
                              </h3>
                              {alert.resolved && (
                                <Badge variant="outline" className="text-success border-success">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm mb-2 ${alert.resolved ? "text-muted-foreground" : ""}`}>
                              {alert.message}
                            </p>
                            {alert.patient && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{alert.patient}</span>
                                {alert.room && (
                                  <>
                                    <span>•</span>
                                    <span>Room {alert.room}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{alert.time}</span>
                              </div>
                            )}
                            {!alert.patient && (
                              <p className="text-xs text-muted-foreground">{alert.time}</p>
                            )}
                          </div>
                        </div>
                        {!alert.resolved && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveAlert(alert.id)}
                              className="gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissAlert(alert.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Alerts;
