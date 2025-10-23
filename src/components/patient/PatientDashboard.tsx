import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, Activity, Bell, User, LogOut, Heart, Home, TestTube2, ClipboardList, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userAPI, patientAPI, appointmentAPI, labReportAPI, billingAPI, vitalAPI } from "@/services/api";
import PatientAppointments from "./PatientAppointments";
import PatientVitals from "./PatientVitals";
import PatientBilling from "./PatientBilling";
import PatientLabReports from "./PatientLabReports";
import PatientProfile from "./PatientProfile";

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [patientData, setPatientData] = useState<any>(null);

  const { data: userProfile, isLoading: loading } = useQuery<UserData>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await userAPI.profile();
      return res.data;
    },
  });

  useEffect(() => {
    if (userProfile) {
      setUserData(userProfile);
      fetchPatientData(userProfile.email);
    }
  }, [userProfile]);

  const fetchPatientData = async (email: string) => {
    try {
      const patientsResponse = await patientAPI.getAllPatients();
      const matchedPatient = patientsResponse.data.find((p: any) => p.email === email);
      setPatientData(matchedPatient);
    } catch (error) {
      console.error("Error fetching patient data:", error);
    }
  };

  const { data: appointmentsData } = useQuery({
    queryKey: ["patient-appointments-stats", patientData?._id],
    queryFn: async () => {
      if (!patientData?._id) return { data: [] };
      const response = await appointmentAPI.getAppointments({ patient_id: patientData._id });
      return response.data;
    },
    enabled: !!patientData?._id,
  });

  const { data: labReportsData } = useQuery({
    queryKey: ["patient-lab-stats", patientData?._id],
    queryFn: async () => {
      if (!patientData?._id) return [];
      const response = await labReportAPI.getLabReports({ patient_id: patientData._id });
      return response.data;
    },
    enabled: !!patientData?._id,
  });

  const { data: billingsData } = useQuery({
    queryKey: ["patient-billing-stats", patientData?._id],
    queryFn: async () => {
      if (!patientData?._id) return [];
      const response = await billingAPI.getBillingsForPatient(patientData._id);
      return response.data;
    },
    enabled: !!patientData?._id,
  });

  const { data: vitalsData } = useQuery({
    queryKey: ["patient-vitals-stats", patientData?._id],
    queryFn: async () => {
      if (!patientData?._id) return [];
      const response = await vitalAPI.getVitals(patientData._id);
      return response.data;
    },
    enabled: !!patientData?._id,
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  const appointments = appointmentsData?.data || [];
  const upcomingAppointments = appointments.filter((apt: any) => apt.status?.toLowerCase() === "scheduled" && new Date(apt.appointment_date) >= new Date());
  const labReports = labReportsData || [];
  const pendingLabReports = labReports.filter((r: any) => r.status?.toLowerCase() !== "completed");
  const billings = billingsData || [];
  const outstandingBills = billings.filter((b: any) => b.status?.toLowerCase() !== "paid");
  const totalOutstanding = outstandingBills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
  const vitals = vitalsData || [];
  const latestVitals = vitals[vitals.length - 1] || {};

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">MedAIron</h1>
                <p className="text-xs text-muted-foreground">Patient Portal</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="hidden sm:inline-flex">{userData?.full_name || "Patient"}</Badge>
            <Button variant="outline" size="sm"><Bell className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Notifications</span></Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Logout</span></Button>
          </div>
        </div>
      </header>
      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-nowrap overflow-x-auto space-x-2 w-full px-2">
            <TabsTrigger value="overview" className="flex items-center space-x-2 whitespace-nowrap"><Home className="w-4 h-4" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center space-x-2 whitespace-nowrap"><Calendar className="w-4 h-4" /><span className="hidden sm:inline">Appointments</span></TabsTrigger>
            <TabsTrigger value="vitals" className="flex items-center space-x-2 whitespace-nowrap"><HeartPulse className="w-4 h-4" /><span className="hidden sm:inline">My Vitals</span></TabsTrigger>
            <TabsTrigger value="lab-reports" className="flex items-center space-x-2 whitespace-nowrap"><TestTube2 className="w-4 h-4" /><span className="hidden sm:inline">Lab Reports</span></TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center space-x-2 whitespace-nowrap"><DollarSign className="w-4 h-4" /><span className="hidden sm:inline">Billing</span></TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2 whitespace-nowrap"><User className="w-4 h-4" /><span className="hidden sm:inline">Profile</span></TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{upcomingAppointments.length}</div><p className="text-xs text-muted-foreground">{upcomingAppointments.length > 0 ? "Next appointment scheduled" : "No upcoming appointments"}</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Lab Reports</CardTitle><TestTube2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{labReports.length}</div><p className="text-xs text-muted-foreground">{pendingLabReports.length} pending results</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Outstanding Bills</CardTitle><DollarSign className="h-4 w-4 text-vital-critical" /></CardHeader><CardContent><div className="text-2xl font-bold text-vital-critical">${totalOutstanding.toFixed(2)}</div><p className="text-xs text-muted-foreground">{outstandingBills.length} {outstandingBills.length === 1 ? "bill" : "bills"} pending</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Health Status</CardTitle><Activity className="h-4 w-4 text-vital-normal" /></CardHeader><CardContent><div className="text-2xl font-bold text-vital-normal">Good</div><p className="text-xs text-muted-foreground">{vitals.length > 0 ? "Recent vitals recorded" : "No recent vitals"}</p></CardContent></Card></div></TabsContent>
          <TabsContent value="appointments" className="space-y-6"><PatientAppointments /></TabsContent>
          <TabsContent value="vitals" className="space-y-6"><PatientVitals /></TabsContent>
          <TabsContent value="lab-reports" className="space-y-6"><PatientLabReports /></TabsContent>
          <TabsContent value="billing" className="space-y-6"><PatientBilling /></TabsContent>
          <TabsContent value="profile" className="space-y-6"><PatientProfile userData={userData} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientDashboard;
