import { useQuery } from "@tanstack/react-query";
import { patientAPI, vitalAPI } from "@/services/api"; // Assume getPatient(id), getVitals(id), getTrends(id)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PatientDetailsDialogProps {
  patientId: string;
  onClose: () => void;
}

export default function PatientDetailsDialog({ patientId, onClose }: PatientDetailsDialogProps) {
  // Fetch patient details
  const { data: patient } = useQuery({
    queryKey: ["patientDetails", patientId],
    queryFn: async () => {
      const res = await patientAPI.getPatient(patientId);
      return res.data;
    },
  });

  // Fetch vitals history
  const { data: vitals } = useQuery({
    queryKey: ["patientVitals", patientId],
    queryFn: async () => {
      const res = await vitalAPI.getVitals(patientId);
      return res.data;
    },
  });

  // Fetch vitals trends for charts
  const { data: trends } = useQuery({
    queryKey: ["patientTrends", patientId],
    queryFn: async () => {
      const res = await vitalAPI.getTrends(patientId);
      return res.data;
    },
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Patient Details: {patient?.full_name}</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <div className="space-y-6">
          {/* Patient Info */}
          <section>
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <p>Age: {patient?.age}</p> {/* Assume age is calculated or in data */}
            <p>Gender: {patient?.gender}</p>
            <p>Blood Type: {patient?.blood_type}</p>
            <p>Allergies: {patient?.allergies?.join(", ") || "None"}</p>
            <p>Medical History: {patient?.medical_history}</p>
            <p>Admission Date: {patient?.admission_date}</p>
            <p>Status: {patient?.status}</p>
          </section>

          {/* Vitals History */}
          <section>
            <h3 className="text-lg font-semibold">Vitals History</h3>
            {vitals?.map((vital: any) => (
              <div key={vital._id} className="border-b py-2">
                <p>Recorded At: {new Date(vital.recorded_at).toLocaleString()}</p>
                <p>Heart Rate: {vital.heart_rate} BPM</p>
                <p>Blood Pressure: {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic} mmHg</p>
                <p>Temperature: {vital.temperature} °F</p>
                <p>Oxygen Saturation: {vital.oxygen_saturation}%</p>
              </div>
            ))}
            {(!vitals || vitals.length === 0) && <p>No vitals recorded.</p>}
          </section>

          {/* Vitals Trends Charts */}
          <section>
            <h3 className="text-lg font-semibold">Vitals Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" /> {/* Date */}
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgHeartRate" stroke="#8884d8" name="Avg Heart Rate" />
                <Line type="monotone" dataKey="avgTemperature" stroke="#82ca9d" name="Avg Temperature" />
                <Line type="monotone" dataKey="avgOxygenSaturation" stroke="#ff7300" name="Avg Oxygen" />
              </LineChart>
            </ResponsiveContainer>
            {(!trends || trends.length === 0) && <p>No trends available.</p>}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
