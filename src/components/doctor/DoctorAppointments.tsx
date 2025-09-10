import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox"; // ✅ added checkbox
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const API_BASE_URL = "http://localhost:5000";

// Decode JWT to extract doctorId
function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

function getStoredUser() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  return decodeJwt(token);
}

const appointmentAPI = {
  getAppointments: async ({ staff_id }: { staff_id: string }) => {
    const token = localStorage.getItem("token");
    if (!token || !staff_id) throw new Error("Authentication token or staff ID is missing.");

    const response = await fetch(`${API_BASE_URL}/api/appointments?staff_id=${staff_id}`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch appointments");
    return response.json();
  },

  updateAppointment: async (id: string, updates: Record<string, unknown>) => {
    const token = localStorage.getItem("token");
    console.log("Updating appointment with ID:", id);
  
    
    const response = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error("Failed to update appointment");
    return response.json();
  },
};

const DoctorAppointments = () => {
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const doctorId = user?.id || "";
console.log("Doctor ID:", doctorId);
  const { data: appointments = [], isLoading, isError } = useQuery({
    queryKey: ["doctorAppointments", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const res = await appointmentAPI.getAppointments({ staff_id: doctorId });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!doctorId,
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) =>
      appointmentAPI.updateAppointment(id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorAppointments", doctorId] });
      toast.success("Appointment status updated!");
    },
    onError: () => toast.error("Failed to update appointment."),
  });

  useEffect(() => {
    if (!doctorId) return;
    const socket = io(API_BASE_URL, {
      auth: { token: localStorage.getItem("token") },
    });

    socket.on("appointment:created", () => queryClient.invalidateQueries(["doctorAppointments", doctorId]));
    socket.on("appointment:updated", () => queryClient.invalidateQueries(["doctorAppointments", doctorId]));
    socket.on("appointment:deleted", () => queryClient.invalidateQueries(["doctorAppointments", doctorId]));

    return () => socket.disconnect();
  }, [doctorId, queryClient]);

  const todayAppointments = useMemo(() => {
    const today = new Date();
    return appointments.filter(
      (apt: any) =>
        new Date(apt.appointment_date).toDateString() === today.toDateString() &&
        apt.status !== "cancelled"
    );
  }, [appointments]);

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hour, minute] = time.split(":");
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Today's Schedule</h3>
        <p className="text-sm text-muted-foreground">
          {todayAppointments.filter((a) => a.status === "scheduled").length} Upcoming •{" "}
          {todayAppointments.filter((a) => a.status === "completed").length} Completed •{" "}
        </p>
      </div>

      <div className="space-y-4">
{isLoading ? (
  <div className="flex justify-center items-center py-6">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-2 text-gray-500">Loading appointments...</p>
    </div>
  </div>
) : todayAppointments.length > 0 ? (
  todayAppointments
    .filter((apt) => apt.appointment_time) // remove missing time
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
    .map((apt) => (
      <motion.div
        key={apt._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="text-lg font-bold text-primary">
                {formatTime(apt.appointment_time)}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {apt.patient_id?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{apt.patient_id?.full_name}</span>
                  <Badge>{capitalize(apt.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {apt.notes || "No notes available"}
                </p>
              </div>
            </div>
            <Checkbox
              checked={apt.status === "completed"}
              onCheckedChange={(checked) =>
                updateAppointmentMutation.mutate({
                  id: apt._id,
                  newStatus: checked ? "completed" : "scheduled",
                })
              }
              disabled={updateAppointmentMutation.isPending}
            />
          </CardContent>
        </Card>
      </motion.div>
    ))
) : (
  <Card>
    <CardContent className="p-6 text-center">
      <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
      <h4 className="text-lg font-semibold">No appointments today</h4>
      <p className="text-muted-foreground">You're all caught up for now.</p>
    </CardContent>
  </Card>
)}

      </div>
    </div>
  );
};

export default DoctorAppointments;