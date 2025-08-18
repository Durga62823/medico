import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Calendar, 
  User,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import DoctorPatientList from "./DoctorPatientList";
import DoctorAppointments from "./DoctorAppointments";
import { userAPI, patientAPI, appointmentAPI } from "@/services/api"; // Import your API services

const DoctorDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("patients"); // Default to patients

  // Fetch doctor's profile (assuming it includes full_name and department)
  const { data: doctorProfile } = useQuery({
    queryKey: ["doctorProfile"],
    queryFn: async () => {
      const res = await userAPI.profile(); // Assuming this endpoint returns the logged-in user's profile
      return res.data;
    },
  });

  // Fetch dynamic stats using React Query (replace with actual API calls)
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["doctorStats"],
    queryFn: async () => {
      // 1. Fetch all patients from backend
      const res = await patientAPI.getAllPatients();
      const patients = res.data; // assuming array of patients
  
      // 2. Calculate stats from patients array
      const totalPatients = patients.length;
  
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  
      const todayAppointments = patients.filter(
        (p: any) => p.appointmentDate && p.appointmentDate.startsWith(today)
      ).length;
  
      const criticalPatients = patients.filter(
        (p: any) => p.status === "critical"
      ).length;
  
      const dischargedToday = patients.filter(
        (p: any) =>
          p.status === "discharged" &&
          p.dischargedAt &&
          p.dischargedAt.startsWith(today)
      ).length;
  
      // 3. Return structured stats
      return {
        totalPatients,
        todayAppointments,
        criticalPatients,
        dischargedToday,
      };
    },
  });
  

  // Real-time updates with Socket.IO
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: typeof window !== "undefined" ? localStorage.getItem("token") : null },
    });

    socket.on("connect", () => console.log("WebSocket connected"));

    // Listen for relevant events (e.g., new appointment or patient assignment)
    socket.on("appointment:updated", (data) => {
      console.log("Appointment update received:", data);
      queryClient.invalidateQueries(["doctorAppointments"]); // Refresh appointments
      queryClient.invalidateQueries(["doctorStats"]); // Refresh stats if needed
    });

    socket.on("patient:assigned", (data) => {
      console.log("Patient assignment update:", data);
      queryClient.invalidateQueries(["assignedPatients"]); // Refresh patient list
      queryClient.invalidateQueries(["doctorStats"]); // Refresh stats
    });

    socket.on("vital_alert", (data) => {
      console.log("Vital alert received:", data);
      queryClient.invalidateQueries(["doctorStats"]); // Update critical patients count
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-gradient-medical p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src="/api/placeholder/48/48" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{doctorProfile?.full_name}</h1>
              <p className="text-muted-foreground">{doctorProfile?.department || "Internal Medicine"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-lg font-semibold text-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <Card className="shadow-medical border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Appointments</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.todayAppointments || 0}</p>
                </div>
                <div className="rounded-full bg-info/10 p-3">
                  <Calendar className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-medical border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Patients</p>
                  <p className="text-2xl font-bold text-warning">{stats?.criticalPatients || 0}</p>
                </div>
                <div className="rounded-full bg-warning/10 p-3">
                  <AlertCircle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-medical border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Discharged Today</p>
                  <p className="text-2xl font-bold text-success">{stats?.dischargedToday || 0}</p>
                </div>
                <div className="rounded-full bg-success/10 p-3">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Card className="shadow-card border-0">
          <CardHeader className="border-b bg-background/50">
            <CardTitle className="text-xl text-foreground">Patient Management</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="patients" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 m-4 mb-0 rounded-lg">
                <TabsTrigger 
                  value="patients" 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-medical data-[state=active]:text-primary font-medium"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Assigned Patients
                </TabsTrigger>
                <TabsTrigger 
                  value="appointments"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-medical data-[state=active]:text-primary font-medium"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Appointments
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="patients" className="p-4 pt-6">
                <DoctorPatientList />
              </TabsContent>
              
              <TabsContent value="appointments" className="p-4 pt-6">
                <DoctorAppointments />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;
