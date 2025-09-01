import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Calendar, Phone, Mail, MapPin, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useParams } from "react-router-dom";
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
  const [patient, setPatient] = useState<Patient | null>(null);
  const [status, setStatus] = useState<StatusKind>("stable");
  const [risk, setRisk] = useState<RiskKind>("low");

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

  const parseArray = (raw: string | null) => {
    if (!raw || raw === "undefined" || raw === "null") return [] as any[];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [] as any[];
    }
  };

  const computeAge = (dob?: string): number | null => {
    if (!dob) return null;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    const diff = Date.now() - d.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  useEffect(() => {
    const load = () => {
      const patients = parseArray(localStorage.getItem("patients")) as Patient[];
      const selectedId = localStorage.getItem("selected_patient_id");
      let current: Patient | null = null;
      if (selectedId) {
        current = patients.find((p) => p.id === selectedId || p.patient_id === selectedId) || null;
      }
      if (!current) {
        current = (patients.find((p) => p.status === "active") || patients[0]) ?? null;
      }
      setPatient(current ?? null);

      // Compute status/risk from alerts and patient data
      const alerts = parseArray(localStorage.getItem("alerts")) as AlertItem[];
      const forThis = current ? alerts.filter((a) => a.patientId === current!.patient_id) : [];
      const hasCritical = forThis.some((a) => a.type === "critical" && !a.acknowledged);
      const hasWarning = forThis.some((a) => a.type === "warning" && !a.acknowledged);
      setStatus(hasCritical ? "critical" : hasWarning ? "monitoring" : "stable");

      const medsCount = (current?.current_medications || []).length;
      const historyLen = (current?.medical_history || "").length;
      const computedRisk: RiskKind = hasCritical ? "high" : medsCount > 3 || historyLen > 80 ? "medium" : "low";
      setRisk(computedRisk);
    };

    load();
    const onStorage = (e: StorageEvent) => {
      if (["patients", "alerts", "selected_patient_id"].includes(e.key || "")) {
        load();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
        {!patient ? (
          <div className="text-sm text-muted-foreground">No patient data available.</div>
        ) : (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
