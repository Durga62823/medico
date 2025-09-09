import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { io } from "socket.io-client";

// Components
import { DashboardHeader } from "@/components/doctor/DashboardHeader";
import { AppointmentTimeline } from "@/components/doctor/AppointmentTimeline";
import { NotificationsCenter } from "@/components/doctor/NotificationsCenter";
import { InPatientSnapshot } from "@/components/doctor/InPatientSnapshot";
import PatientDetailsDialog from "@/components/PatientDetailsDialog";
import ActionsPage from "./ActionsPage";
import HowItWorks from "@/components/doctor/Howitworks";



// UI
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// API
import { patientAPI, appointmentAPI } from "@/services/api";

const Index = () => {
  const queryClient = useQueryClient();
  const [doctorId, setDoctorId] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patient_id: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
    appointment_type: "in-person",
    status: "scheduled",
  });

  const today = new Date().toISOString().split("T")[0];

  // ----------------- Helpers -----------------
  const safeParseUser = () => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error("Invalid user JSON in localStorage:", raw);
      return null;
    }
  };

  // ----------------- Doctor ID -----------------
  useEffect(() => {
    const userData = safeParseUser();
    if (userData?.id) setDoctorId(userData.id);
  }, []);

  // ----------------- Queries -----------------
  const { data: patients = [] } = useQuery({
    queryKey: ["patients", doctorId],
    queryFn: async () => {
      const res = await patientAPI.getAllPatients({ assigned_doctor: doctorId });
      return res.data || [];
    },
    enabled: !!doctorId,
  });

  const { data: stats } = useQuery({
    queryKey: ["doctorStats", doctorId, today],
    queryFn: async () => {
      if (!doctorId) return null;

      const [resPatients, resAppointments] = await Promise.all([
        patientAPI.getAllPatients({ assigned_doctor: doctorId }),
        appointmentAPI.getAppointments({ staff_id: doctorId, from: today, to: today }),
      ]);

      const patients = resPatients.data || [];
      const appointments = resAppointments.data || [];

      return {
        totalPatients: patients.length,
        todayAppointments: appointments.length,
        criticalPatients: patients.filter((p: any) => p.status === "critical").length,
        dischargedToday: patients.filter(
          (p: any) => p.status === "discharged" && p.dischargedAt?.startsWith(today)
        ).length,
      };
    },
    enabled: !!doctorId,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["doctorAppointments", doctorId, today],
    queryFn: async () => {
      const res = await appointmentAPI.getAppointments({ staff_id: doctorId, from: today, to: today });
      return (res.data || []).map((appt: any) => ({
        id: appt._id,
        patientName: appt.patient_id?.full_name || "Unknown",
        time: appt.appointment_time,
        reason: appt.notes || "No notes",
        status: appt.status,
      }));
    },
    enabled: !!doctorId,
  });

  // ----------------- Mutations -----------------
  const addAppointmentMutation = useMutation({
    mutationFn: async (data: any) =>
      appointmentAPI.createAppointment({ ...data, staff_id: doctorId }),
    onSuccess: () => {
      queryClient.invalidateQueries(["doctorAppointments", doctorId, today]);
      queryClient.invalidateQueries(["doctorStats", doctorId, today]);
      setIsAddDialogOpen(false);
      setNewAppointment({
        patient_id: "",
        appointment_date: "",
        appointment_time: "",
        notes: "",
        appointment_type: "in-person",
        status: "scheduled",
      });
    },
    onError: (err) => console.error("Failed to add appointment:", err),
  });

  // ----------------- WebSocket -----------------
  useEffect(() => {
    if (!doctorId) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("token") || "" },
    });

    socket.on("connect", () => console.log("WebSocket connected"));

    socket.on("appointment:updated", () => {
      queryClient.invalidateQueries(["doctorAppointments", doctorId, today]);
      queryClient.invalidateQueries(["doctorStats", doctorId, today]);
    });

    return () => socket.disconnect();
  }, [doctorId, queryClient, today]);

  // ----------------- Handlers -----------------
  const handleAddAppointment = () => addAppointmentMutation.mutate(newAppointment);

  // ----------------- Render -----------------
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <DashboardHeader/>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        {/* Left: Appointments & Actions */}
        <div className="lg:col-span-3 space-y-6">
          <AppointmentTimeline
            appointments={appointments}
            onAppointmentClick={(apt) => console.log(apt)} 
            onSelectPatient={setSelectedAppointment} // ✅ fixed
            selectedId={selectedAppointment?.id}
          />
          <ActionsPage />
        </div>

        {/* Right: Patient Details, Notifications, Snapshots */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAppointment && (
            <PatientDetailsDialog
              appointment={selectedAppointment}
              onClose={() => setSelectedAppointment(null)}
            />
          )}
          {/* <NotificationsCenter /> */}
          <InPatientSnapshot />
        </div>
      </div>

      {/* Add Appointment Modal */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <Select
              value={newAppointment.patient_id}
              onValueChange={(value) =>
                setNewAppointment({ ...newAppointment, patient_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient: any) => (
                  <SelectItem key={patient._id} value={patient._id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={newAppointment.appointment_date}
              onChange={(e) =>
                setNewAppointment({ ...newAppointment, appointment_date: e.target.value })
              }
            />

            <Input
              type="time"
              value={newAppointment.appointment_time}
              onChange={(e) =>
                setNewAppointment({ ...newAppointment, appointment_time: e.target.value })
              }
            />

            <Input
              value={newAppointment.notes}
              onChange={(e) =>
                setNewAppointment({ ...newAppointment, notes: e.target.value })
              }
              placeholder="Notes / Reason"
            />

            <Select
              value={newAppointment.appointment_type}
              onValueChange={(value) =>
                setNewAppointment({ ...newAppointment, appointment_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-person">In-Person</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="follow-up">Follow-Up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleAddAppointment}
              disabled={addAppointmentMutation.isLoading}
            >
              {addAppointmentMutation.isLoading ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* How It Works */}
      <HowItWorks />
    </div>
  );
};

export default Index;
