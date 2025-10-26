import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import debounce from "lodash.debounce";
import { patientAPI } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

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

// Interface
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
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const user = getStoredUser();
  const doctorId = user?.id || "";

  const debounceSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    debounceSearch(e.target.value);
  };

  const { data: patients = [], isLoading, error } = useQuery<Patient[]>({
    queryKey: ["assignedPatients", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const res = await patientAPI.getAllPatients({ assigned_doctor: doctorId });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!doctorId,
  });

  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!selectedPatient && filteredPatients.length > 0)
      setSelectedPatient(filteredPatients[0]);
  }, [filteredPatients, selectedPatient]);

  useEffect(() => {
    if (!doctorId) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("token") || "" },
    });

    socket.on("patient:added", (newPatient: Patient) => {
      queryClient.setQueryData(["assignedPatients", doctorId], (old: Patient[] | undefined) =>
        old ? [...old, newPatient] : [newPatient]
      );
    });

    socket.on("patient:updated", (updatedPatient: Patient) => {
      queryClient.setQueryData(["assignedPatients", doctorId], (old: Patient[] | undefined) =>
        old?.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
      );
      setSelectedPatient((current) =>
        current?.id === updatedPatient.id ? updatedPatient : current
      );
    });

    socket.on("patient:deleted", (deletedId: string) => {
      queryClient.setQueryData(["assignedPatients", doctorId], (old: Patient[] | undefined) =>
        old?.filter((p) => p.id !== deletedId)
      );
      setSelectedPatient((current) => (current?.id === deletedId ? null : current));
    });

    return () => socket.disconnect();
  }, [doctorId, queryClient]);

  if (isLoading)
    return (
      <div className="max-w-full mx-auto p-6 bg-background min-h-screen">
        <header className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </header>

        <div className="flex w-full gap-6">
          {/* Left - Patient List Skeleton */}
          <div className="w-[40%] bg-card rounded-xl shadow-md p-6 border border-border">
            <Skeleton className="h-12 w-full mb-6" />
            <Skeleton className="h-7 w-48 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 border border-border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Patient Preview Skeleton */}
          <div className="w-[60%] bg-card p-6 rounded-lg shadow-lg border border-border">
            <Skeleton className="h-8 w-48 mb-6" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="mb-6 p-4 rounded-lg border border-border">
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex justify-center items-center bg-background text-red-600 dark:text-red-400">
        Failed to load patients.
      </div>
    );

  return (
    <div className="max-w-full mx-auto p-6 bg-background rounded-3xl transition-colors duration-300">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Patient Management</h1>
        <p className="text-muted-foreground">
          Comprehensive patient information and medical records
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-md p-6 max-h-[700px] overflow-y-auto">
          <input
            type="text"
            placeholder="Search patients..."
            className="w-full p-3 mb-6 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchText}
            onChange={onSearchChange}
          />
          <h2 className="text-lg font-semibold mb-4 border-b border-border pb-2 text-foreground">
            Patient List ({filteredPatients.length})
          </h2>
          {filteredPatients.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              No patients found.
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className={`p-4 mt-2 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedPatient?.id === patient.id
                    ? "hover:border-red-500  bg-black dark:bg-black shadow-md"
                    : "border-gray-200 dark:border-gray-700  hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-foreground">
                      {patient.full_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{patient.email}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(patient.admission_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Patient Preview */}
        {selectedPatient && (
          <PatientPreview patient={selectedPatient} calculateAge={calculateAge} />
        )}
      </div>
    </div>
  );
};

// PatientPreview
interface PreviewProps {
  patient: Patient;
  calculateAge: (dob: string) => number;
}

const PatientPreview = ({ patient, calculateAge }: PreviewProps) => (
  <div className="bg-card border border-border rounded-lg shadow-lg p-6 space-y-6">
    <h2 className="text-2xl font-bold text-foreground">Patient Preview</h2>
    <Section title="Personal Info">
      <Info label="Name" value={patient.full_name} />
      <Info label="Age" value={`${calculateAge(patient.date_of_birth)} years`} />
      <Info label="Date of Birth" value={new Date(patient.date_of_birth).toLocaleDateString()} />
      <Info label="Gender" value={patient.gender} />
      <Info label="Blood Type" value={patient.blood_type} />
    </Section>
    <Section title="Medical History">
      <Info label="Allergies" value={patient.allergies.join(", ") || "N/A"} />
      <Info label="Medications" value={patient.current_medications.join(", ") || "N/A"} />
      <Info label="History" value={patient.medical_history.join(", ") || "N/A"} />
    </Section>
    <Section title="Contact Info">
      <Info label="Email" value={patient.email} />
      <Info label="Address" value={patient.address} />
      <Info
        label="Emergency Contact"
        value={`${patient.emergency_contact_name} (${patient.emergency_contact_phone})`}
      />
    </Section>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="p-4 rounded-lg border border-border bg-muted/30">
    <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
    <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
  </section>
);

const Info = ({ label, value }: { label: string; value: string }) => (
  <p>
    <span className="font-medium text-foreground">{label}: </span>
    <span className="font-semibold  text-rose-400">{value}</span>
  </p>
);

export default PatientManagementDashboard;
