import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, AlertTriangle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { io } from "socket.io-client";
import { patientAPI } from "@/services/api"; 
import { CheckCircle, AlertCircle, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
type StatusKind = "stable" | "monitoring" | "critical";
type RiskKind = "low" | "medium" | "high";

interface Patient {
  id: string; // internal id
  patient_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_type?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string[];
  current_medications?: string[];
  assigned_doctor?: string;
  assigned_nurse?: string;
  admission_date?: string;
  status: string;
  avatar?: string;
}

interface AlertItem {
  id: string;
  type: "critical" | "warning" | "info";
  patientId?: string;
  acknowledged?: boolean;
}

export function PatientOverview() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load selected ID from localStorage initially
  useEffect(() => {
    const storedId = localStorage.getItem("selected_patient_id");
    setSelectedId(storedId);
  }, []);

  // Fetch selected patient from backend
  const { data: patient, isLoading: loadingPatient } = useQuery<Patient | null>({
    queryKey: ["selectedPatient", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const res = await patientAPI.getPatient(selectedId);
      return res.data;
    },
    enabled: !!selectedId,
  });

  // Fetch alerts for the selected patient from backend (assuming an alerts endpoint)
  const { data: alerts = [], isLoading: loadingAlerts } = useQuery<AlertItem[]>({
    queryKey: ["patientAlerts", selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      const res = await patientAPI.getPatient(selectedId); // Assume this API exists; adjust accordingly
      return res.data;
    },
    enabled: !!selectedId,
  });

  // Compute status and risk
  const [status, setStatus] = useState<StatusKind>("stable");
  const [risk, setRisk] = useState<RiskKind>("low");

  useEffect(() => {
    if (!patient || !alerts) return;

    const hasCritical = alerts.some((a) => a.type === "critical" && !a.acknowledged);
    const hasWarning = alerts.some((a) => a.type === "warning" && !a.acknowledged);
    setStatus(hasCritical ? "critical" : hasWarning ? "monitoring" : "stable");

    const medsCount = (patient.current_medications || []).length;
    const historyLen = (patient.medical_history || "").length;
    const computedRisk: RiskKind = hasCritical ? "high" : medsCount > 3 || historyLen > 80 ? "medium" : "low";
    setRisk(computedRisk);
  }, [patient, alerts]);

  // Real-time updates with Socket.IO
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: typeof window !== "undefined" ? localStorage.getItem("token") : null },
    });

    socket.on("connect", () => console.log("WebSocket connected ✅"));

    // Listen for patient updates
    socket.on("patient:updated", (updatedPatient: Patient) => {
      if (updatedPatient.id === selectedId) {
        queryClient.setQueryData(["selectedPatient", selectedId], updatedPatient);
      }
    });

    // Listen for new alerts
    socket.on("alert:updated", (updatedAlerts: AlertItem[]) => {
      queryClient.setQueryData(["patientAlerts", selectedId], updatedAlerts);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, selectedId]);

  const statusStyles: Record<StatusKind, { icon: any; classes: string }> = {
    stable: { icon: CheckCircle, classes: "text-green-600 border-green-600" },
    monitoring: { icon: Clock, classes: "text-yellow-600 border-yellow-600" },
    critical: { icon: AlertCircle, classes: "text-red-600 border-red-600" },
  };

  const riskBadgeVariant: Record<RiskKind, "secondary" | "outline" | "destructive"> = {
    low: "secondary",
    medium: "outline",
    high: "destructive",
  };

  const computeAge = (dob?: string): number | null => {
    if (!dob) return null;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    const diff = Date.now() - d.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  if (loadingPatient || loadingAlerts) {
    return <div>Loading patient data...</div>;
  }

  if (!patient) {
    return <div className="text-sm text-muted-foreground">No patient data available.</div>;
  }

  const { icon: StatusIcon, classes: statusClasses } = statusStyles[status];

  return (
    <Card className="h-[360px] overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5 text-primary" />
          <span>Patient Overview</span>
        </CardTitle>
        <CardDescription>Current patient information and status</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 h-full overflow-y-auto pr-2">
        {/* Patient Header */}
        <div className="flex items-start space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={patient.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {patient.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{patient.full_name}</h3>
              <Badge variant={riskBadgeVariant[risk]} className="capitalize">
                {risk} Risk
              </Badge>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>ID: {patient.patient_id}</span>
              <span>Age: {computeAge(patient.date_of_birth) ?? "-"}</span>
              <span>Gender: {patient.gender}</span>
            </div>

            <div className="flex items-center space-x-2">
              <StatusIcon className={`w-4 h-4 ${statusClasses.split(" ")[0]}`} />
              <Badge variant="outline" className={`capitalize ${statusClasses}`}>
                {status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Contact Information</h4>
          <div className="space-y-2 text-sm">
            {patient.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{patient.email}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{patient.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Emergency Contact</h4>
            <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm">
              {patient.emergency_contact_name && (
                <div className="font-medium">{patient.emergency_contact_name}</div>
              )}
              <div className="flex items-center space-x-2">
                <Phone className="w-3 h-3" />
                <span>{patient.emergency_contact_phone || "-"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Medical Information */}
        <div className="space-y-4">
          {patient.allergies && patient.allergies.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Allergies</h4>
              <div className="flex flex-wrap gap-1">
                {patient.allergies.map((allergy, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {patient.current_medications && patient.current_medications.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Current Medications</h4>
              <div className="space-y-1">
                {patient.current_medications.map((medication, index) => (
                  <div key={index} className="text-xs bg-muted/30 p-2 rounded">
                    {medication}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admission */}
        {patient.admission_date && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Admission Date:</span>
              <span className="font-medium">{new Date(patient.admission_date).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Calendar className="w-4 h-4 mr-1" />
            Schedule
          </Button>
          {patient.phone && (
            <Button variant="outline" size="sm" className="flex-1">
              <Phone className="w-4 h-4 mr-1" />
              Call
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
