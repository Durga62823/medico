import { useEffect, useState } from "react";
import { AlertTriangle, Heart, Thermometer, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { io } from "socket.io-client";
import { patientAPI } from "@/services/api";

interface Appointment {
  id: string;
  patientName: string;
  reason: string;
}

interface PatientData {
  age: number;
  gender?: string;
  allergies?: string[];
  lastVitals?: {
    date?: string;
    bloodPressure: string;
    heartRate: number;
    temperature: number;
  };
}

interface PatientPreviewProps {
  appointment: Appointment | null;
}

export const PatientPreview = ({ appointment }: PatientPreviewProps) => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);

  useEffect(() => {
    if (!appointment) return;

    let mounted = true;
    const loadPatient = async () => {
      try {
        const res = await patientAPI.getPatient(appointment.id);
        if (mounted) setPatientData(res.data);
      } catch {
        if (mounted) setPatientData(null);
      }
    };
    loadPatient();

    // Subscribe to real-time updates for this patient
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("token") }
    });

    socket.on("patient:updated", (updatedPatient: PatientData & { id?: string }) => {
      if (updatedPatient.id === appointment.id) setPatientData(updatedPatient);
    });
    socket.on("vitals:changed", (changed: { patientId: string; lastVitals: PatientData['lastVitals'] }) => {
      if (changed.patientId === appointment.id) {
        setPatientData((prev) => (prev ? { ...prev, lastVitals: changed.lastVitals } : prev));
      }
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [appointment]);

  if (!appointment || !patientData) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-6 fade-in-stagger">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Patient Preview
        </h3>
        <div className="text-center text-muted-foreground py-8">
          Select an appointment to view patient details
        </div>
      </div>
    );
  }

return (
  <div className="rounded-xl border bg-card shadow-md p-6 slide-in-right space-y-8">
    <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
      <Activity className="h-6 w-6 dark:text-foreground" />
      Patient Preview
    </h3>

    {/* Patient Info */}
    <div className="space-y-4">
      <div>
        <h4 className="font-bold text-2xl text-foreground mb-1">{appointment.patientName}</h4>
        <p className="flex items-center gap-4 text-muted-foreground text-base">
          <span>🧑‍🎓 Age: <span className="font-medium text-foreground">{patientData.age}</span></span>
          <span>⚥ Gender: <span className="font-medium text-foreground">{patientData.gender || 'N/A'}</span></span>
        </p>
      </div>

      {/* Chief Complaint */}
      <section className="p-5 rounded-lg bg-muted/40 border border-border shadow-inner">
        <h5 className="font-semibold text-lg text-foreground mb-1">Chief Complaint</h5>
        <p className="text-foreground text-base">{appointment.reason}</p>
      </section>
    </div>

    {/* Allergies Section */}
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-5 w-5" />
        <h5 className="font-semibold text-lg">Allergies</h5>
      </div>
      {patientData.allergies && patientData.allergies.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {patientData.allergies.map((allergy) => (
            <Badge key={allergy} variant="destructive" className="text-sm px-3 py-1">
              {allergy}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-base">No known allergies</p>
      )}
    </section>

    {/* Vitals Section */}
    <section className="space-y-4">
      <p className="font-semibold text-lg flex items-center gap-3 text-foreground">
        <Heart className="h-5 w-5 text-red-500" />
        Last Vitals {patientData.lastVitals?.date ? `(${patientData.lastVitals.date})` : ""}
      </p>
      {patientData.lastVitals ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Blood Pressure */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-300 shadow-sm">
            <Activity className="h-6 w-6 text-purple-600" />
            <div>
              <p className="text-sm font-semibold text-foreground">Blood Pressure</p>
              <p className="text-sm text-muted-foreground">{patientData.lastVitals.bloodPressure}</p>
            </div>
          </div>

          {/* Heart Rate */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-lg border border-red-300 shadow-sm">
            <Heart className="h-6 w-6 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-foreground">Heart Rate</p>
              <p className="text-sm text-muted-foreground">{patientData.lastVitals.heartRate} bpm</p>
            </div>
          </div>

          {/* Temperature */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-orange-300 shadow-sm">
            <Thermometer className="h-6 w-6 text-orange-600" />
            <div>
              <p className="text-sm font-semibold text-foreground">Temperature</p>
              <p className="text-sm text-muted-foreground">{patientData.lastVitals.temperature}°F</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-base">No recent vitals data</p>
      )}
    </section>
  </div>
);

};