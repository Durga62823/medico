import { useState } from "react";
import { AlertCircle, AlertTriangle, Info, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  message: string;
  time: string;
  patient?: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "critical",
    message: "Abnormal heart rate detected - immediate attention required",
    time: "2 min ago",
    patient: "Mr. Evans (Rm 504)",
  },
  {
    id: "2",
    type: "warning",
    message: "Medication due in 15 minutes",
    time: "13 min ago",
    patient: "Ms. Li (Rm 501)",
  },
  {
    id: "3",
    type: "info",
    message: "Lab results available for review",
    time: "1 hour ago",
    patient: "Mr. Johnson (Rm 503)",
  },
];

export const AlertsCard = () => {
  const [activeTab, setActiveTab] = useState("all");

  const getIcon = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "info":
        return <Info className="w-5 h-5 text-info" />;
    }
  };

  const getBgColor = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return "bg-destructive/10";
      case "warning":
        return "bg-warning/10";
      case "info":
        return "bg-info/10";
    }
  };

  return (
    <Card className="col-span-2 animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          AI Alerts & Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="warning">Warning</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-3 mt-4">
            {mockAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg ${getBgColor(alert.type)} flex gap-3 hover:shadow-md transition-shadow duration-200`}
              >
                {getIcon(alert.type)}
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.message}</p>
                  {alert.patient && (
                    <p className="text-xs text-muted-foreground mt-1">{alert.patient}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </TabsContent>
          {["critical", "warning", "info"].map((type) => (
            <TabsContent key={type} value={type} className="space-y-3 mt-4">
              {mockAlerts
                .filter((alert) => alert.type === type)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg ${getBgColor(alert.type)} flex gap-3 hover:shadow-md transition-shadow duration-200`}
                  >
                    {getIcon(alert.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{alert.message}</p>
                      {alert.patient && (
                        <p className="text-xs text-muted-foreground mt-1">{alert.patient}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
