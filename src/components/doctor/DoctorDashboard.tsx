import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Menu, Users, Calendar, User, Bell, Zap, Bed, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DoctorPatientList from "./DoctorPatientList";
import DoctorAppointments from "./DoctorAppointments";
import Index from "@/pages/DoctorPages/Index";
import ActionsPage from "@/pages/DoctorPages/ActionsPage";
import InPatientsPage from "@/pages/DoctorPages/InPatientsPage";

import { userAPI } from "@/services/api";
import { NotificationsCenter } from "./NotificationsCenter";

const DoctorDashboard = () => {
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const alertsRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // ✅ Fetch doctor's profile
  const { data: doctorProfile } = useQuery({
    queryKey: ["doctorProfile"],
    queryFn: async () => {
      const res = await userAPI.profile();
      return res.data;
    },
  });

  // ✅ Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  // ✅ Real-time updates with Socket.IO
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("token") || "" },
    });

    socket.on("connect", () => console.log("✅ WebSocket connected"));

    socket.on("appointment:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["doctorAppointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctorStats"] });
    });

    socket.on("patient:assigned", () => {
      queryClient.invalidateQueries({ queryKey: ["assignedPatients"] });
      queryClient.invalidateQueries({ queryKey: ["doctorStats"] });
    });

    socket.on("vital_alert", () => {
      queryClient.invalidateQueries({ queryKey: ["doctorStats"] });
    });

    return () => socket.disconnect();
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-8xl space-y-6">
        
        {/* ✅ Header */}
        <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur p-4 flex justify-between items-center">
          {/* Left: Menu & Branding */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">MedAIron</h1>
                <p className="text-xs text-muted-foreground">AI Healthcare Dashboard</p>
              </div>
            </div>
          </div>

          {/* Right: Date + Alerts + Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-sm font-semibold">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab("dashboard");
                setTimeout(() => alertsRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
              }}
            >
              <Bell className="h-4 w-4 mr-2" /> Alerts
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </header>

        {/* ✅ Tabs Navigation */}
              <div className=" flex justify-center ">
              <Card className="shadow-card">
          <CardContent className="p-0 ">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full m-4">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7   ">
                {[
                  { value: "dashboard", label: "Dashboard", icon: Users },
                  { value: "patients", label: "Assigned Patients", icon: Users },
                  { value: "appointments", label: "Appointments", icon: Calendar },
                  { value: "preview", label: "Patient Preview", icon: User },
                  { value: "notifications", label: "Notifications", icon: Bell },
                  { value: "actions", label: "Quick Actions", icon: Zap },
                  { value: "in-patients", label: "In-patients", icon: Bed },
                ].map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex items-center justify-center md:justify-start px-4  text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
                  >
                    <Icon className="h-4 w-4 mr-2" /> {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ✅ Tab Content */}
              <TabsContent value="dashboard" className="p-6">
                <Index />
              </TabsContent>
              <TabsContent value="patients" className="p-6">
                <DoctorPatientList />
              </TabsContent>
              <TabsContent value="appointments" className="p-6">
                <DoctorAppointments />
              </TabsContent>
              <TabsContent value="actions" className="p-6">
                <ActionsPage />
              </TabsContent>
              <TabsContent value="in-patients" className="p-6">
                <InPatientsPage />
              </TabsContent>
              <TabsContent value="notifications" className="p-6">
                <NotificationsCenter />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
              </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
