import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { allocationApi } from "../../services/api";
import { toast } from "sonner";

type Vitals = {
  bp: string;
  hr: number;
  temp: string;
  rr: number;
  spo2: string;
};

type Alert = { type: "info" | "warning" | "critical"; message: string };

export type PatientAllocation = {
  id: string;
  name: string;
  room: string;
  department: string;
  status: "stable" | "critical" | "monitoring" | "improving";
  day: number;
  primaryDiagnosis: string;
  vitals: Vitals;
  alerts: Alert[];
};

interface PatientAllocationFormProps {
  onSubmit?: (val: PatientAllocation) => void;
  initialData?: PatientAllocation;
}

export default function PatientAllocationForm({
  onSubmit = () => {},
  initialData,
}: PatientAllocationFormProps) {
  const [patients, setPatients] = useState<{ _id: string; full_name: string }[]>([]);
  const [form, setForm] = useState<PatientAllocation>(
    initialData || {
      id: "",
      name: "",
      room: "",
      department: "",
      status: "stable",
      day: 1,
      primaryDiagnosis: "",
      vitals: { bp: "", hr: 0, temp: "", rr: 0, spo2: "" },
      alerts: [],
    }
  );
  const [loading, setLoading] = useState(false);

  // Fetch patients on component mount
  useEffect(() => {
    console.log("Fetching patients...");
    allocationApi.getPatients()
      .then((data) => {
        console.log("Patients fetched:", data);
        setPatients(data);
      })
      .catch((err) => {
        console.error("Error fetching patients:", err);
      });
  }, []);

  // Fetch allocation details when patient is selected
  const fetchAllocation = async (id: string) => {
    try {
      console.log("Fetching allocation for patient:", id);
      const allocation = await allocationApi.getAllocation(id);
      console.log("Fetched allocation:", allocation);
      setForm(allocation);
    } catch (err) {
      console.error("Allocation not found, initializing new allocation");
      setForm((prev) => ({
        ...prev,
        id: id,
        name: patients.find((p) => p._id === id)?.full_name || "",
        room: "",
        department: "",
        status: "stable",
        day: 1,
        primaryDiagnosis: "",
        vitals: { bp: "", hr: 0, temp: "", rr: 0, spo2: "" },
        alerts: [],
      }));
    }
  };

  // Handle socket connection for real-time updates
  useEffect(() => {
    console.log("Setting up socket connection...");
    const socket = io("http://localhost:5000");
    socket.on("connect", () => console.log("Connected to socket"));
    socket.on("patientAllocationUpdated", (updated: PatientAllocation) => {
      console.log("Received update:", updated);
      if (form.id && updated.id === form.id) {
        console.log("Updating form data");
        setForm(updated);
      }
    });
    return () => {
      console.log("Disconnecting socket...");
      socket.disconnect();
    };
  }, [form.id]);

  // Handle input changes
  const handleFieldChange = (key: keyof PatientAllocation, value: string | number) => {
    console.log(`Field change: ${key} =`, value);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleVitalChange = (key: keyof Vitals, value: string | number) => {
    console.log(`Vital change: ${key} =`, value);
    setForm((prev) => ({
      ...prev,
      vitals: { ...prev.vitals, [key]: value },
    }));
  };

  const handleAlertChange = (index: number, field: keyof Alert, value: string) => {
    console.log(`Alert change at ${index}: ${field} =`, value);
    setForm((prev) => {
      const updatedAlerts = [...prev.alerts];
      updatedAlerts[index] = { ...updatedAlerts[index], [field]: value } as Alert;
      return { ...prev, alerts: updatedAlerts };
    });
  };

  const addAlert = () => {
    console.log("Adding new alert");
    setForm((prev) => ({
      ...prev,
      alerts: [...prev.alerts, { type: "info", message: "" }],
    }));
  };

  const removeAlert = (index: number) => {
    console.log(`Removing alert at index ${index}`);
    setForm((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting:", form);
    setLoading(true);
    try {
      let result: PatientAllocation;
      console.log(form.id ? "Updating existing allocation" : "Creating new allocation");
      if (form.id) {
        console.log("Updating allocation");
        result = await allocationApi.put(form.id, form);
      } else {
        console.log("Creating new allocation");
        result = await allocationApi.post(form);
      }
      toast.success("Patient allocation saved");
      onSubmit(result);
    } catch (err: any) {
      console.error("Submission failed:", err.response ? err.response.data : err.message);
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
      console.log("Finished submitting");
    }
  };

  // Handle deletion of allocation
  const handleDelete = async () => {
    if (!form.id) return;
    if (!window.confirm("Are you sure you want to delete this allocation?")) return;
    setLoading(true);
    try {
      await allocationApi.delete(form.id);
      toast.success("Allocation deleted");
      onSubmit({
        ...form,
        id: "",
        name: "",
        room: "",
        department: "",
        status: "stable",
        day: 1,
        primaryDiagnosis: "",
        vitals: { bp: "", hr: 0, temp: "", rr: 0, spo2: "" },
        alerts: []
      });
      setForm({
        id: "",
        name: "",
        room: "",
        department: "",
        status: "stable",
        day: 1,
        primaryDiagnosis: "",
        vitals: { bp: "", hr: 0, temp: "", rr: 0, spo2: "" },
        alerts: []
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-medical-primary">Patient Allocation Form</h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Patient Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <select
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-medical-primary focus:outline-none"
              value={form.id}
              onChange={(e) => {
                const selectedId = e.target.value;
                handleFieldChange("id", selectedId);
                const selectedPatient = patients.find((p) => p._id === selectedId);
                if (selectedPatient) {
                  handleFieldChange("name", selectedPatient.full_name);
                  fetchAllocation(selectedId);
                }
              }}
            >
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.full_name} (ID: {patient._id})
                </option>
              ))}
            </select>
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <input
              type="text"
              placeholder="Room"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-medical-primary focus:outline-none"
              value={form.room}
              onChange={(e) => handleFieldChange("room", e.target.value)}
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              placeholder="Department"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-medical-primary focus:outline-none"
              value={form.department}
              onChange={(e) => handleFieldChange("department", e.target.value)}
            />
          </div>

          {/* Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <input
              type="number"
              min={1}
              placeholder="Day"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-medical-primary focus:outline-none"
              value={form.day}
              onChange={(e) => handleFieldChange("day", Number(e.target.value))}
            />
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
            <input
              type="text"
              placeholder="Diagnosis"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-medical-primary focus:outline-none"
              value={form.primaryDiagnosis}
              onChange={(e) => handleFieldChange("primaryDiagnosis", e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-medical-primary focus:outline-none"
              value={form.status}
              onChange={(e) => handleFieldChange("status", e.target.value as any)}
            >
              <option value="stable">Stable</option>
              <option value="critical">Critical</option>
              <option value="monitoring">Monitoring</option>
              <option value="improving">Improving</option>
            </select>
          </div>
        </div>

        {/* Vitals */}
        <div className="border-t pt-4 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Vitals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "BP", key: "bp", type: "text" },
              { label: "HR", key: "hr", type: "number" },
              { label: "Temp", key: "temp", type: "text" },
              { label: "RR", key: "rr", type: "number" },
              { label: "SpO₂", key: "spo2", type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key} className={key === "spo2" ? "md:col-span-2" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  placeholder={label}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-medical-primary focus:outline-none"
                  value={form.vitals[key as keyof Vitals]}
                  onChange={(e) =>
                    handleVitalChange(
                      key as keyof Vitals,
                      type === "number" ? Number(e.target.value) : e.target.value
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="border-t pt-4 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Alerts</h3>
          {form.alerts.map((alert, index) => (
            <div key={index} className="flex gap-2 items-center">
              <select
                className="px-2 py-1 border rounded-md"
                value={alert.type}
                onChange={(e) => handleAlertChange(index, "type", e.target.value)}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
              <input
                type="text"
                className="flex-1 px-4 py-1 border rounded-md"
                placeholder="Alert message"
                value={alert.message}
                onChange={(e) => handleAlertChange(index, "message", e.target.value)}
              />
              <button
                type="button"
                className="px-2 py-1 bg-red-500 text-white rounded-md"
                onClick={() => removeAlert(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="px-4 py-2 bg-red-400 text-black rounded-md hover:bg-medical-primary-dark transition-colors"
            onClick={addAlert}
          >
            Add Alert
          </button>
        </div>

        {/* Submit and Delete */}
        <div className="text-center">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-secondary cursor-pointer hover:bg-green-400 text-black rounded-md hover:bg-medical-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Allocation"}
          </button>
        </div>

        {form.id && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Delete Allocation
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
