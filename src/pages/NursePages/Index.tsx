import { useState, useEffect } from "react";
import { VitalSignCard } from "@/components/nurse/VitalSignCard";
import { TimelineChart } from "@/components/nurse/TimelineChart";
import { AlertsCard } from "@/components/nurse/AlertsCard";
import { AIAssistant } from "@/components/AIAssistant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, CheckCircle, Heart, Thermometer, Wind, Droplets } from "lucide-react";
import { patientAPI, vitalAPI } from "@/services/api";
import { io } from "socket.io-client";
import { NurseHeader } from "@/components/nurse/NurseHeader";
import { useQuery } from "@tanstack/react-query";

/* ----------------- Helpers ----------------- */
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

/* ----------------- Types ----------------- */
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

/* ----------------- Component ----------------- */
const Index = () => {
  const [bpData, setBpData] = useState<any[]>([]);
  const [o2Data, setO2Data] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [aiPredictions, setAiPredictions] = useState(0);
  const [systemStatus, setSystemStatus] = useState("Online");

  const user = getStoredUser();
  const NurseId = user?.id || "";

  /* Fetch assigned patients */
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["assignedPatients", NurseId],
    queryFn: async () => {
      if (!NurseId) return [];
      const res = await patientAPI.getAllPatients({ assigned_nurse: NurseId });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!NurseId,
  });

  // Only first patient
  const patient = patients.length > 0 ? patients[0] : null;

  /* Fetch vitals for first patient */
  const { data: vital } = useQuery<Vital | null>({
    queryKey: ["patientsVitals", patient?._id],
    queryFn: async () => {
      if (!patient) return null;
      const res = await vitalAPI.getVitals(patient._id);
      return Array.isArray(res.data) && res.data.length ? res.data[0] : null;
    },
    enabled: !!patient,
  });

  /* Real-time updates */
  useEffect(() => {
    const socket = io("http://localhost:5000");
    socket.on("dashboardUpdate", (data) => {
      console.log(data)
      if (data.bpData) setBpData(data.bpData);
      if (data.o2Data) setO2Data(data.o2Data);
      if (Array.isArray(data.alerts)) setAlerts(data.alerts);
      if (typeof data.aiPredictions === "number") setAiPredictions(data.aiPredictions);
      if (data.systemStatus) setSystemStatus(data.systemStatus);
    });
    return () => socket.disconnect();
  }, []);

  if (isLoadingPatients) {
    return <div className="p-8 text-muted-foreground bg-amber-400 flex justify-center items-center">Loading Your Dashboard.....</div>;
  }

  if (!patient) {
    return <div className="p-8 text-muted-foreground">No assigned patients yet.</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-8 overflow-auto">
        {/* Nurse Header */}
        <div className="mb-6 animate-fade-in">
          <NurseHeader activeCount={patients.length} />
        </div>

        {/* Patient Vitals */}

<div className="flex w-full">
  {/* Left Side - 40% */}
  <div className="p-4  w-[50%]">
    <Card className="p-4 w-full size-full">
      <CardHeader>
        <CardTitle>
          {patient.full_name} ({patient.age}y, {patient.gender})
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <VitalSignCard
          title="Heart Rate"
          value={vital?.heart_rate ?? "--"}
          unit="BPM"
          range="60-100"
          status={
            vital && vital.heart_rate >= 60 && vital.heart_rate <= 100
              ? "normal"
              : "abnormal"
          }
          icon={<Heart className="w-5 h-5 text-success" />}
        />
        <VitalSignCard
          title="Temperature"
          value={vital?.temperature ?? "--"}
          unit="°F"
          range="97.0-99.0"
          status={
            vital && vital.temperature >= 97 && vital.temperature <= 99
              ? "normal"
              : "abnormal"
          }
          icon={<Thermometer className="w-5 h-5 text-success" />}
        />
        <VitalSignCard
          title="Oxygen Saturation"
          value={vital?.oxygen_saturation ?? "--"}
          unit="%"
          range="95-100"
          status={
            vital && vital.oxygen_saturation >= 95 ? "normal" : "abnormal"
          }
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
  </div>

  {/* Right Side - 60% */}
  <div className="w-[50%] h-[calc(100vh-4rem)]  p-4">
   <AIAssistant/>
  </div>
</div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AlertsCard alerts={alerts} />

          <div className="space-y-6">
            {/* AI Predictions */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-muted-foreground">{aiPredictions}</p>
                  <p className="text-sm text-muted-foreground mt-2">Generated</p>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      systemStatus === "Online" ? "bg-green-500" : "bg-red-500"
                    } animate-pulse`}
                  />
                  <span className="font-medium">{systemStatus}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">All systems operational</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;