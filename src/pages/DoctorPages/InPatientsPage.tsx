import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { allocationApi, vitalAPI, patientAPI } from "../../services/api";
import {
  Bed,
  Activity,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Heart,
  Thermometer
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface Vitals {
  heart_rate: number;
  blood_pressure: number;
  temperature: number;
  oxygen_saturation: number;
  respiratoryRate?: number;
  recorded_at: string;
}

interface Patient {
  _id: string;
  full_name: string;
  room?: string;
  department?: string;
  admissionDay?: number;
  condition?: "stable" | "monitoring" | "improving" | "critical";
  diagnosis?: string;
  alerts?: string[];
  lastUpdate?: string;
}

const conditionColors = {
  stable: "bg-green-100 text-green-700",
  monitoring: "bg-yellow-100 text-yellow-700",
  improving: "bg-blue-100 text-blue-700",
  critical: "bg-red-100 text-red-700"
};

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};
const statItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
type PatientAllocation = {
   id: string;
name: string;
  room: string;
  admissionDay: number;
  condition: "stable" | "monitoring" | "improving" | "critical"; 
  department: string;
  diagnosis: string;
  vitals: Vitals;
  alerts: string[]; 
  lastUpdate: string; };
const patientCardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

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

export default function InPatientsPage() {
const [patients, setPatients] = useState<PatientAllocation[]>([])
  const user = getStoredUser();
  const DoctorId = user?.id || "";

  // Fetch patients
const { data: patientData  = [], isLoading: isLoadingPatients } = useQuery<Patient[]>(
  {
  queryKey: ["assignedPatients", DoctorId],
  queryFn: async () => { if (!DoctorId) return [];
  const res = await patientAPI.getAllPatients({ assigned_doctor:DoctorId });
   // console.log(res) 
  return Array.isArray(res.data) ? res.data : []; }, enabled: !!DoctorId, });

  useEffect(() => {
    if (patientData.length > 0) setPatients(patientData);
  }, [patientData]);

  // Fetch vitals for all patients
  const { data: vitalsMap = {} } = useQuery({
    queryKey: ["patientsVitals", patients.map((p) => p._id)],
    queryFn: async () => {
      const map: Record<string, Vitals | null> = {};
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

  // Socket real-time updates
  useEffect(() => {
    const socket = io("http://localhost:5000/");
    socket.on("connect", () => console.log("Socket connected"));

    socket.on("patientAllocationUpdated", (updated: any) => {
      setPatients(prev => {
        const exists = prev.findIndex(p => p._id === updated._id);
        const normalized: Patient = {
          ...updated,
          alerts: Array.isArray(updated.alerts)
            ? updated.alerts.map((a: any) => (typeof a === "string" ? a : a.message || a.type || ""))
            : []
        };
        if (exists !== -1) {
          const all = [...prev];
          all[exists] = normalized;
          return all;
        }
        return [...prev, normalized];
      });
    });

    socket.on("patientAllocationDeleted", (deletedId: string) => {
      setPatients(prev => prev.filter(p => p._id !== deletedId));
    });

    return () => socket.disconnect();
  }, []);

  // Stats
  const totalPatients = patients.length;
  const criticalCount = patients.filter(p => p.condition === 'critical').length;
  const stableCount = patients.filter(p => p.condition === 'stable').length;
  const totalAlerts = patients.reduce((sum, p) => sum + (p.alerts?.length || 0), 0);

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header Stats */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-3xl">In-Patient Management</CardTitle>
                <CardDescription>
                  Monitor and manage admitted patients across all departments
                </CardDescription>
              </div>
              <div className="bg-primary rounded-full p-3">
                <Bed className="h-8 w-8 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={statItemVariants}>
                  <Card className="p-4 flex flex-row justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Patients</p>
                      <p className="text-2xl font-bold">{totalPatients}</p>
                    </div>
                    <Users className="h-6 w-6 text-primary" />
                  </Card>
                </motion.div>
                <motion.div variants={statItemVariants}>
                  <Card className="p-4 flex flex-row justify-between items-center border-l-4 border-red-500">
                    <div>
                      <p className="text-sm text-muted-foreground">Critical</p>
                      <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </Card>
                </motion.div>
                <motion.div variants={statItemVariants}>
                  <Card className="p-4 flex flex-row justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Stable</p>
                      <p className="text-2xl font-bold text-green-600">{stableCount}</p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </Card>
                </motion.div>
                <motion.div variants={statItemVariants}>
                  <Card className="p-4 flex flex-row justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Alerts</p>
                      <p className="text-2xl font-bold text-yellow-600">{totalAlerts}</p>
                    </div>
                    <Activity className="h-6 w-6 text-yellow-500" />
                  </Card>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Patient Cards */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {patients.length === 0 && (
            <div className="col-span-2 flex items-center justify-center text-muted-foreground text-xl h-32">
              No in-patients currently admitted.
            </div>
          )}
          {patients.map((patient) => {
            const latestVitals = vitalsMap[patient._id]; // always from correct API
            return (
              <motion.div key={patient._id} variants={patientCardVariants} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="p-6">
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{patient.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Room {patient.room} • {patient.department}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={conditionColors[patient.condition || "monitoring"]}>
                        {patient.condition?.charAt(0).toUpperCase() + patient.condition?.slice(1)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Day {patient.admissionDay || "-"}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium mb-1">Primary Diagnosis</p>
                    <p className="text-sm text-muted-foreground mb-4">{patient.diagnosis || "-"}</p>

                    {/* Vitals */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <Heart className="h-4 w-4 text-red-500 mx-auto mb-1" />
                        <div className="font-bold">{latestVitals?.blood_pressure || "-"}</div>
                        <div className="text-xs text-muted-foreground">BP</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <Activity className="h-4 w-4 text-green-500 mx-auto mb-1" />
                        <div className="font-bold">{latestVitals?.heart_rate || "-"}</div>
                        <div className="text-xs text-muted-foreground">HR</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <Thermometer className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                        <div className="font-bold">{latestVitals?.temperature || "-"}°C</div>
                        <div className="text-xs text-muted-foreground">Temp</div>
                      </div>

                      <div className="bg-muted rounded-lg p-3 text-center">
                        <span className="text-sm font-bold text-purple-600">O₂</span>
                        <div className="font-bold">{latestVitals?.oxygen_saturation || "-"}%</div>
                        <div className="text-xs text-muted-foreground">SpO₂</div>
                      </div>
                    </div>

                    {/* Alerts */}
                    {patient.alerts?.length > 0 && (
                      <motion.div className="mb-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <p className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Active Alerts
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {patient.alerts.map((alert, idx) => (
                            <Badge key={idx} variant="destructive" className="text-xs">
                              {alert}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between text-xs text-muted-foreground border-t pt-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Updated {patient.lastUpdate || "-"}
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
