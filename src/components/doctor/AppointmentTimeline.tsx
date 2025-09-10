import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, User } from "lucide-react";
import { io } from "socket.io-client";

export interface Appointment {
  id: string;
  patientName: string;
  time: string;
  reason: string;
  appointment_date: string;
  status: "upcoming" | "checked-in" | "in-progress" | "completed" | "scheduled";
  hasAllergies?: boolean;
}

interface AppointmentTimelineProps {
  onAppointmentClick?: (appointment: Appointment) => void; // optional
}

const API_BASE_URL = "http://localhost:5000";

function decodeToken(token?: string | null) {
  if (!token) return null;
  try {
    const base64Payload = token.split(".")[1];
    const jsonPayload = atob(base64Payload);
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getDoctorId() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  const userPayload = decodeToken(token);
  return userPayload?.id || null;
}

const appointmentAPI = {
  getAppointments: async (staff_id: string) => {
    const token = localStorage.getItem("token");
    if (!token || !staff_id) throw new Error("Missing token or staff_id");
    const res = await fetch(`${API_BASE_URL}/api/appointments?staff_id=${staff_id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },
  updateAppointment: async (id: string, updates: Record<string, unknown>) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update");
    return res.json();
  },
};

export const AppointmentTimeline = ({ onAppointmentClick }: AppointmentTimelineProps) => {
  const queryClient = useQueryClient();
  const doctorId = getDoctorId();

  const today = new Date().toISOString().slice(0, 10); // e.g. "2025-09-07"

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["doctorAppointments", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const res = await appointmentAPI.getAppointments(doctorId);
      const rawAppointments = res.data ?? res; // depends on backend response structure
      return rawAppointments
    },
    enabled: !!doctorId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  useEffect(() => {
    if (!doctorId) return;
    const socket = io(API_BASE_URL, {
      auth: { token: localStorage.getItem("token") },
    });
    const invalidate = () => queryClient.invalidateQueries(["doctorAppointments", doctorId]);
    socket.on("appointment:created", invalidate);
    socket.on("appointment:updated", invalidate);
    socket.on("appointment:deleted", invalidate);
    return () => socket.disconnect();
  }, [doctorId, queryClient]);

  const currentAppointment = useMemo(() => {
    if (!appointments.length) return undefined;

    const now = new Date();

    // Filter for appointments today with status upcoming/scheduled, and time >= now if time present
    const todaysAppointments = appointments.filter(apt => {
      const aptDateStr = new Date(apt.appointment_date).toISOString().slice(0,10);
      if (!(apt.status === "upcoming" || apt.status === "scheduled")) return false;
      if (aptDateStr !== today) return false;
      if (!apt.time) return true; // no time means assume all day? Include it
      // Parse appointment date+time reliably
      const aptDateTime = new Date(`${apt.appointment_date}T${apt.time}`);
      return aptDateTime >= now;
    });

    // Sort ascending by date+time
    return todaysAppointments.sort((a,b) => {
      const aTime = new Date(`${a.appointment_date}T${a.time || "00:00"}`).getTime();
      const bTime = new Date(`${b.appointment_date}T${b.time || "00:00"}`).getTime();
      return aTime - bTime;
    })[0];
  }, [appointments, today]);
// console.log("Current Appointment:", currentAppointment);
  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
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
<div className="glass p-6 rounded-xl">
  <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
    <Clock className="h-5 w-5" /> Current Appointment
  </h2>

  {isLoading ? (
    <div className="p-6 border rounded-lg bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 text-sm">Fetching appointment details...</p>
    </div>
  ) : currentAppointment ? (
    <div
      className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow bg-white"
      onClick={() => onAppointmentClick?.(currentAppointment)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-black">{formatTime(currentAppointment.appointment_time)}</span>
        <span className="text-sm text-white rounded-full font-semibold bg-black px-3 py-1">
          {capitalize(currentAppointment.status)}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <User className="w-5 h-5 text-black" />
        <span className="text-lg font-bold text-black">{currentAppointment.patient_id.full_name}</span>
      </div>
      <div className="mb-2 text-sm text-black">
        Appointment Type:{" "}
        <span className="font-medium text-red-600">
          {currentAppointment.appointment_type || "General Consultation"}
        </span>
      </div>
      <div className="mb-3 text-sm text-black">
        {currentAppointment.notes || "No notes available."}
      </div>
      <div className="text-lg font-semibold text-black">
        Duration: {currentAppointment.duration_minutes} mins
      </div>
    </div>
  ) : (
    <div className="p-4 border rounded-lg text-center bg-white/50 backdrop-blur-sm">
      <p className="text-base font-medium text-gray-600">No upcoming appointments for today.</p>
      <p className="text-sm text-gray-500">You are all caught up!</p>
    </div>
  )}
</div>
  );
};