import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, User, Bell, Zap, Bed, LogOut, Stethoscope, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DoctorPatientList from "./DoctorPatientList";
import DoctorAppointments from "./DoctorAppointments";
import Index from "@/pages/DoctorPages/Index";
import ActionsPage from "@/pages/DoctorPages/ActionsPage";
import InPatientsPage from "@/pages/DoctorPages/InPatientsPage";
import { userAPI } from "@/services/api";
import { NotificationsCenter } from "./NotificationsCenter";
import PatientManagementDashboard from "@/components/doctor/PatientManagement";

const TABS = [
  { value: "dashboard", label: "Dashboard", icon: Home },
  { value: "patients", label: "Assigned Patients", icon: Users },
  { value: "appointments", label: "Appointments", icon: Calendar },
  { value: "preview", label: "Patient Preview", icon: User },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "actions", label: "Quick Actions", icon: Zap },
  { value: "in-patients", label: "In-patients", icon: Bed },
];

const DoctorDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  const { data: doctorProfile } = useQuery({
    queryKey: ["doctorProfile"],
    queryFn: async () => (await userAPI.profile()).data
  });

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("token") || "" },
    });
    socket.on("connect", () => console.log(" Doctor WebSocket connected"));
    socket.on("appointment:updated", () => queryClient.invalidateQueries({ queryKey: ["doctorAppointments"] }));
    socket.on("patient:assigned", () => queryClient.invalidateQueries({ queryKey: ["assignedPatients"] }));
    socket.on("vital_alert", () => queryClient.invalidateQueries({ queryKey: ["doctorStats"] }));
    return () => { socket.disconnect(); };
  }, [queryClient]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };  return (
    <div className="min-h-screen bg-background">
      {/* Header - Admin UI Style */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">MedAIron</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Doctor Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="hidden md:flex">
              Dr. {doctorProfile?.name || "Doctor"}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setActiveTab("notifications")}
              className="relative"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Horizontal Tabs - Admin UI Style */}
          <TabsList className="flex flex-nowrap overflow-x-auto space-x-2 w-full px-2 bg-muted/50 rounded-lg mb-6">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="dashboard">
            <Index />
          </TabsContent>

          <TabsContent value="patients">
            <Card>
              <CardContent className="p-6">
                <DoctorPatientList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardContent className="p-6">
                <DoctorAppointments />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardContent className="p-6">
                <PatientManagementDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardContent className="p-6">
                <NotificationsCenter />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <Card>
              <CardContent className="p-6">
                <ActionsPage />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in-patients">
            <Card>
              <CardContent className="p-6">
                <InPatientsPage />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};


export default DoctorDashboard;
