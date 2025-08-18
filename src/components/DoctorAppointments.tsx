import { useEffect } from "react";

import { jwtDecode } from "jwt-decode";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentAPI } from "@/services/api";
import { io } from "socket.io-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Calendar, Video, MapPin, Phone } from "lucide-react";

// Appointment type
interface Appointment {
  _id: string;
  patient_id: { full_name: string }; // populated user
  appointment_date: string;
  appointment_time: string;
  appointment_type: "in-person" | "video" | "follow-up";
  status: "scheduled" | "completed" | "no-show" | "cancelled";
  notes: string;
}



function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("token");
  if (!raw) return null;

  try {
    // Decode the JWT to get the payload.
    // The payload contains the user information.
    return jwtDecode(raw);
  } catch (error) {
    console.error("Failed to decode JWT from localStorage:", error);
    return null;
  }
}

const DoctorAppointments = () => {
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const doctorId = user?.id || ""; // 👈 get doctorId safely

  // ✅ Fetch appointments from API
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["doctorAppointments", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const res = await appointmentAPI.getAppointments({ staff_id: doctorId });
      return res.data;
    },
    enabled: !!doctorId,
  });

  // ✅ Real-time updates via socket
  useEffect(() => {
    if (!doctorId) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: typeof window !== "undefined" ? localStorage.getItem("token") : null },
    });

    socket.on("connect", () => console.log("WebSocket connected ✅"));

    socket.on("appointment:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["doctorAppointments", doctorId] });
    });

    return () => {
      socket.disconnect();
    };
  }, [doctorId, queryClient]);

  // Helpers
  const getTypeIcon = (type: Appointment["appointment_type"]) => {
    switch (type) {
      case "video": return <Video className="h-4 w-4" />;
      case "follow-up": return <Phone className="h-4 w-4" />;
      case "in-person": return <MapPin className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: Appointment["appointment_type"]) => {
    switch (type) {
      case "video": return "bg-info/10 text-info border-info/20";
      case "follow-up": return "bg-warning/10 text-warning border-warning/20";
      case "in-person": return "bg-success/10 text-success border-success/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "scheduled": return "bg-primary text-primary-foreground";
      case "no-show": return "bg-warning text-warning-foreground";
      case "cancelled": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  // ✅ Filter appointments for today only
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const todayAppointments = appointments.filter(
    (apt) => apt.appointment_date.startsWith(today) && apt.status !== "cancelled"
  );

  const upcomingAppointments = todayAppointments.filter((apt) => apt.status === "scheduled");

  if (!doctorId) {
    return <div className="text-center p-6 text-red-500">⚠️ No doctor logged in</div>;
  }

  if (isLoading) {
    return <div className="text-center p-6">Loading appointments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Today's Schedule</h3>
          <p className="text-sm text-muted-foreground">
            {upcomingAppointments.length} upcoming •{" "}
            {todayAppointments.filter((apt) => apt.status === "completed").length} completed
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {todayAppointments
          .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
          .map((appointment) => (
            <Card key={appointment._id} className="shadow-medical border-0 transition-all hover:shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="text-center min-w-[80px]">
                      <div className="text-lg font-bold text-primary">
                        {formatTime(appointment.appointment_time)}
                      </div>
                    </div>

                    <Avatar className="h-10 w-10 border-2 border-muted">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {appointment.patient_id.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-foreground">{appointment.patient_id.full_name}</h4>
                        <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{appointment.notes}</span>
                        <Badge variant="outline" className={`text-xs ${getTypeColor(appointment.appointment_type)}`}>
                          {getTypeIcon(appointment.appointment_type)}
                          <span className="ml-1 capitalize">
                            {appointment.appointment_type.replace("-", " ")}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {todayAppointments.length === 0 && (
        <Card className="shadow-medical border-0">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No appointments today</h3>
            <p className="text-muted-foreground mb-4">Your schedule is clear for today.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorAppointments;
