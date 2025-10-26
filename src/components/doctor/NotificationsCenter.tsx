import { useEffect } from "react";
import { AlertTriangle, X, MessageSquare, FlaskConical, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { toast } from "sonner";

// Use the alerts API instead of notifications
const alertAPI = {
  getAlerts: async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/alerts", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch alerts");
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

interface Notification {
  _id: string;
  patient_id: {
    _id: string;
    full_name: string;
  } | string;
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  dismissed: boolean;
}

const notificationIcons = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: UserPlus,
  message: MessageSquare,
  lab: FlaskConical,
};

const notificationColors = {
  critical: "bg-red-500/10 border-red-500/50 hover:bg-red-500/20",
  warning: "bg-yellow-500/10 border-yellow-500/50 hover:bg-yellow-500/20",
  info: "bg-blue-500/10 border-blue-500/50 hover:bg-blue-500/20",
  message: "bg-purple-500/10 border-purple-500/50 hover:bg-purple-500/20",
  lab: "bg-green-500/10 border-green-500/50 hover:bg-green-500/20",
};

const notificationTextColors = {
  critical: "text-red-600 dark:text-red-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  info: "text-blue-600 dark:text-blue-400",
  message: "text-purple-600 dark:text-purple-400",
  lab: "text-green-600 dark:text-green-400",
};

export const NotificationsCenter = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["alerts"],
    queryFn: alertAPI.getAlerts,
  });

  // Real-time updates with Socket.IO
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("token") || "" },
    });

    socket.on("connect", () => console.log("✅ WebSocket connected for notifications"));

    // Listen for new alerts - just update the list, toast is handled by GlobalNotificationListener
    socket.on("alert:created", (newAlert: Notification) => {
      queryClient.setQueryData(["alerts"], (old: Notification[] | undefined) =>
        old ? [newAlert, ...old] : [newAlert]
      );
    });

    // Refresh alerts on vital changes
    socket.on("vital_alert", () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    });

    // Refresh alerts on patient admission
    socket.on("patient_admitted", () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    });

    // Refresh alerts on patient improvement
    socket.on("patient_improved", () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    });

    socket.on("alert:deleted", (deletedId: string) => {
      queryClient.setQueryData(["alerts"], (old: Notification[] | undefined) =>
        old?.filter(n => n._id !== deletedId)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const dismissNotification = async (id: string) => {
    try {
      await alertAPI.dismiss(id);
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.info("Alert dismissed");
    } catch {
      toast.error("Failed to dismiss alert");
    }
  };

  if (isLoading) return <div>Loading notifications...</div>;

  return (
    <div className="rounded-xl border bg-card shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Notifications
        </h3>
        {notifications.length > 0 && (
          <Badge variant="destructive" className="px-2">
            {notifications.length}
          </Badge>
        )}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="text-center text-muted-foreground py-6">
          <div className="text-4xl mb-2">✓</div>
          <p>All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || AlertTriangle;
            const colorClass = notificationColors[notification.type];
            const textColorClass = notificationTextColors[notification.type];
            const patientName = typeof notification.patient_id === 'object' 
              ? notification.patient_id.full_name 
              : 'Unknown Patient';

            return (
              <div
                key={notification._id}
                className={`flex items-start justify-between rounded-lg border p-4 transition ${colorClass}`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <Icon className={`h-5 w-5 mt-0.5 ${textColorClass}`} />
                  <div>
                    <p className={`font-medium ${textColorClass}`}>{notification.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Patient: {patientName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-muted"
                  onClick={() => dismissNotification(notification._id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
