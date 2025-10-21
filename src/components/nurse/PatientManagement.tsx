import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { patientAPI } from "@/services/api";

// JWT decode utility
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

function calculateAge(dobString: string) {
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
  return age;
}

// Patient interface
interface Patient {
  id: string;
  name: string;
  full_name: string;
  date_of_birth: string;
  address: string;
  admission_date: string;
  discharge_date?: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  gender: string;
  medical_history: string[];
  current_medications: string[];
  allergies: string[];
  status: "Active" | "Inactive" | "Scheduled" | "Ready";
  createdAt: string;
  updatedAt: string;
  vitals: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    lastUpdated?: string;
  };
}

const PatientManagementDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const user = getStoredUser();
  const nurseId = user?.id || "";

  // Query only patients assigned to this nurse
  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["assignedPatients", nurseId],
    queryFn: async () => {
      if (!nurseId) return [];
      const res = await patientAPI.getAllPatients({ assigned_nurse: nurseId });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!nurseId,
  });

  // Real-time socket updates
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("token") || "" },
    });

    socket.on("connect", () => console.log("✅ WebSocket connected for nurse's patients"));

    socket.on("patient:added", (newPatient: Patient) => {
      queryClient.setQueryData(["assignedPatients", nurseId], (old: Patient[] | undefined) =>
        old ? [...old, newPatient] : [newPatient]
      );
    });

    socket.on("patient:updated", (updatedPatient: Patient) => {
      queryClient.setQueryData(["assignedPatients", nurseId], (old: Patient[] | undefined) =>
        old?.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
      );
      if (selectedPatient?.id === updatedPatient.id) {
        setSelectedPatient(updatedPatient);
      }
    });

    socket.on("patient:deleted", (deletedId: string) => {
      queryClient.setQueryData(["assignedPatients", nurseId], (old: Patient[] | undefined) =>
        old?.filter((p) => p.id !== deletedId)
      );
      if (selectedPatient?.id === deletedId) {
        setSelectedPatient(null);
      }
    });

    return () => socket.disconnect();
  }, [queryClient, nurseId, selectedPatient]);

  const filteredPatients = patients.filter(
    (p) => p.full_name && p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!selectedPatient && filteredPatients.length > 0) {
      setSelectedPatient(filteredPatients[0]);
    }
  }, [filteredPatients, selectedPatient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 text-center text-gray-600">
        Loading patients...
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-6  min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Patient Management</h1>
        <p className="text-gray-600">Monitor and manage your assigned patients</p>
      </header>

      <div className="flex w-full gap-6">
        {/* Left - Patient List (40%) */}
        <div className="w-[40%]  rounded-xl shadow-md p-6 border border-gray-100 overflow-y-auto">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            Patient List ({filteredPatients.length})
          </h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 shadow-sm ${
                  selectedPatient?.id === patient.id
                    ? "border-red-500  shadow-md"
                    : "border-gray-200 hover:bg-gray-50 hover:shadow-sm"
                }`}
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{patient.full_name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{patient.email}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(patient.admission_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {filteredPatients.length === 0 && (
              <div className="text-center text-gray-500 py-4">No patients found.</div>
            )}
          </div>
        </div>

        {/* Right - Patient Preview (60%) */}
        <div className="w-[60%] p-6  rounded-lg shadow-lg border border-gray-200 overflow-y-auto">
          {selectedPatient ? (
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">Patient Preview</h2>

              {/* Personal Info */}
              <div className="mb-6 p-4 rounded-lg border border-gray-200 ">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Personal Info</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    Name:{" "}
                    <span className="font-semibold text-black">
                      {selectedPatient.full_name}
                    </span>
                  </p>
                  <p>
                    Age:{" "}
                    <span className="font-semibold text-black">
                      {calculateAge(selectedPatient.date_of_birth)}
                    </span>
                  </p>
                  <p>
                    Gender:{" "}
                    <span className="font-semibold text-black">
                      {selectedPatient.gender}
                    </span>
                  </p>
                  <p>
                    Blood Type:{" "}
                    <span className="font-semibold text-black">
                      {selectedPatient.blood_type}
                    </span>
                  </p>
                </div>
              </div>

              {/* Medical History */}
              <div className="mb-6 p-4 rounded-lg border border-gray-200 ">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Medical History</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    Allergies:{" "}
                    <span className="font-semibold text-black">
                      {selectedPatient.allergies.length
                        ? selectedPatient.allergies.join(", ")
                        : "N/A"}
                    </span>
                  </p>
                  <p>
                    Current Medications:{" "}
                    <span className="font-semibold text-black">
                      {selectedPatient.current_medications.length
                        ? selectedPatient.current_medications.join(", ")
                        : "N/A"}
                    </span>
                  </p>
                  <p>
                    History:{" "}
                    <span className="font-semibold text-black">
                      {selectedPatient.medical_history.length
                        ? selectedPatient.medical_history.join(", ")
                        : "N/A"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Admission Details */}
              <div className="mb-6 p-4 rounded-lg border border-gray-200 ">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Admission Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    Admission Date:{" "}
                    <span className="font-semibold text-green-800">
                      {new Date(selectedPatient.admission_date).toLocaleDateString()}
                    </span>
                  </p>
                  <p>
                    Discharge Date:{" "}
                    <span className="font-semibold text-green-800">
                      {selectedPatient.discharge_date
                        ? new Date(selectedPatient.discharge_date).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </p>
                  <p>
                    Status:{" "}
                    <span
                      className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedPatient.status === "Ready"
                          ? "bg-green-200 text-green-800"
                          : selectedPatient.status === "Scheduled"
                          ? "bg-yellow-200 text-yellow-800"
                          : selectedPatient.status === "Active"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {selectedPatient.status}
                    </span>
                  </p>
                </div>
              </div>
              {/* Contact Info */}
            <div className="p-4 rounded-lg border border-gray-200 ">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Contact Info</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    Email:{" "}
                    <span className="font-semibold text-red-800">
                      {selectedPatient.email}
                    </span>
                  </p>
                  <p>
                    Address:{" "}
                    <span className="font-semibold text-indigo-800">
                      {selectedPatient.address}
                    </span>
                  </p>
                  <p>
                    Emergency Contact:{" "}
                    <span className="font-semibold text-indigo-800">
                      {selectedPatient.emergency_contact_name} (
                      {selectedPatient.emergency_contact_phone})
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              Select a patient to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientManagementDashboard;
