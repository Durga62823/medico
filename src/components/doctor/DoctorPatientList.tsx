import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { patientAPI, vitalAPI, appointmentAPI } from "@/services/api";
import { io } from "socket.io-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Activity, CheckCircle, UserCheck, AlertTriangle, Calendar, Thermometer } from "lucide-react";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// ✅ Decode JWT safely
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
  } catch {
    return null;
  }
}

function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  return decodeJwt(raw);
}

// ✅ Types
interface Patient {
  _id: string;
  full_name: string;
  age: number;
  gender: string;
  condition: string;
  status: "Active" | "Discharged" | "Transferred";
  admission_date: string;
  date_of_birth: string;
  room: string;
  avatar?: string;
}

interface Vital {
  heart_rate: number;
  blood_pressure: number;
  temperature: number;
  oxygen_saturation: number;
  recorded_at: string;
}

const DoctorPatientList = () => {
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const doctorId = user?.id || "";
  const navigate = useNavigate();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedPatientForSchedule, setSelectedPatientForSchedule] = useState<Patient | null>(null);
  const [appointmentData, setAppointmentData] = useState({
    date: "",
    time: "",
    notes: "",
  });

  // ✅ Fetch patients
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["assignedPatients", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const res = await patientAPI.getAllPatients({ assigned_doctor: doctorId });
      console.log(res)
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!doctorId,
  });

  // ✅ Fetch latest vitals for patients
  const { data: vitalsMap = {} } = useQuery({
    queryKey: ["patientsVitals", patients.map((p) => p._id)],
    queryFn: async () => {
      const map: Record<string, Vital | null> = {};
      await Promise.all(
        patients.map(async (p) => {
          const res = await vitalAPI.getVitals(p._id);
          map[p._id] = Array.isArray(res.data) && res.data.length ? res.data[0] : null;
        })
      );
      return map;
    },
    enabled: patients.length > 0,
  });

  // ✅ Discharge patient mutation
  const dischargeMutation = useMutation({
    mutationFn: async ({ patientId }: { patientId: string }) => {
      const payload = { status: "Discharged", discharge_date: new Date().toISOString() };
      await patientAPI.updatePatient(patientId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignedPatients", doctorId] });
      toast.success("Patient discharged successfully!");
    },
    onError: (error: AxiosError) => {
      const msg = (error.response?.data as { message?: string })?.message || "Failed to discharge patient.";
      toast.error(msg);
    },
  });

  // ✅ Schedule appointment mutation
  const scheduleAppointmentMutation = useMutation({
    mutationFn: async (data: { patient_id: string; appointment_date: string; appointment_time: string; notes: string }) => {
      return await appointmentAPI.createAppointment({
        ...data,
        staff_id: doctorId,
        appointment_type: "follow-up",
        status: "scheduled",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorAppointments"] });
      toast.success("Visit scheduled successfully!");
      setScheduleDialogOpen(false);
      setAppointmentData({ date: "", time: "", notes: "" });
    },
    onError: (error: AxiosError) => {
      const msg = (error.response?.data as { message?: string })?.message || "Failed to schedule visit.";
      toast.error(msg);
    },
  });

  // ✅ WebSocket for real-time updates
  useEffect(() => {
    if (!doctorId) return;
    const socket = io("http://localhost:5000", {
      auth: { token: localStorage.getItem("token") },
    });
    socket.on("patient:assigned", () =>
      queryClient.invalidateQueries({ queryKey: ["assignedPatients", doctorId] })
    );
    return () => {
      socket.disconnect();
    };
  }, [doctorId, queryClient]);

  const getStatusBadge = (status: Patient["status"]) => {
    const colors = {
      Active: "bg-blue-100 text-blue-700",
      Transferred: "bg-yellow-100 text-yellow-700",
      Discharged: "bg-gray-200 text-gray-600",
    }[status];
    return (
      <Badge className={`text-xs flex items-center gap-1 ${colors}`}>
        {status === "Active" && <Activity className="h-3 w-3" />}
        {status === "Transferred" && <AlertTriangle className="h-3 w-3" />}
        {status === "Discharged" && <UserCheck className="h-3 w-3" />}
        {status}
      </Badge>
    );
  };

  const handleScheduleVisit = (patient: Patient) => {
    setSelectedPatientForSchedule(patient);
    setScheduleDialogOpen(true);
  };

  const handleScheduleSubmit = () => {
    if (!selectedPatientForSchedule || !appointmentData.date || !appointmentData.time) {
      toast.error("Please fill in all required fields");
      return;
    }
    scheduleAppointmentMutation.mutate({
      patient_id: selectedPatientForSchedule._id,
      appointment_date: appointmentData.date,
      appointment_time: appointmentData.time,
      notes: appointmentData.notes || "Follow-up visit",
    });
  };
function calculateAge(dobString: string) {
  const dob = new Date(dobString);
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}
  if (isLoadingPatients) {
  return (
    <div className="flex justify-center items-center p-6">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-gray-500">Loading patients...</p>
      </div>
    </div>
  );
}

return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-foreground">Current Patients</h3>
      <Badge variant="secondary" className="text-sm">{patients.length} Active</Badge>
    </div>

    {patients.length === 0 ? (
      <Card>
        <CardContent className="p-8 text-center">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No patients assigned</h3>
          <p className="text-muted-foreground">You currently have no active patients to manage.</p>
        </CardContent>
      </Card>
    ) : (
      <div className="grid gap-4">
        {patients.map((patient, index) => {
          const v = vitalsMap[patient._id];
          return (
            <motion.div
              key={patient._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={patient.avatar} />
                      <AvatarFallback>{patient.full_name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{patient.full_name}</h4>
                        {getStatusBadge(patient.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p><span className="font-medium text-foreground">Age:</span> {calculateAge(patient.date_of_birth)}</p>
                          <p><span className="font-medium text-foreground">Gender:</span> {patient.gender}</p>
                          <p><span className="font-medium text-foreground">Room:</span> {patient.room}</p>
                          <p><span className="font-medium text-foreground">Condition:</span> {patient.condition}</p>
                        </div>
                        <div>
                          <p className="flex items-center gap-1"><Heart className="h-4 w-4 text-red-500" /> {v?.heart_rate ?? "-"} BPM</p>
                          <p className="flex items-center gap-1"><Activity className="h-4 w-4 text-blue-500" /> {v?.blood_pressure?? "-"}</p>
                          <p className="flex items-center gap-1"><Thermometer className="h-4 w-4 text-orange-500" /> {v?.temperature ?? "-"}°C</p>
                          <p className="flex items-center gap-1"><Activity className="h-4 w-4 text-green-500" /> {v?.oxygen_saturation ?? "-"}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleScheduleVisit(patient)}>
                      <Calendar className="h-4 w-4 mr-2" /> Schedule Visit
                    </Button>
                    {patient.status !== "Discharged" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="border-green-500 text-green-600">
                            <CheckCircle className="h-4 w-4 mr-2" /> Discharge
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Discharge Patient</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to discharge {patient.full_name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => dischargeMutation.mutate({ patientId: patient._id })}
                              disabled={dischargeMutation.isPending}
                            >
                              {dischargeMutation.isPending ? "Discharging..." : "Confirm Discharge"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    )}

    {/* Schedule Visit Dialog */}
    <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Visit</DialogTitle>
          <DialogDescription>
            Schedule a follow-up visit for {selectedPatientForSchedule?.full_name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={appointmentData.date}
              onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={appointmentData.time}
              onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Enter visit notes or reason..."
              value={appointmentData.notes}
              onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleScheduleSubmit}
            disabled={scheduleAppointmentMutation.isPending}
          >
            {scheduleAppointmentMutation.isPending ? "Scheduling..." : "Schedule Visit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);
};

export default DoctorPatientList;