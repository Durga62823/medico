import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { allocationApi } from "../../services/api";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Result } from "postcss";
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
  patientId?: string; // Added for creating new allocations
  name: string;
  room: string;
  department: string;
  status: "stable" | "critical" | "monitoring" | "improving";
  day: number;
  primaryDiagnosis: string;
  vitals?: Vitals; // Made optional since backend may not return it
  alerts: Alert[];
};

interface Patient {
  _id: string;
  full_name: string;
}

export default function PatientAllocationAdmin() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allocations, setAllocations] = useState<PatientAllocation[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<PatientAllocation>({
    id: "",
    patientId: "",
    name: "",
    room: "",
    department: "",
    status: "stable",
    day: 1,
    primaryDiagnosis: "",
    vitals: { bp: "", hr: 0, temp: "", rr: 0, spo2: "" },
    alerts: [],
  });
  const [loading, setLoading] = useState(false);

  // Initial patient and allocation fetch
useEffect(() => {
  allocationApi.getPatients()
    .then(setPatients)
    .catch(() => toast.error("Failed to fetch patients"));

  allocationApi.get()
    .then(data => {
      // Normalize _id to id
      const normalized = data.map((a: any) => ({ ...a, id: a._id }));
      setAllocations(normalized);
    })
    .catch(() => toast.error("Failed to fetch allocations"));
}, []);


  // Real-time - sync allocation data with every update/delete/create
  useEffect(() => {
    const socket = io("http://localhost:5000/");
    socket.on("connect", () => console.log("Connected to socket"));
    socket.on("patientAllocationUpdated", (updated: PatientAllocation) => {
      setAllocations((prev) => {
        const i = prev.findIndex((a) => a.id === updated.id);
        if (i !== -1) {
          // Update existing
          const all = [...prev];
          all[i] = updated;
          return all;
        } else {
          // Add new
          return [...prev, updated];
        }
      });
      // If editing this allocation, also update form
      if (form.id === updated.id) setForm(updated);
    });
    socket.on("patientAllocationDeleted", (deletedId: string) => {
      setAllocations((prev) => prev.filter((a) => a.id !== deletedId));
      if (form.id === deletedId) resetForm();
    });
    return () => socket.disconnect();
    // Only depends on form.id so that we can update form when matching
    // eslint-disable-next-line
  }, [form.id]);

  // When selection changes, populate form from API or reset
  useEffect(() => {
    if (!selectedId) {
      resetForm();
      return;
    }
    allocationApi.get(selectedId)
      .then((allocation) => setForm(allocation))
      .catch(() => {
        const patient = patients.find((p) => p._id === selectedId);
        // Fresh allocation for this patient
        setForm({
          id: selectedId,
          patientId: selectedId, // Set patientId for new allocation
          name: patient ? patient.full_name : "",
          room: "",
          department: "",
          status: "stable",
          day: 1,
          primaryDiagnosis: "",
          vitals: { bp: "", hr: 0, temp: "", rr: 0, spo2: "" },
          alerts: [],
        });
      });

  }, [selectedId]);

  // Reset form to blank
  const resetForm = () => {
    setSelectedId("");
    setForm({
      id: "",
      patientId: "",
      name: "",
      room: "",
      department: "",
      status: "stable",
      day: 1,
      primaryDiagnosis: "",
      vitals: { bp: "", hr: 0, temp: "", rr: 0, spo2: "" },
      alerts: [],
    });
  };

  // Input handlers
  const handleFieldChange = (key: keyof PatientAllocation, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  const handleVitalChange = (key: keyof Vitals, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      vitals: { ...(prev.vitals || { bp: "", hr: 0, temp: "", rr: 0, spo2: "" }), [key]: value },
    }));
  };
  const handleAlertChange = (index: number, field: keyof Alert, value: string) => {
    setForm((prev) => {
      const updatedAlerts = [...prev.alerts];
      updatedAlerts[index] = { ...updatedAlerts[index], [field]: value } as Alert;
      return { ...prev, alerts: updatedAlerts };
    });
  };
  const addAlert = () => setForm((prev) => ({
    ...prev,
    alerts: [...prev.alerts, { type: "info", message: "" }],
  }));
  const removeAlert = (index: number) => setForm((prev) => ({
    ...prev,
    alerts: prev.alerts.filter((_, i) => i !== index),
  }));

  // CRUD ops
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log(form)
    try {
      let result: PatientAllocation;

      if (form.id) {
        result = await allocationApi.put(form.id, form);
      } else {
        result = await allocationApi.post(form);
      }
      
      toast.success(form.id ? "Allocation updated" : "Allocation created");
      setForm(result);
      if (!allocations.some((a) => a.id === result.id)) {
        setAllocations((old) => [...old, result]);
      } else {
        // Update existing allocation in the list
        setAllocations((old) => old.map((a) => a.id === result.id ? result : a));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save allocation";
      toast.error(errorMsg);
      console.error("Allocation save error:", err);
      
      // If update failed due to 404, reset the form ID and retry as new allocation
      if (form.id && errorMsg.includes("404")) {
        toast.info("Allocation not found. Creating new allocation instead.");
        const formWithoutId = { ...form, id: "" };
        setForm(formWithoutId);
      }
    } finally {
      setLoading(false);
    }
  };
const handleDeleteAllocation = async (id: string) => {
  if (!window.confirm("Are you sure you want to delete this allocation?")) return;
  setLoading(true);
  try {
    await allocationApi.delete(id);
    toast.success("Allocation deleted");
    // Optionally, refresh the list or remove the deleted allocation from state:
    setAllocations(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) {
      setSelectedId("");
      resetForm();
    }
  } catch {
    toast.error("Delete failed");
  } finally {
    setLoading(false);
  }
};
const handleDischarge = async (id:string) => {
  if (!window.confirm("Are you sure you want to discharge this patient?")) return;
  setLoading(true);
  try {
    await allocationApi.discharge(id); // Call your new endpoint
    toast.success("Patient discharged");
    
  } catch {
    toast.error("Discharge failed");
  } finally {
    setLoading(false);
  }
};


// console.log(allocations)
  return (
<div className="p-4">
    <Tabs defaultValue="allocations" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="allocations">All Allocations</TabsTrigger>
        <TabsTrigger value="form">Patient Allocation Form</TabsTrigger>
      </TabsList>

      {/* Allocations Tab */}
    <TabsContent value="allocations">
    <div className="space-y-6  rounded-lg shadow-sm p-8">
        <h3 className="text-lg font-bold mb-4 text-medical-primary">All Allocations</h3>
        <ul className="divide-y">
        {allocations.length > 0 ? (
            allocations.map((a) => (
            <li
                key={a.id}
                className={`flex justify-between items-start p-3 rounded hover:bg-secondary`}
            >
                <div className="flex-1 cursor-pointer" onClick={() => setSelectedId(a._id)}>
                <div className="font-semibold">{a.name}</div>
                <div className="text-sm text-gray-600">{a.room} — {a.department}</div>
                <div className={`inline-block text-xs mt-1 px-2 py-1 rounded-full ${a.status === "stable" ? "bg-green-100 text-green-800" : a.status === "critical" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {a.status}
                    {a.discharged && " (Discharged)"}
                </div>
                </div>
                <button
  onClick={() => handleDischarge(a._id)}
  className="ml-2 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
>
  Discharge
</button>
                <button
                onClick={() => handleDeleteAllocation(a._id)}
                className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                Delete
                </button>
            </li>
            ))
        ) : (
            <li className="text-gray-400">No allocations found</li>
        )}
        </ul>
    </div>
    </TabsContent>



      {/* Form Tab */}
      <TabsContent value="form">
        <div className="p-6 space-y-6 shadow-md rounded-lg border-2">
          <h2 className="text-2xl font-bold mb-6 text-center text-medical-primary">Patient Allocation Form</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <select
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-medical-primary focus:outline-none"
                  value={form.id}
                  onChange={e => {
                    const patientId = e.target.value;
                    setSelectedId(patientId);
                    // Also update the form's patientId field
                    const patient = patients.find(p => p._id === patientId);
                    if (patient) {
                      setForm(prev => ({
                        ...prev,
                        patientId: patientId,
                        name: patient.full_name
                      }));
                    }
                  }}
                  disabled={!!form.id}
                >
                  <option value="">Select Patient</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.full_name}
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
                  onChange={e => handleFieldChange("room", e.target.value)}
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
                  onChange={e => handleFieldChange("department", e.target.value)}
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
                  onChange={e => handleFieldChange("day", Number(e.target.value))}
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
                  onChange={e => handleFieldChange("primaryDiagnosis", e.target.value)}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-medical-primary focus:outline-none"
                  value={form.status}
                  onChange={e => handleFieldChange("status", e.target.value as any)}
                >
                  <option value="stable">Stable</option>
                  <option value="critical">Critical</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="improving">Improving</option>
                </select>
              </div>
            </div>

            {/* Vitals Section */}
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
                      value={form.vitals?.[key as keyof Vitals] ?? (type === "number" ? 0 : "")}
                      onChange={e =>
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

            {/* Alerts Section */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Alerts</h3>
              {form.alerts.map((alert, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    className="px-2 py-1 border rounded-md"
                    value={alert.type}
                    onChange={(e) =>
                      handleAlertChange(index, "type", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleAlertChange(index, "message", e.target.value)
                    }
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

            {/* Save and Delete Buttons */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-secondary cursor-pointer hover:bg-green-400 text-black rounded-md hover:bg-medical-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Allocation"}
              </button>
            </div>

          </form>
        </div>
      </TabsContent>
    </Tabs>
  </div>
  );
}
