import { useEffect, useState } from "react";
import { AlertTriangle, Heart, Thermometer, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { io } from "socket.io-client";
import { patientAPI } from "@/services/api";

export const PatientPreview = ({ appointment }) => {
  const [patientData, setPatientData] = useState(null);

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

    socket.on("patient:updated", updatedPatient => {
      if (updatedPatient.id === appointment.id) setPatientData(updatedPatient);
    });
    socket.on("vitals:changed", changed => {
      if (changed.patientId === appointment.id) {
        setPatientData(prev => prev ? { ...prev, lastVitals: changed.lastVitals } : prev);
      }
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [appointment]);

  if (!appointment || !patientData) {
    return (
      <div className="glass rounded-xl p-6 fade-in-stagger">
        <h3 className="text-lg font-semibold text-primary-navy mb-4">Patient Preview</h3>
        <div className="text-center text-muted-foreground py-8">
          Select an appointment to view patient details
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 slide-in-right">
      <h3 className="text-lg font-semibold text-primary-navy mb-4">Patient Preview</h3>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-foreground text-lg">{appointment.patientName}</h4>
          <p className="text-muted-foreground">Age {patientData.age}</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Chief Complaint</p>
          <p className="text-muted-foreground">{appointment.reason}</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-critical" />
            <p className="font-medium text-foreground">Allergies</p>
          </div>
          {patientData.allergies && patientData.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patientData.allergies.map((allergy: string) => (
                <Badge key={allergy} variant="destructive" className="text-xs">
                  {allergy}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No known allergies</p>
          )}
        </div>
        <div>
          <p className="font-medium text-foreground mb-3">
            Last Vitals {patientData.lastVitals?.date ? `(${patientData.lastVitals.date})` : ""}
          </p>
          {patientData.lastVitals ? (
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Blood Pressure</p>
                  <p className="text-sm text-muted-foreground">{patientData.lastVitals.bloodPressure}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Heart Rate</p>
                  <p className="text-sm text-muted-foreground">{patientData.lastVitals.heartRate} bpm</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Temperature</p>
                  <p className="text-sm text-muted-foreground">{patientData.lastVitals.temperature}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No recent vitals data</p>
          )}
        </div>
      </div>
    </div>
  );
};