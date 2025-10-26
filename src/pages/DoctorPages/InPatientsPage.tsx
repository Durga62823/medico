import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { vitalAPI, allocationApi } from "../../services/api";
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
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface Vitals {
  heart_rate: number;
  blood_pressure: number;
  temperature: number;
  oxygen_saturation: number;
  respiratory_rate?: number;
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
  const DoctorId = user?.id || "";
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Fetch allocations on load - only admitted patients
  useEffect(() => {
    allocationApi.get()
      .then((data: any[]) => {
        console.log("Allocations fetched:", data);
        // Filter for doctor's patients and normalize backend data
        const detailed = data
          .filter((p) => p.status !== "Discharged") // Only active admissions
          .map((p) => ({
            id: p.id || p._id,
            name: p.name,
            room: p.room,
            admissionDay: p.day || p.admissionDay || 1,
            condition: p.status || p.condition || "monitoring",
            department: p.department,
            diagnosis: p.primaryDiagnosis || p.diagnosis,
            vitals: {
              blood_pressure: p.vitals?.bp || p.vitals?.bloodPressure || "",
              heart_rate: p.vitals?.hr || p.vitals?.heartRate || 0,
              temperature: p.vitals?.temp || p.vitals?.temperature || "",
              respiratory_rate: p.vitals?.rr || p.vitals?.respiratoryRate || 0,
              oxygen_saturation: p.vitals?.spo2 || p.vitals?.oxygenSaturation || 0,
            },
            alerts: Array.isArray(p.alerts)
              ? typeof p.alerts[0] === "string"
                ? p.alerts
                : p.alerts.map((a: any) => a.message || a.type || "")
              : [],
            lastUpdate: p.lastUpdate || p.updatedAt
              ? new Date(p.updatedAt || Date.now()).toLocaleString()
              : "now"
          })) as PatientAllocation[];
        setPatients(detailed);
      });
  }, []);

  // Socket real-time updates for allocations
  useEffect(() => {
    const socket = io("http://localhost:5000/");
    socket.on("connect", () => console.log("✅ Socket connected for doctor in-patients"));

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
            blood_pressure: updated.vitals?.bp || updated.vitals?.bloodPressure || "",
            heart_rate: updated.vitals?.hr || updated.vitals?.heartRate || 0,
            temperature: updated.vitals?.temp || updated.vitals?.temperature || "",
            respiratory_rate: updated.vitals?.rr || updated.vitals?.respiratoryRate || 0,
            oxygen_saturation: updated.vitals?.spo2 || updated.vitals?.oxygenSaturation || 0,
          },
          alerts: Array.isArray(updated.alerts)
            ? typeof updated.alerts[0] === "string"
              ? updated.alerts
              : updated.alerts.map((a: any) => a.message || a.type || "")
            : [],
          lastUpdate: updated.lastUpdate || updated.updatedAt
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

  // Fetch latest vitals for all admitted patients
  const { data: vitalsMap = {} } = useQuery({
    queryKey: ["doctorPatientsVitals", patients.map((p) => p.id)],
    queryFn: async () => {
      const map: Record<string, Vitals | null> = {};
      await Promise.all(
        patients.map(async (p) => {
          const res = await vitalAPI.getVitals(p.id);
          map[p.id] = Array.isArray(res.data) && res.data.length ? res.data[0] : null;
        })
      );
      return map;
    },
    enabled: patients.length > 0,
  });

  // Filter patients by department if selected
  const filteredPatients = patients.filter(
    (p) => !selectedDepartment || p.department === selectedDepartment
  );

  // Get unique departments for filtering
  const departments = [...new Set(patients.map((p) => p.department).filter(Boolean))];

  // Stats based on filtered patients
  const totalPatients = filteredPatients.length;
  const criticalCount = filteredPatients.filter((p) => p.condition === "critical").length;
  const stableCount = filteredPatients.filter((p) => p.condition === "stable").length;
  const totalAlerts = filteredPatients.reduce((sum, p) => sum + (p.alerts?.length || 0), 0);

  const isLoading = patients.length === 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-full mx-auto space-y-6">
          {/* Header Skeleton */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-14 w-14 rounded-full" />
            </CardHeader>
            <CardContent className="pb-0">
              <div className="flex gap-4 mb-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                      <Skeleton className="h-6 w-6 rounded" />
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Patient Cards Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <CardHeader className="flex flex-row justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="bg-muted rounded-lg p-3 text-center space-y-2">
                        <Skeleton className="h-4 w-4 mx-auto" />
                        <Skeleton className="h-5 w-12 mx-auto" />
                        <Skeleton className="h-3 w-8 mx-auto" />
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
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
            {/* Department Filter */}
            <CardContent className="pb-0">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm">
                  Refresh Data
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

        {/* Patient Cards */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {filteredPatients.length === 0 && (
            <div className="col-span-2 flex items-center justify-center text-muted-foreground text-xl h-32">
              No in-patients currently admitted in selected department.
            </div>
          )}
          {filteredPatients.map((patient) => {
            const latestVitals = vitalsMap[patient.id];
            const condition = patient.condition as "stable" | "monitoring" | "improving" | "critical";
            return (
              <motion.div key={patient.id} variants={patientCardVariants} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="p-6">
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{patient.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Room {patient.room || "N/A"} • {patient.department || "General"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={conditionColors[condition]}>
                        {patient.condition.charAt(0).toUpperCase() + patient.condition.slice(1)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Day {patient.admissionDay}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium mb-1 text-foreground">Primary Diagnosis</p>
                    <p className="text-sm text-muted-foreground mb-4">{patient.diagnosis || "Pending evaluation"}</p>

                    {/* Vitals */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <Heart className="h-4 w-4 text-red-500 mx-auto mb-1" />
                        <div className="font-bold text-foreground">{latestVitals?.blood_pressure || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">BP</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <Activity className="h-4 w-4 text-green-500 mx-auto mb-1" />
                        <div className="font-bold text-foreground">{latestVitals?.heart_rate || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">HR bpm</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <Thermometer className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                        <div className="font-bold text-foreground">{latestVitals?.temperature || "N/A"}°C</div>
                        <div className="text-xs text-muted-foreground">Temp</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <BarChart3 className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                        <div className="font-bold text-foreground">{latestVitals?.respiratory_rate || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">RR</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <span className="text-sm font-bold text-purple-600">O₂</span>
                        <div className="font-bold text-foreground">{latestVitals?.oxygen_saturation || "N/A"}%</div>
                        <div className="text-xs text-muted-foreground">SpO₂</div>
                      </div>
                    </div>

                    {/* Alerts */}
                    {patient.alerts && patient.alerts.length > 0 && (
                      <motion.div className="mb-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
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
                      Updated {patient.lastUpdate || new Date().toLocaleString()}
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
