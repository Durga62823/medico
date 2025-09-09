import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { patientAPI, vitalAPI } from "@/services/api";
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
  room: string;
  avatar?: string;
}

interface Vital {
  heart_rate: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  temperature: number;
  oxygen_saturation: number;
  recorded_at: string;
}

const DoctorPatientList = () => {
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const doctorId = user?.id || "";
  const navigate = useNavigate();

  // ✅ Fetch patients
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["assignedPatients", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const res = await patientAPI.getAllPatients({ assigned_doctor: doctorId });
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

  // ✅ WebSocket for real-time updates
  useEffect(() => {
    if (!doctorId) return;
    const socket = io("http://localhost:5000", {
      auth: { token: localStorage.getItem("token") },
    });
    socket.on("patient:assigned", () =>
      queryClient.invalidateQueries({ queryKey: ["assignedPatients", doctorId] })
    );
    return () => socket.disconnect();
  }, [doctorId, queryClient]);

  // ✅ UI helpers
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

  const scheduleVisit = (name: string) => toast.info(`Next visit scheduled for ${name} at 2:00 PM.`);

  if (isLoadingPatients)
    return <div className="text-center p-6 text-gray-500">Loading patients...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Current Patients</h3>
        <Badge variant="secondary" className="text-sm">{patients.length} Active</Badge>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients assigned</h3>
            <p className="text-gray-500">You currently have no active patients to manage.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {patients.map((patient, index) => {
            const v = vitalsMap[patient._id];
            const bp = v ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` : "-";
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
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><span className="font-medium">Age:</span> {patient.age} • {patient.gender}</p>
                            <p><span className="font-medium">Room:</span> {patient.room}</p>
                            <p><span className="font-medium">Condition:</span> {patient.condition}</p>
                          </div>
                          <div>
                            <p className="flex items-center gap-1"><Heart className="h-4 w-4 text-red-500" /> {v?.heart_rate ?? "-"} BPM</p>
                            <p className="flex items-center gap-1"><Activity className="h-4 w-4 text-blue-500" /> {bp}</p>
                            <p className="flex items-center gap-1"><Thermometer className="h-4 w-4 text-orange-500" /> {v?.temperature ?? "-"}°C</p>
                            <p className="flex items-center gap-1"><Activity className="h-4 w-4 text-green-500" /> {v?.oxygen_saturation ?? "-"}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={() => scheduleVisit(patient.full_name)}>
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
    </div>
  );
};

export default DoctorPatientList;