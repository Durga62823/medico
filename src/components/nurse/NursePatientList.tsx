import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { patientAPI, vitalAPI } from "@/services/api";
import { io } from "socket.io-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Activity,
  UserCheck,
  AlertTriangle,
  Heart,
  Thermometer,
} from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

// --- Helpers for auth and user context
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

// --- Types
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
  blood_pressure: number;
  temperature: number;
  oxygen_saturation: number;
  recorded_at: string;
}

const NursePatientList = () => {
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const nurseId = user?.id || "";

  // Fetch patients assigned to the nurse
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["assignedPatientsNurse", nurseId],
    queryFn: async () => {
      if (!nurseId) return [];
      const res = await patientAPI.getAllPatients({ assigned_nurse: nurseId });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!nurseId,
  });

  // Fetch latest vitals for patients
  const { data: vitalsMap = {} } = useQuery({
    queryKey: ["patientsVitalsNurse", patients.map((p) => p._id)],
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

  // Real-time assignment updates
  useEffect(() => {
    if (!nurseId) return;
    const socket = io("http://localhost:5000", {
      auth: { token: localStorage.getItem("token") },
    });
    socket.on("patient:assigned", () =>
      queryClient.invalidateQueries({ queryKey: ["assignedPatientsNurse", nurseId] })
    );
    return () => socket.disconnect();
  }, [nurseId, queryClient]);

  // UI Helpers
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
            <p className="text-gray-500">You currently have no active patients to manage.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {patients.map((patient, index) => {
            const v = vitalsMap[patient._id];
            const bp = v ? `${v.blood_pressure}` : "-";
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
                        <AvatarFallback>
                          {patient.full_name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{patient.full_name}</h4>
                          {getStatusBadge(patient.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><span className="font-medium">Age:</span> {calculateAge(patient.date_of_birth)}</p>
                            <p><span className="font-medium">Gender:</span> {patient.gender}</p>
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
                      {/* You can add an action here, e.g. Record Vitals, etc. */}
                      {/* <Button variant="outline" size="sm">
                        Record Vitals
                      </Button> */}
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

export default NursePatientList;
