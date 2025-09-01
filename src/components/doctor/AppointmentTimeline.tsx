import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, User } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";

export interface Appointment {
  id: string;
  patientName: string;
  time: string;
  reason: string;
  appointment_date: string;
  status: "upcoming" | "checked-in" | "in-progress" | "completed";
  hasAllergies?: boolean;
}

interface AppointmentTimelineProps {
  onAppointmentClick: (appointment: Appointment) => void;
}

const API_BASE_URL = "http://localhost:5000";

// Decode JWT for doctor ID
function getDoctorIdFromToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || null;
  } catch {
    return null;
  }
}

// API
const appointmentAPI = {
  getAppointments: async ({ staff_id }: { staff_id: string }) => {
    const token = localStorage.getItem("token");
    if (!token || !staff_id) throw new Error("Missing token or staff_id");
    const res = await fetch(`${API_BASE_URL}/api/appointments?staff_id=${staff_id}`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch appointments");
    return res.json();
  }
};

export const AppointmentTimeline = ({ onAppointmentClick }: AppointmentTimelineProps) => {
  const queryClient = useQueryClient();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const id = getDoctorIdFromToken();
    if (id) setDoctorId(id);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["doctorAppointments", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      console.log("Fetching appointments for doctorId:", doctorId);

      const res = await appointmentAPI.getAppointments({ staff_id: doctorId });
      console.log("Raw API response:", res);

      // Map API response to frontend format
      const mappedAppointments = (res.data ?? []).map((apt: any) => ({
        id: apt._id,
        patientName: apt.patient_id?.full_name || "Unknown",
        time: apt.appointment_time,
        reason: apt.notes || apt.appointment_type || "",
        appointment_date: apt.appointment_date,
        status: apt.status === "scheduled" ? "upcoming" : apt.status,
      }));

      console.log("Mapped appointments:", mappedAppointments);
      return mappedAppointments;
    },
    enabled: !!doctorId,
  });

  // WebSocket to update appointments in real-time
  useEffect(() => {
    if (!doctorId) return;
    const socketInstance = io(API_BASE_URL, {
      auth: { token: localStorage.getItem("token") },
    });
    setSocket(socketInstance);

    socketInstance.on("appointment:created", () => {
      console.log("Socket: appointment created");
      queryClient.invalidateQueries(["doctorAppointments", doctorId]);
    });

    socketInstance.on("appointment:updated", () => {
      console.log("Socket: appointment updated");
      queryClient.invalidateQueries(["doctorAppointments", doctorId]);
    });

    return () => socketInstance.disconnect();
  }, [doctorId, queryClient]);

  // Only show **next upcoming appointment for today**
  const currentAppointment = appointments
    .filter((apt) => apt.status === "upcoming" && apt.appointment_date === today)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  console.log("Current Appointment:", currentAppointment);

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="glass p-6 rounded-xl">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5" /> Current Appointment
      </h2>

      {currentAppointment ? (
        <div
          className="p-4 border rounded-lg cursor-pointer hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{currentAppointment.time}</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{currentAppointment.patientName}</span>
          </div>
          <div className="text-sm text-muted-foreground">{currentAppointment.reason}</div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground mb-4">No upcoming appointments for today.</div>
      )}

  
    </div>
  );
};
