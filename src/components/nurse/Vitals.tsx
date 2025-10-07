import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Heart, Thermometer, Wind, Droplets } from "lucide-react";
import { VitalSignCard } from "./VitalSignCard";
import { vitalAPI ,patientAPI} from "@/services/api";
import { useQuery } from "@tanstack/react-query";


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
export function Vitals() {
  const user = getStoredUser();
  const NurseId = user?.id || "";
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["assignedPatients", NurseId],
    queryFn: async () => {
      if (!NurseId) return [];
      const res = await patientAPI.getAllPatients({ assigned_nurse: NurseId });
      console.log(res)
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!NurseId,
  });
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {patients.map((patient) => {
        const vital = vitalsMap[patient._id];

        return (
          <Card key={patient._id} className="p-4">
            <CardHeader>
              <CardTitle>
                {patient.full_name} ({patient.age}y, {patient.gender})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <VitalSignCard
                title="Heart Rate"
                value={vital ? vital.heart_rate ?? "--" : "--"}
                unit="BPM"
                range="60-100"
                status={vital && vital.heart_rate >= 60 && vital.heart_rate <= 100 ? "normal" : "abnormal"}
                icon={<Heart className="w-5 h-5 text-success" />}
              />
              <VitalSignCard
                title="Temperature"
                value={vital ? vital.temperature ?? "--" : "--"}
                unit="°F"
                range="97.0-99.0"
                status={vital && vital.temperature >= 97 && vital.temperature <= 99 ? "normal" : "abnormal"}
                icon={<Thermometer className="w-5 h-5 text-success" />}
              />
              <VitalSignCard
                title="Oxygen Saturation"
                value={vital ? vital.oxygen_saturation ?? "--" : "--"}
                unit="%"
                range="95-100"
                status={vital && vital.oxygen_saturation >= 95 ? "normal" : "abnormal"}
                icon={<Wind className="w-5 h-5 text-success" />}
              />
             <VitalSignCard
                title="Blood Pressure"
                value={vital?.blood_pressure ?? "--"}
                unit="mmHg"
                range="90-140"
                status={
                  vital?.blood_pressure !== undefined &&
                  vital.blood_pressure >= 90 &&
                  vital.blood_pressure <= 140
                    ? "normal"
                    : "abnormal"
                }
              icon={
                <Droplets
                  className={`w-5 h-5 ${
                    vital?.blood_pressure !== undefined &&
                    vital.blood_pressure >= 90 &&
                    vital.blood_pressure <= 140
                      ? "text-green-500"
                      : "text-red-500"
      }`}
    />
  }
/>

            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
