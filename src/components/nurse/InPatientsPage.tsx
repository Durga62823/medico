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
  Thermometer,
  BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type AlertType = "info" | "warning" | "critical";

interface Patient {
  _id: string;
  full_name: string;
  age: number;
  gender: string;
  condition: string;
  status: "Active" | "Discharged" | "Transferred";
  admission_date: string;
  room: string;
  department: string; // Added for nurse ward/department filtering
  avatar?: string;
}

interface Vitals {
  heart_rate: number;
  blood_pressure: number;
  temperature: number;
  oxygen_saturation: number;
  recorded_at: string;
}

type PatientAllocation = {
  id: string;
  name: string;
  room: string;
  admissionDay: number;
  condition: "stable" | "monitoring" | "improving" | "critical";
  department: string;
  diagnosis: string;
  vitals: Vitals;
  alerts: string[]; // string description for nurse summary
  lastUpdate: string;
};

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
  const [patients, setPatients] = useState<PatientAllocation[]>([]);
  const user = getStoredUser();
  const NurseId = user?.id || "";
  const [selectedDepartment, setSelectedDepartment] = useState(""); // For nurse ward filtering

  // Fetch patients on load and update on socket events
  useEffect(() => {
    allocationApi.get()
      .then((data: any[]) => {
        console.log(data);
        // Normalize backend to ensure expected fields for dashboard
        const detailed = data
          .filter(p => p.status !== "Discharged") // Only active for nurses
          .map((p) => ({
            id: p.id || p._id,
            name: p.name,
            room: p.room,
            admissionDay: p.day || p.admissionDay || 1,
            condition: p.status || p.condition || "monitoring",
            department: p.department,
            diagnosis: p.primaryDiagnosis || p.diagnosis,
            vitals: {
              bloodPressure: p.vitals?.bp || p.vitals?.bloodPressure || "",
              heartRate: p.vitals?.hr || p.vitals?.heartRate || 0,
              temperature: p.vitals?.temp || p.vitals?.temperature || "",
              respiratoryRate: p.vitals?.rr || p.vitals?.respiratoryRate || 0,
              oxygenSaturation: p.vitals?.spo2 || p.vitals?.oxygenSaturation || 0,
            },
            alerts: Array.isArray(p.alerts)
              ? typeof p.alerts[0] === "string"
                ? p.alerts
                : p.alerts.map((a: any) => a.message || a.type || "")
              : [],
            lastUpdate: p.lastUpdate ||
              p.updatedAt
                ? new Date(p.updatedAt || Date.now()).toLocaleString()
                : "now"
          })) as PatientAllocation[];
        setPatients(detailed);
      });
  }, []);

  // Socket real-time sync
  useEffect(() => {
    const socket = io("http://localhost:5000/");
    socket.on("connect", () => console.log("Socket connected"));
    socket.on("patientAllocationUpdated", (updated: any) => {
      setPatients((prev) => {
        const normalized = {
          id: updated.id || updated._id,
          name: updated.name,
          room: updated.room,
          admissionDay: updated.day || updated.admissionDay || 1,
          condition: updated.status || updated.condition || "monitoring",
          department: updated.department,
          diagnosis: updated.primaryDiagnosis || updated.diagnosis,
          vitals: {
            bloodPressure: updated.vitals?.bp || updated.vitals?.bloodPressure || "",
            heartRate: updated.vitals?.hr || updated.vitals?.heartRate || 0,
            temperature: updated.vitals?.temp || updated.vitals?.temperature || "",
            respiratoryRate: updated.vitals?.rr || updated.vitals?.respiratoryRate || 0,
            oxygenSaturation: updated.vitals?.spo2 || updated.vitals?.oxygenSaturation || 0,
          },
          alerts: Array.isArray(updated.alerts)
            ? typeof updated.alerts[0] === "string"
              ? updated.alerts
              : updated.alerts.map((a: any) => a.message || a.type || "")
            : [],
          lastUpdate: updated.lastUpdate ||
            updated.updatedAt
              ? new Date(updated.updatedAt || Date.now()).toLocaleString()
              : "now"
        };
        const exists = prev.findIndex((p) => p.id === normalized.id);
        if (exists !== -1) {
          const all = [...prev];
          all[exists] = normalized;
          return all;
        }
        return [...prev, normalized];
      });
    });
    socket.on("patientAllocationDeleted", (deletedId: string) => {
      setPatients((prev) => prev.filter((p) => p.id !== deletedId));
    });
    return () => socket.disconnect();
  }, []);

  const { data: nursePatients = [], isLoading: isLoadingNursePatients } = useQuery<Patient[]>({
    queryKey: ["assignedNursePatients", NurseId, selectedDepartment],
    queryFn: async () => {
      if (!NurseId) return [];
      const params = { assigned_nurse: NurseId };
      if (selectedDepartment) params.department = selectedDepartment;
      const res = await patientAPI.getAllPatients(params);
    //   console.log(res);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!NurseId,
  });

  const { data: vitalsMap = {} } = useQuery({
    queryKey: ["nursePatientsVitals", nursePatients.map((p) => p._id)],
    queryFn: async () => {
      const map: Record<string, Vitals | null> = {};
      await Promise.all(
        nursePatients.map(async (p) => {
          const res = await vitalAPI.getVitals(p._id);
          map[p._id] = Array.isArray(res.data) && res.data.length ? res.data[0] : null;
        })
      );
      return map;
    },
    enabled: nursePatients.length > 0,
  });

  // Filter patients by department if selected
  const filteredPatients = patients.filter(
    (p) => !selectedDepartment || p.department === selectedDepartment
  );

  // Stats based on filtered patients
  const totalPatients = filteredPatients.length;
  const criticalCount = filteredPatients.filter((p) => p.condition === "critical").length;
  const stableCount = filteredPatients.filter((p) => p.condition === "stable").length;
  const totalAlerts = filteredPatients.reduce((sum, p) => sum + p.alerts.length, 0);

  // Get unique departments for filtering
  const departments = [...new Set(nursePatients.map((p) => p.department).filter(Boolean))];

  if (isLoadingNursePatients) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-gray-500">Loading patients...</p>
        </div>
      </div>
    );
  }
console.log(vitalsMap)
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-3xl">In-Patient Monitoring</CardTitle>
                <CardDescription>
                  Track vitals, alerts, and care tasks for assigned patients and wards
                </CardDescription>
              </div>
              <div className="bg-primary rounded-full p-3">
                <Bed className="h-8 w-8 text-white" />
              </div>
            </CardHeader>
            {/* Department Filter for Nurses */}
            <CardContent className="pb-0">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="">All Wards/Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm">
                  Refresh Vitals
                </Button>
              </div>
            </CardContent>
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
        {/* Main Patient Cards */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {filteredPatients.length === 0 && (
            <div className="col-span-2 flex items-center justify-center text-muted-foreground text-xl h-32">
              No in-patients currently admitted in selected ward.
            </div>
          )}
          {filteredPatients.map((patient) => {
            const patientId = patient.id;
            const latestVitals = vitalsMap[patientId];
            console.log(latestVitals ,patientId,vitalsMap) // Type assertion for map key
            return (
              <motion.div
                key={patient.id}
                variants={patientCardVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-6">
                  {/* Header */}
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{patient.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Room {patient.room} • {patient.department}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={conditionColors[patient.condition]}>
                        {patient.condition.charAt(0).toUpperCase() + patient.condition.slice(1)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Day {patient.admissionDay}
                      </p>
                    </div>
                  </CardHeader>
                  {/* Diagnosis */}
                  <CardContent>
                    <p className="text-sm font-medium mb-1">Primary Diagnosis</p>
                    <p className="text-sm text-muted-foreground mb-4">{patient.diagnosis}</p>
                    {/* Vitals - Emphasize for nurses */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <Heart className="h-4 w-4 text-red-500 mx-auto mb-1" />
                        <div className="font-bold">
                          {latestVitals ? `${latestVitals.blood_pressure}` : "N/A"} {/* Assuming diastolic ~60 or fetch properly */}
                        </div>
                        <div className="text-xs text-muted-foreground">BP</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <Activity className="h-4 w-4 text-green-500 mx-auto mb-1" />
                        <div className="font-bold">{latestVitals?.heart_rate || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">HR bpm</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <Thermometer className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                        <div className="font-bold">{latestVitals?.temperature || "N/A"}°C</div>
                        <div className="text-xs text-muted-foreground">Temp</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <BarChart3 className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                        <div className="font-bold">{latestVitals ? 18 : "N/A"}</div> {/* Placeholder for RR, fetch if needed */}
                        <div className="text-xs text-muted-foreground">RR</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <span className="text-sm font-bold text-purple-600">O₂</span>
                        <div className="font-bold">{latestVitals?.oxygen_saturation || "N/A"}%</div>
                        <div className="text-xs text-muted-foreground">SpO₂</div>
                      </div>
                    </div>
                    {/* Alerts - Highlighted for nurse action */}
                    {patient.alerts.length > 0 && (
                      <motion.div
                        className="mb-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <p className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Active Alerts (Action Required)
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
                  {/* Footer - Nurse actions */}
                  <CardFooter className="flex justify-between text-xs text-muted-foreground border-t pt-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Updated {patient.lastUpdate}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Record Vitals
                      </Button>
                      <Button variant="secondary" size="sm">
                        Log Note
                      </Button>
                    </div>
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
