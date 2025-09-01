import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      (apt: any) => new Date(apt.appointment_date).toDateString() === today.toDateString() && apt.status !== "cancelled"
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

  if (isError) return <p className="text-red-500">Failed to load appointments.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Today's Schedule</h3>
        <p className="text-sm text-muted-foreground">
          {todayAppointments.filter((a) => a.status === "scheduled").length} upcoming •{" "}
          {todayAppointments.filter((a) => a.status === "completed").length} completed
        </p>
      </div>

      <div className="space-y-4">
        {isLoading && <p className="text-center text-muted-foreground">Loading appointments...</p>}

        {todayAppointments.length > 0 ? (
          todayAppointments
          .filter((apt: any) => apt.appointment_time) // remove missing time
          .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
          .map((apt: any) =>(
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
                      <div className="text-lg font-bold text-primary">{formatTime(apt.appointment_time)}</div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {apt.patient_id?.full_name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{apt.patient_id?.full_name}</span>
                          <Badge>{apt.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{apt.notes || "No notes available"}</p>
                      </div>
                    </div>
                    {apt.status === "scheduled" && (
                      <Button
                        onClick={() => updateAppointmentMutation.mutate({ id: apt._id, newStatus: "completed" })}
                        disabled={updateAppointmentMutation.isPending}
                      >
                        {updateAppointmentMutation.isPending ? "Completing..." : "Complete"}
                      </Button>
                    )}
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
