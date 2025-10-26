import { useState, useEffect } from "react";
import { VitalSignCard } from "@/components/nurse/VitalSignCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, CheckCircle, Heart, Thermometer, Wind, Droplets } from "lucide-react";
import { patientAPI, vitalAPI } from "@/services/api";
import { io } from "socket.io-client";
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
  const [alerts, setAlerts] = useState<{ message?: string; type?: string }[]>([]);
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
      console.log(data);
      if (Array.isArray(data.alerts)) setAlerts(data.alerts);
      if (typeof data.aiPredictions === "number") setAiPredictions(data.aiPredictions);
      if (data.systemStatus) setSystemStatus(data.systemStatus);
    });
    return () => { socket.disconnect(); };
  }, []);

  if (isLoadingPatients) {
    return (
      <div className="flex min-h-screen bg-background">
        <main className="flex-1 p-8 overflow-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>

          {/* Vitals Section Skeleton */}
          <div className="flex w-full gap-4 mb-6">
            {/* Left Side - Patient Info */}
            <div className="w-[50%]">
              <Card className="border-border bg-card">
                <CardHeader>
                  <Skeleton className="h-7 w-48" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 border border-border rounded-lg bg-muted/30">
                      <div className="flex items-start justify-between mb-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-5 rounded-full" />
                      </div>
                      <Skeleton className="h-8 w-20 mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Side */}
            <div className="w-[50%]">
              <Skeleton className="h-[300px] rounded-lg" />
            </div>
          </div>

          {/* Bottom Section Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <Skeleton className="h-12 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-40 mt-2" />
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen bg-background">
        <main className="flex-1 p-8">
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-lg">No assigned patients yet.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-8 overflow-auto">
        {/* Nurse Header */}
        <div className="mb-6 animate-fade-in">
          <h2 className="text-3xl font-bold text-foreground mb-2">Nurse Dashboard</h2>
          <p className="text-muted-foreground">Active Patients: {patients.length}</p>
        </div>

        {/* Patient Vitals */}
        <div className="flex w-full gap-4 mb-6">
          {/* Left Side - 50% */}
          <div className="w-[100%]">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">
                  {patient.full_name} ({patient.age}y, {patient.gender})
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <VitalSignCard
                  title="Heart Rate"
                  value={String(vital?.heart_rate ?? "--")}
                  unit="BPM"
                  range="60-100"
                  status={
                    vital && vital.heart_rate >= 60 && vital.heart_rate <= 100
                      ? "normal"
                      : "critical"
                  }
                  icon={<Heart className="w-5 h-5 text-success" />}
                />
                <VitalSignCard
                  title="Temperature"
                  value={String(vital?.temperature ?? "--")}
                  unit="°F"
                  range="97.0-99.0"
                  status={
                    vital && vital.temperature >= 97 && vital.temperature <= 99
                      ? "normal"
                      : "critical"
                  }
                  icon={<Thermometer className="w-5 h-5 text-success" />}
                />
                <VitalSignCard
                  title="Oxygen Saturation"
                  value={String(vital?.oxygen_saturation ?? "--")}
                  unit="%"
                  range="95-100"
                  status={
                    vital && vital.oxygen_saturation >= 95 ? "normal" : "critical"
                  }
                  icon={<Wind className="w-5 h-5 text-success" />}
                />
                <VitalSignCard
                  title="Blood Pressure"
                  value={String(vital?.blood_pressure ?? "--")}
                  unit="mmHg"
                  range="90-140"
                  status={
                    vital?.blood_pressure !== undefined &&
                    vital.blood_pressure >= 90 &&
                    vital.blood_pressure <= 140
                      ? "normal"
                      : "critical"
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



        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert: any, idx: number) => (
                    <div key={idx} className="p-3 border border-border rounded-lg bg-muted/30">
                      <p className="text-sm text-foreground font-medium">{alert.message || "Alert"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.type || "Info"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No recent alerts</p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* AI Predictions */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Brain className="w-5 h-5" />
                  AI Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-foreground">{aiPredictions}</p>
                  <p className="text-sm text-muted-foreground mt-2">Generated</p>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
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
                  <span className="font-medium text-foreground">{systemStatus}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">All systems operational</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Timeline chart placeholder</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;