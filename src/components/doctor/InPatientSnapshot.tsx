import { Bed, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { allocationApi, vitalAPI, patientAPI } from "../../services/api";
import { useQuery } from "@tanstack/react-query";

// Animation variants
const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const patientItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Type definitions
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
  alerts: string[];
  lastUpdate: string;
};

// Style mappings
const conditionStyles = {
  stable: "bg-green-100 text-green-700",
  monitoring: "bg-yellow-100 text-yellow-700",
  improving: "bg-blue-100 text-blue-700",
  critical: "bg-red-100 text-red-700",
};

// JWT helpers
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

export const InPatientSnapshot = () => {
  const [patients, setPatients] = useState<PatientAllocation[]>([]);
  const user = getStoredUser();
  const DoctorId = user?.id || "";

  // 🔹 Fetch patients on mount
  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const data = await allocationApi.get();
        const normalized = data.map((p: any) => ({
          id: p.id || p._id,
          name: p.name,
          room: p.room,
          admissionDay: p.day || p.admissionDay || 1,
          condition: (p.status || p.condition || "monitoring").toLowerCase(),
          department: p.department,
          diagnosis: p.primaryDiagnosis || p.diagnosis || "N/A",
          vitals: {
            blood_pressure: p.vitals?.bp || p.vitals?.bloodPressure || 0,
            heart_rate: p.vitals?.hr || p.vitals?.heartRate || 0,
            temperature: p.vitals?.temp || p.vitals?.temperature || 0,
            oxygen_saturation: p.vitals?.spo2 || p.vitals?.oxygenSaturation || 0,
            recorded_at: p.vitals?.recorded_at || "",
          },
          alerts: Array.isArray(p.alerts)
            ? typeof p.alerts[0] === "string"
              ? p.alerts
              : p.alerts.map((a) => a.message || a.type || "")
            : [],
          lastUpdate: p.updatedAt
            ? new Date(p.updatedAt).toLocaleString()
            : "N/A",
        }));
        setPatients(normalized);
      } catch (error) {
        console.error("Error fetching allocations:", error);
      }
    };

    fetchAllocations();
  }, []);

  // 🔹 Fetch assigned patients for doctor
  const { data: assignedPatients = [], isLoading: isLoadingPatients } =
    useQuery<Patient[]>({
      queryKey: ["assignedPatients", DoctorId],
      queryFn: async () => {
        if (!DoctorId) return [];
        const res = await patientAPI.getAllPatients({
          assigned_doctor: DoctorId,
        });
        return Array.isArray(res.data) ? res.data : [];
      },
      enabled: !!DoctorId,
    });

  // 🔹 Loading state
  if (isLoadingPatients) {
    return (
      <div className="text-center text-muted-foreground py-6">
        Loading admitted patients...
      </div>
    );
  }

  return (
    <motion.div
      className="glass rounded-xl p-6"
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <h3 className="text-lg font-semibold text-primary-navy mb-4 flex items-center gap-2">
        <Bed className="h-5 w-5" />
        My Admitted Patients
      </h3>

      {assignedPatients.length === 0 ? (
        <motion.div
          className="text-center text-muted-foreground py-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          No admitted patients found
        </motion.div>
      ) : 
      
      (
        
        <div className="space-y-3">
          {assignedPatients.map((patient) => (
            
            <motion.div
              key={patient.id}
              variants={patientItemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="p-3 rounded-lg border border-border hover:border-secondary/50 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{patient.full_name}</span>
                <Badge
                  variant="outline"
                  className={
                    conditionStyles[
                      patient.condition as keyof typeof conditionStyles
                    ] || "bg-gray-100 text-gray-600"
                  }
                >
                  {patient.condition}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  Room {patient.room}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Day {patient.admissionDay}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
