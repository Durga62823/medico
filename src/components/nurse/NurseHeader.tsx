import { useQuery } from "@tanstack/react-query";
import { Users, AlertCircle, CheckCircle, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { patientAPI } from "@/services/api";

const API_BASE_URL = "http://localhost:5000";

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
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

function getStoredUser() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  return decodeJwt(token);
}

const allocationAPI = {
  getAllocations: async ({ staff_id }: { staff_id: string }) => {
    const token = localStorage.getItem("token");
    if (!token || !staff_id) throw new Error("Authentication token or staff ID is missing.");

    const response = await fetch(`${API_BASE_URL}/api/allocations?staff_id=${staff_id}`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch allocations");
    return response.json();
  },
};

export const NurseHeader = () => {
  const user = getStoredUser();
  const nurseId = user?.id;

  // Fetch assigned patients/allocations for the nurse
  const { data: allocations = [], isLoading: isAllocationsLoading } = useQuery({
    queryKey: ["nurseAllocations", nurseId],
    queryFn: async () => {
      if (!nurseId) return [];
      const res = await allocationAPI.getAllocations({ staff_id: nurseId });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!nurseId,
  });

  const today = new Date().toISOString().split("T")[0];
  const assignedPatientsToday = allocations.filter(
    (a: any) => a.allocation_date?.startsWith(today)
  ).length;

  // Fetch patient stats (assuming nurse can see all or ward-specific; adjust API if needed)
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["nurseStats"],
    queryFn: async () => {
      const res = await patientAPI.getAllPatients(); // Or use a nurse-specific endpoint if available
      const patients = res.data;

      const totalPatients = patients.length;
      const criticalPatients = patients.filter((p: any) => p.status === "critical").length;
      const dischargedToday = patients.filter(
        (p: any) => p.status === "discharged" && p.dischargedAt?.startsWith(today)
      ).length;
      const patientsWithAlerts = patients.filter((p: any) => p.alerts?.length > 0).length;

      return { totalPatients, criticalPatients, dischargedToday, patientsWithAlerts };
    },
  });

  // if (isLoading || isAllocationsLoading) {
  //   return (
  //     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  //       {Array.from({ length: 4 }).map((_, i) => (
  //         <Card key={i} className="shadow-medical border-0 animate-pulse">
  //           <CardContent className="p-6 h-24" />
  //         </Card>
  //       ))}
  //     </div>
  //   );
  // }

  if (error) {
    return <div className="p-4 text-red-500">⚠️ Failed to load dashboard stats</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Patients */}
      <Card className="shadow-medical border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="text-2xl font-bold text-foreground">{stats?.totalPatients || 0}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Patients Today */}
      <Card className="shadow-medical border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Assigned Patients Today</p>
              <p className="text-2xl font-bold text-foreground">{assignedPatientsToday}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Patients */}
      <Card className="shadow-medical border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Patients</p>
              <p className="text-2xl font-bold text-warning">{stats?.criticalPatients || 0}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <AlertCircle className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients with Alerts */}
      <Card className="shadow-medical border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Patients with Alerts</p>
              <p className="text-2xl font-bold text-success">{stats?.patientsWithAlerts || 0}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
