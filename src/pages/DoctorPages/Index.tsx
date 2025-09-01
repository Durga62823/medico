import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/doctor/Navigation";
import { AppointmentTimeline } from "@/components/doctor/AppointmentTimeline";
import { NotificationsCenter } from "@/components/doctor/NotificationsCenter";
import { QuickActions } from "@/components/doctor/QuickActions";
import { InPatientSnapshot } from "@/components/doctor/InPatientSnapshot";
import PatientDetailsDialog from "@/components/PatientDetailsDialog";
import { DashboardHeader } from "@/components/doctor/DashboardHeader";
import { 
  Users,
  Calendar,
  User,
  Bell,
  Zap,
  Bed,
  AlertCircle,
  CheckCircle,
  LogOut,FileText,BarChart3,Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { patientAPI, appointmentAPI } from "@/services/api";
import { io } from "socket.io-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ActionsPage from "./ActionsPage";

const Index = () => {
  const queryClient = useQueryClient();
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



  const [doctorId, setDoctorId] = useState("");
  
  function safeParseUser() {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    if (!raw || raw === "undefined" || raw === "null") return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error("Invalid JSON in localStorage for 'user':", raw);
      return null;
    }
  }
  
  useEffect(() => {
    const userData = safeParseUser();
    if (userData?.id) {
      setDoctorId(userData.id);
    }
  }, []);
  

  const today = new Date().toISOString().split("T")[0];

  // ✅ Fetch patients assigned to doctor
  const { data: patients = [] } = useQuery({
    queryKey: ["patients", doctorId],
    queryFn: async () => {
      const res = await patientAPI.getAllPatients({ assigned_doctor: doctorId });
      return res.data;
    },
    enabled: !!doctorId,
  });

  // ✅ Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["doctorStats", doctorId],
    queryFn: async () => {
      const [patientsRes, appointmentsRes] = await Promise.all([
        patientAPI.getAllPatients({ assigned_doctor: doctorId }),
        appointmentAPI.getAppointments({ staff_id: doctorId, from: today, to: today }),
      ]);
      const patientsData = patientsRes.data;
      const appointmentsData = appointmentsRes.data;

      return {
        totalPatients: patientsData.length,
        todayAppointments: appointmentsData.length,
        criticalPatients: patientsData.filter((p: any) => p.status === "critical").length,
        dischargedToday: patientsData.filter(
          (p: any) => p.status === "discharged" && p.discharge_date?.startsWith(today)
        ).length,
      };
    },
    enabled: !!doctorId,
  });

  // ✅ Fetch today's appointments for timeline
  const { data: appointments = [] } = useQuery({
    queryKey: ["doctorAppointments", doctorId, today],
    queryFn: async () => {
      const res = await appointmentAPI.getAppointments({ staff_id: doctorId, from: today, to: today });
      return res.data.map((appt: any) => ({
        id: appt._id,
        patientName: appt.patient_id?.full_name || "Unknown",
        time: appt.appointment_time,
        reason: appt.notes || "No notes",
        status: appt.status,
        isNext: false,
        hasAllergies: false,
      }));
    },
    enabled: !!doctorId,
  });

  // ✅ Add appointment mutation
  const addAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await appointmentAPI.createAppointment({ ...data, staff_id: doctorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["doctorAppointments", doctorId, today]);
      queryClient.invalidateQueries(["doctorStats", doctorId]);
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
    onError: (error) => {
      console.error("Failed to add appointment:", error);
    },
  });

  // ✅ Real-time updates with Socket.IO
  useEffect(() => {
    if (!doctorId) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: typeof window !== "undefined" ? localStorage.getItem("token") : null },
    });

    socket.on("connect", () => console.log("WebSocket connected"));

    socket.on("appointment:updated", () => {
      queryClient.invalidateQueries(["doctorAppointments", doctorId, today]);
      queryClient.invalidateQueries(["doctorStats", doctorId]);
    });

    return () => {
      socket.disconnect();
    };
  }, [doctorId, queryClient, today]);

  const handleAddAppointment = () => {
    addAppointmentMutation.mutate(newAppointment);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-full mx-auto">
        <DashboardHeader />
        <div className="glass rounded-2xl p-6 mb-6 fade-in-stagger">

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-primary rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="medical-data text-2xl font-bold text-primary">23</p>
                </div>
                <Zap className="h-8 w-8 text-info" />
              </div>
            </div>
            
            <div className="glass-secondary rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="medical-data text-2xl font-bold text-primary">127</p>
                </div>
                <BarChart3 className="h-8 w-8 text-success" />
              </div>
            </div>
            
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Most Used</p>
                  <p className="text-sm font-semibold text-foreground">Charting</p>
                </div>
                <FileText className="h-8 w-8 text-warning" />
              </div>
            </div>
            
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg/Day</p>
                  <p className="medical-data text-2xl font-bold text-primary">18.2</p>
                </div>
                <Clock className="h-8 w-8 text-medical-emergency" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <AppointmentTimeline
             
              onAppointmentClick={setSelectedAppointment}
              selectedId={selectedAppointment?.id}
            />
            <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
              Schedule New Appointment
            </Button>
            {/* <ActionsPage/> */}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedAppointment && (
              <PatientDetailsDialog
                appointment={selectedAppointment}
                onClose={() => setSelectedAppointment(null)}
              />
            )}
            <NotificationsCenter />
            {/* <QuickActions /> */}
            <InPatientSnapshot />
          </div>
        </div>

        {/* ✅ Add Appointment Modal */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Dynamic Patients List */}
              <Select
                value={newAppointment.patient_id}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, patient_id: value })}
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
                onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })}
                placeholder="Appointment Date"
              />
              <Input
                type="time"
                value={newAppointment.appointment_time}
                onChange={(e) => setNewAppointment({ ...newAppointment, appointment_time: e.target.value })}
                placeholder="Appointment Time"
              />
              <Input
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                placeholder="Notes/Reason"
              />

              <Select
                value={newAppointment.appointment_type}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, appointment_type: value })}
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
              <Button onClick={handleAddAppointment} disabled={addAppointmentMutation.isLoading}>
                {addAppointmentMutation.isLoading ? "Scheduling..." : "Schedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;