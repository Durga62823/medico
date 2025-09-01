import { AlertTriangle, Heart, Thermometer, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
// import { Appointment } from "./AppointmentTimeline";

// interface PatientPreviewProps {
//   appointment: Appointment | null;
// }

// const mockPatientData = {
//   "1": {
//     age: 62,
//     allergies: ["Penicillin", "Sulfa drugs"],
//     lastVitals: {
//       bloodPressure: "138/85",
//       heartRate: 72,
//       temperature: "98.6°F",
//       date: "3 months ago"
//     }
//   },
//   "2": {
//     age: 28,
//     allergies: [],
//     lastVitals: {
//       bloodPressure: "115/72",
//       heartRate: 68,
//       temperature: "98.4°F",
//       date: "1 year ago"
//     }
//   },
//   "3": {
//     age: 45,
//     allergies: ["Latex"],
//     lastVitals: {
//       bloodPressure: "125/80",
//       heartRate: 75,
//       temperature: "98.7°F",
//       date: "6 months ago"
//     }
//   },
//   "4": {
//     age: 34,
//     allergies: [],
//     lastVitals: {
//       bloodPressure: "120/78",
//       heartRate: 70,
//       temperature: "98.5°F",
//       date: "8 months ago"
//     }
//   },
//   "5": {
//     age: 67,
//     allergies: ["Iodine", "Shellfish"],
//     lastVitals: {
//       bloodPressure: "145/90",
//       heartRate: 78,
//       temperature: "98.8°F",
//       date: "2 months ago"
//     }
//   }
// };

export const PatientPreview = ({ appointment }: PatientPreviewProps) => {
  if (!appointment) {
    return (
      <div className="glass rounded-xl p-6 fade-in-stagger">
        <h3 className="text-lg font-semibold text-primary-navy mb-4">Patient Preview</h3>
        <div className="text-center text-muted-foreground py-8">
          Select an appointment to view patient details
        </div>
      </div>
    );
  }

  const patientData = mockPatientData[appointment.id as keyof typeof mockPatientData];

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
          {patientData.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patientData.allergies.map((allergy) => (
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
          <p className="font-medium text-foreground mb-3">Last Vitals ({patientData.lastVitals.date})</p>
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
        </div>
      </div>
    </div>
  );
};