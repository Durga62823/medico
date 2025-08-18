import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userAPI, patientAPI, vitalAPI } from "@/services/api";
import { io } from "socket.io-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { VitalSignChart } from "./VitalSignChart";
import { AlertsPanel } from "./AlertsPanel";
import { AIAssistant } from "./AIAssistant";
import { PatientOverview } from "./PatientOverview";
import PatientManagement from "./PatientManagement";
import UserManagement from "./UserManagement";
import AppointmentsManagement from "./AppointmentsManagement";
import BillingManagement from "./BillingManagement";
import NotesSection from "@/components/NotesSection";
import DoctorDashboard from "./DoctorDashboard"; // NEW: Import the doctor-specific dashboard
import {
  Heart,
  Activity,
  Thermometer,
  Droplets,
  Bell,
  BarChart3,
  Users,
  LogOut,
  Menu,
  Home,
} from "lucide-react";

interface DashboardProps {
  onLogout: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  license_number?: string;
  department?: string;
}

// Fallback data used when APIs fail or are not available.
// Keeps charts functional during development.
const fallbackHeartRate = [
  { time: "12:00", value: 72 },
  { time: "12:15", value: 75 },
  { time: "12:30", value: 73 },
  { time: "12:45", value: 78 },
  { time: "1:00", value: 76 },
  { time: "1:15", value: 74 },
];

const fallbackBloodPressure = [
  { time: "12:00", value: 118 },
  { time: "12:15", value: 122 },
  { time: "12:30", value: 120 },
  { time: "12:45", value: 125 },
  { time: "1:00", value: 123 },
  { time: "1:15", value: 119 },
];

const fallbackTemperature = [
  { time: "12:00", value: 98.6 },
  { time: "12:15", value: 98.7 },
  { time: "12:30", value: 98.5 },
  { time: "12:45", value: 98.8 },
  { time: "1:00", value: 98.9 },
  { time: "1:15", value: 98.7 },
];

const fallbackOxygen = [
  { time: "12:00", value: 98 },
  { time: "12:15", value: 97 },
  { time: "12:30", value: 98 },
  { time: "12:45", value: 96 },
  { time: "1:00", value: 97 },
  { time: "1:15", value: 98 },
];

export function Dashboard({ onLogout }: DashboardProps) {
  const queryClient = useQueryClient();
  const alertsRef = useRef<HTMLDivElement | null>(null);

  // Fetch user profile
  const { data: userProfile, isLoading: loading } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await userAPI.profile();
      return res.data;
    },
  });

  // Set default tab: "patients" for doctors, "overview" for others
  const [activeTab, setActiveTab] = useState<string>(
    (userProfile?.role || "").toLowerCase() === "doctor" ? "patients" : "overview"
  );

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Fetch patients
  const { data: patientsData } = useQuery({
    queryKey: ["patients", (userProfile?.role || "").toLowerCase(), userProfile?.id],
    queryFn: async () => {
      if (!userProfile) return [];
      const role = (userProfile.role || "").toLowerCase();
      const filters: any = {};
      if (role === "doctor") filters.assigned_doctor = userProfile.id;
      if (role === "nurse") filters.assigned_nurse = userProfile.id;
      const res = await patientAPI.getAllPatients(filters);
      return res.data;
    },
    enabled: !!userProfile,
  });

  // Selected patient id (simple localStorage approach; you can replace with context/state)
  const selectedId = typeof window !== "undefined" ? localStorage.getItem("selected_patient_id") || "" : "";

  // Fetch vitals trends for selected patient
  const { data: vitalsData } = useQuery({
    queryKey: ["vitals", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const res = await vitalAPI.getTrends(selectedId);
      return res.data;
    },
    enabled: !!selectedId && !!userProfile,
  });

  // Dashboard stats
  const [stats, setStats] = useState({
    activePatients: 0,
    criticalAlerts: 0,
    aiPredictions: 0,
    systemOnline: true,
  });

  useEffect(() => {
    if (patientsData) {
      const activePatients = Array.isArray(patientsData)
        ? patientsData.filter((p: any) => p.status === "active").length
        : 0;
      setStats((prev) => ({ ...prev, activePatients }));
    }
    setStats((prev) => ({ ...prev, systemOnline: typeof navigator !== "undefined" ? navigator.onLine : true }));
  }, [patientsData]);

  // Real-time alerts via Socket.io
  useEffect(() => {
    if (!userProfile) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: typeof window !== "undefined" ? localStorage.getItem("token") : null },
    });
    socket.on("connect", () => console.log("WebSocket connected"));
    socket.on("disconnect", (reason) => console.log("WebSocket disconnected:", reason));
    socket.on("vital_alert", (data: any) => {
      console.log("Alert received:", data);
      // Revalidate alerts or add to local state
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      // Optionally increment criticalAlerts
      setStats((prev) => ({ ...prev, criticalAlerts: (prev.criticalAlerts || 0) + 1 }));
    });
    return () => {
      socket.disconnect();
    };
  }, [userProfile, queryClient]);

  // Vitals: use backend or fallback values
  const vitals = {
    heartRate: vitalsData?.avgHeartRate || fallbackHeartRate,
    bloodPressure: vitalsData?.avgBloodPressure || fallbackBloodPressure,
    temperature: vitalsData?.avgTemperature || fallbackTemperature,
    oxygen: vitalsData?.avgOxygenSaturation || fallbackOxygen,
  };

  useEffect(() => {
    // Scroll to top on mount
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  const getRoleDisplayName = (roleRaw: string) => {
    const role = (roleRaw || "").toLowerCase();
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : "";
  };

  const getRoleBadgeVariant = (roleRaw: string) => {
    const role = (roleRaw || "").toLowerCase();
    switch (role) {
      case "doctor":
        return "default";
      case "nurse":
        return "secondary";
      case "patient":
        return "outline";
      case "admin":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-primary/10 via-background to-medical-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-medical-primary mx-auto" />
          <p className="mt-4 text-medical-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-primary/10 via-background to-medical-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-medical-text">Error loading user profile</p>
        </div>
      </div>
    );
  }

  // NEW: Conditional rendering for Doctor role - Use DoctorDashboard
  if ((userProfile.role || "").toLowerCase() === "doctor") {
    return <DoctorDashboard />;
  }

  // Original dashboard for other roles
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed((s) => !s)}
              className="md:hidden"
              aria-pressed={sidebarCollapsed}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">MedAIron</h1>
                <p className="text-xs text-muted-foreground">AI Healthcare Dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={getRoleBadgeVariant(userProfile.role) as any}>
              {getRoleDisplayName(userProfile.role)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab("overview");
                setTimeout(() => alertsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
              }}
            >
              <Bell className="w-4 h-4 mr-2" />
              Alerts
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="vitals" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Vitals</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Patients</span>
            </TabsTrigger>
            {/* Admin: Users */}
            {(userProfile.role || "").toLowerCase() === "admin" && (
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
            )}
            {/* Admin or Doctor: Appointments */}
            {["admin", "doctor"].includes((userProfile.role || "").toLowerCase()) && (
              <TabsTrigger value="appointments" className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Appointments</span>
              </TabsTrigger>
            )}
            {/* Admin: Billing */}
            {(userProfile.role || "").toLowerCase() === "admin" && (
              <TabsTrigger value="billing" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Billing</span>
              </TabsTrigger>
            )}
          </TabsList>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activePatients}</div>
                  <p className="text-xs text-muted-foreground">from backend data</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                  <Bell className="h-4 w-4 text-vital-critical" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-vital-critical">{stats.criticalAlerts}</div>
                  <p className="text-xs text-muted-foreground">Require immediate attention</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Predictions</CardTitle>
                  <Activity className="h-4 w-4 text-ai-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.aiPredictions}</div>
                  <p className="text-xs text-muted-foreground">Generated</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <Activity className="h-4 w-4 text-vital-normal" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      stats.systemOnline ? "text-vital-normal" : "text-vital-critical"
                    }`}
                  >
                    {stats.systemOnline ? "Online" : "Offline"}
                  </div>
                  <p className="text-xs text-muted-foreground">Network status</p>
                </CardContent>
              </Card>
            </div>
            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Vital Signs */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <VitalSignChart
                    title="Heart Rate"
                    currentValue={vitals.heartRate[vitals.heartRate.length - 1]?.value ?? 0}
                    unit="BPM"
                    normalRange={[60, 100]}
                    data={vitals.heartRate}
                    icon={Heart}
                  />
                  <VitalSignChart
                    title="Blood Pressure"
                    currentValue={vitals.bloodPressure[vitals.bloodPressure.length - 1]?.value ?? 0}
                    unit="mmHg"
                    normalRange={[90, 120]}
                    data={vitals.bloodPressure}
                    icon={Activity}
                  />
                  <VitalSignChart
                    title="Temperature"
                    currentValue={vitals.temperature[vitals.temperature.length - 1]?.value ?? 0}
                    unit="°F"
                    normalRange={[97.8, 99.1]}
                    data={vitals.temperature}
                    icon={Thermometer}
                  />
                  <VitalSignChart
                    title="Oxygen Saturation"
                    currentValue={vitals.oxygen[vitals.oxygen.length - 1]?.value ?? 0}
                    unit="%"
                    normalRange={[95, 100]}
                    data={vitals.oxygen}
                    icon={Droplets}
                  />
                </div>
                {/* Alerts Panel */}
                <div ref={alertsRef}>
                  <AlertsPanel />
                </div>
              </div>
              {/* Right Column */}
              <div className="space-y-6">
                <PatientOverview />
                <NotesSection patientId={selectedId} userRole={(userProfile.role || "").toLowerCase()} />
                <AIAssistant />
              </div>
            </div>
          </TabsContent>
          {/* Vitals Tab */}
          <TabsContent value="vitals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Vital Signs Monitoring</CardTitle>
                <CardDescription>Real-time health metrics with AI-powered anomaly detection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <VitalSignChart
                    title="Heart Rate Variability"
                    currentValue={vitals.heartRate[vitals.heartRate.length - 1]?.value ?? 0}
                    unit="BPM"
                    normalRange={[60, 100]}
                    data={vitals.heartRate}
                    icon={Heart}
                  />
                  <VitalSignChart
                    title="Blood Pressure Trends"
                    currentValue={vitals.bloodPressure[vitals.bloodPressure.length - 1]?.value ?? 0}
                    unit="mmHg"
                    normalRange={[90, 120]}
                    data={vitals.bloodPressure}
                    icon={Activity}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Health Analytics & Predictions</CardTitle>
                <CardDescription>AI-driven insights and predictive health modeling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Advanced Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Machine learning models for predictive health analytics and trend analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6">
            <PatientManagement userRole={(userProfile.role || "").toLowerCase()} userId={userProfile.id} />
          </TabsContent>
          {/* Users Tab (Admin only) */}
          {(userProfile.role || "").toLowerCase() === "admin" && (
            <TabsContent value="users" className="space-y-6">
              <UserManagement userRole={(userProfile.role || "").toLowerCase()} />
            </TabsContent>
          )}
          {/* Admin or Doctor: Appointments */}
          {["admin", "doctor"].includes((userProfile.role || "").toLowerCase()) && (
            <TabsContent value="appointments" className="space-y-6">
              <AppointmentsManagement userRole={(userProfile.role || "").toLowerCase()} userId={userProfile.id} />
            </TabsContent>
          )}
          {/* Admin: Billing */}
          {(userProfile.role || "").toLowerCase() === "admin" && (
            <TabsContent value="billing" className="space-y-6">
              <BillingManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default Dashboard;
