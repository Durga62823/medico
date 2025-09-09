import { useState, useEffect } from "react";
import { AlertTriangle, X, MessageSquare, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { toast } from "sonner";

// Assume this API service exists for fetching and updating notifications
const notificationAPI = {
  getNotifications: async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json(); // Returns array of notifications
  },
  dismiss: async (id: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/notifications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to dismiss");
    return res.json();
  }
};

interface Notification {
  id: string;
  type: "critical" | "message" | "lab";
  title: string;
  patient: string;
  time: string;
}

const notificationIcons = {
  critical: AlertTriangle,
  message: MessageSquare,
  lab: FlaskConical,
};

const notificationColors = {
  critical: "bg-red-50 border-red-500 text-red-700",
  message: "bg-purple-50 border-purple-500 text-purple-700",
  lab: "bg-blue-50 border-blue-500 text-blue-700",
};

export const NotificationsCenter = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: notificationAPI.getNotifications,
  });

  // Real-time updates with Socket.IO
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("token") || "" },
    });

    socket.on("connect", () => console.log("✅ WebSocket connected for notifications"));

    socket.on("notification:created", (newNotif: Notification) => {
      queryClient.setQueryData(["notifications"], (old: Notification[] | undefined) =>
        old ? [newNotif, ...old] : [newNotif]
      );
      toast.success("New notification received");
    });

    socket.on("notification:deleted", (deletedId: string) => {
      queryClient.setQueryData(["notifications"], (old: Notification[] | undefined) =>
        old?.filter(n => n.id !== deletedId)
      );
    });

    return () => socket.disconnect();
  }, [queryClient]);

  const dismissNotification = async (id: string) => {
    try {
      await notificationAPI.dismiss(id);
      queryClient.invalidateQueries(["notifications"]);
      toast.info("Notification dismissed");
    } catch (error) {
      toast.error("Failed to dismiss notification");
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
            const Icon = notificationIcons[notification.type];
            const colorClass = notificationColors[notification.type];

            return (
              <div
                key={notification.id}
                className={`flex items-start justify-between rounded-lg border-l-4 p-4 transition hover:shadow-md hover:scale-[1.01] ${colorClass}`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <Icon className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Patient: {notification.patient}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-muted"
                  onClick={() => dismissNotification(notification.id)}
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
