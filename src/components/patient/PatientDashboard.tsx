import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  FileText, 
  DollarSign, 
  Activity, 
  Bell, 
  User, 
  LogOut,
  Menu,
  X,
  HeartPulse,
  ClipboardList,
  CreditCard,
  TestTube2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { userAPI } from "@/services/api";
import PatientAppointments from "./PatientAppointments";
import PatientVitals from "./PatientVitals";
import PatientBilling from "./PatientBilling";
import PatientLabReports from "./PatientLabReports";
import PatientProfile from "./PatientProfile";

const TABS = [
  { value: "overview", label: "Overview", icon: Activity },
  { value: "appointments", label: "Appointments", icon: Calendar },
  { value: "vitals", label: "My Vitals", icon: HeartPulse },
  { value: "lab-reports", label: "Lab Reports", icon: TestTube2 },
  { value: "billing", label: "Billing", icon: DollarSign },
  { value: "profile", label: "Profile", icon: User },
];

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await userAPI.profile();
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-solid mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 z-50 shadow-2xl p-4 flex flex-col lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <HeartPulse className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl font-bold">MedIron</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SidebarContent 
                activeTab={activeTab} 
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setSidebarOpen(false);
                }} 
                handleLogout={handleLogout}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white dark:bg-gray-900 shadow-xl flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">MedIron</h1>
              <p className="text-xs text-gray-500">Patient Portal</p>
            </div>
          </div>
        </div>
        <SidebarContent 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          handleLogout={handleLogout}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {TABS.find(tab => tab.value === activeTab)?.label || "Dashboard"}
                </h2>
                <p className="text-sm text-gray-500">
                  Welcome back, {userData?.full_name || "Patient"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && <OverviewTab userData={userData} />}
          {activeTab === "appointments" && <PatientAppointments />}
          {activeTab === "vitals" && <PatientVitals />}
          {activeTab === "lab-reports" && <PatientLabReports />}
          {activeTab === "billing" && <PatientBilling />}
          {activeTab === "profile" && <PatientProfile userData={userData} />}
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ activeTab, setActiveTab, handleLogout }) => (
  <>
    <nav className="flex-1 p-4">
      <ul className="space-y-2">
        {TABS.map(({ value, label, icon: Icon }) => (
          <li key={value}>
            <Button
              variant={activeTab === value ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab(value)}
            >
              <Icon className="h-5 w-5 mr-3" />
              {label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <Button
        variant="ghost"
        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5 mr-3" />
        Logout
      </Button>
    </div>
  </>
);

const OverviewTab = ({ userData }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-blue-100 mt-1">Next: Tomorrow, 10:00 AM</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <TestTube2 className="h-4 w-4 mr-2" />
              Lab Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <p className="text-xs text-green-100 mt-1">2 pending results</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Outstanding Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$240</div>
            <p className="text-xs text-purple-100 mt-1">1 pending payment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <HeartPulse className="h-4 w-4 mr-2" />
              Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Good</div>
            <p className="text-xs text-orange-100 mt-1">Last check: 2 days ago</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Dr. Sarah Johnson</p>
                  <p className="text-sm text-gray-600">General Checkup</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Oct 20, 2025</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">Dr. Michael Chen</p>
                  <p className="text-sm text-gray-600">Follow-up</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Oct 22, 2025</p>
                  <p className="text-xs text-green-600">Upcoming</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Blood Pressure</span>
                <span className="font-medium">120/80 mmHg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Heart Rate</span>
                <span className="font-medium">72 bpm</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Temperature</span>
                <span className="font-medium">98.6°F</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Weight</span>
                <span className="font-medium">165 lbs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Current Medications</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Lisinopril 10mg - Once daily</li>
                <li>Metformin 500mg - Twice daily</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Known Allergies</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Penicillin</li>
                <li>Peanuts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboard;
