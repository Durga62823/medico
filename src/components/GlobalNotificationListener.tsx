import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { AlertTriangle, UserPlus, TrendingUp, Activity } from "lucide-react";

interface VitalAlert {
  patient_id: string;
  alerts: Array<{
    type: string;
    title: string;
    message: string;
  }>;
}

interface PatientEvent {
  patient_name: string;
  room?: string;
  department?: string;
  old_status?: string;
  new_status?: string;
}

export const GlobalNotificationListener = () => {
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("token") || "" },
    });

    socket.on("connect", () => {
      console.log("✅ Global notification listener connected");
    });

    // Vital alerts - Critical notifications
    socket.on("vital_alert", (alertData: VitalAlert) => {
      if (alertData.alerts && alertData.alerts.length > 0) {
        alertData.alerts.forEach((alert) => {
          if (alert.type === "critical") {
            toast.error(alert.title, {
              description: alert.message,
              icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
              duration: 6000,
            });
          } else if (alert.type === "warning") {
            toast.warning(alert.title, {
              description: alert.message,
              icon: <Activity className="h-5 w-5 text-yellow-500" />,
              duration: 5000,
            });
          }
        });
      }
    });

    // New patient admission
    socket.on("patient_admitted", (data: PatientEvent) => {
      toast.info("New Patient Admitted", {
        description: `${data.patient_name} has been admitted to ${data.department}, Room ${data.room}`,
        icon: <UserPlus className="h-5 w-5 text-blue-500" />,
        duration: 5000,
      });
    });

    // Patient condition improved
    socket.on("patient_improved", (data: PatientEvent) => {
      toast.success("Patient Condition Improved", {
        description: `${data.patient_name}'s condition improved from ${data.old_status} to ${data.new_status}`,
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
        duration: 5000,
      });
    });

    // New alert created
    socket.on("alert:created", (alert: any) => {
      const patientName = alert.patient_id?.full_name || "Patient";
      
      if (alert.type === "critical") {
        toast.error(alert.title, {
          description: `${patientName}: ${alert.message}`,
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          duration: 6000,
        });
      } else if (alert.type === "warning") {
        toast.warning(alert.title, {
          description: `${patientName}: ${alert.message}`,
          icon: <Activity className="h-5 w-5 text-yellow-500" />,
          duration: 5000,
        });
      } else if (alert.type === "info") {
        toast.info(alert.title, {
          description: `${patientName}: ${alert.message}`,
          icon: <UserPlus className="h-5 w-5 text-blue-500" />,
          duration: 4000,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
};
