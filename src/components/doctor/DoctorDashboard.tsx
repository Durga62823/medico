import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Menu, Users, Calendar, User, Bell, Zap, Bed, LogOut, Stethoscope, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DoctorPatientList from "./DoctorPatientList";
import DoctorAppointments from "./DoctorAppointments";
import Index from "@/pages/DoctorPages/Index";
import ActionsPage from "@/pages/DoctorPages/ActionsPage";
import InPatientsPage from "@/pages/DoctorPages/InPatientsPage";
import { motion, AnimatePresence } from 'framer-motion';
import { userAPI } from "@/services/api";
import { NotificationsCenter } from "./NotificationsCenter";
import {ShieldCheck, Cloud, Smartphone } from "lucide-react";
import PatientManagementDashboard from "@/components/doctor/PatientManagement";

// TABS data remains the same
const TABS = [
  { value: "dashboard", label: "Dashboard", icon: Users },
  { value: "patients", label: "Assigned Patients", icon: Users },
  { value: "appointments", label: "Appointments", icon: Calendar },
  { value: "preview", label: "Patient Preview", icon: User },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "actions", label: "Quick Actions", icon: Zap },
  { value: "in-patients", label: "In-patients", icon: Bed },
];

// New component for the mobile sidebar
const MobileSidebar = ({ sidebarCollapsed, setSidebarCollapsed, activeTab, setActiveTab, handleLogout }) => {
  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" }
  };

  return (
    <AnimatePresence>
      {sidebarCollapsed && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarCollapsed(false)}
          />
          <motion.div
            className="fixed top-0 left-0 h-full w-64 bg-card z-50 shadow-lg p-4 flex flex-col md:hidden"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ type: "tween", duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">MedAIron</h1>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <nav className="flex-1">
              <ul className="space-y-2">
                {TABS.map(({ value, label, icon: Icon }) => (
                  <li key={value}>
                    <Button
                      variant={activeTab === value ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        setActiveTab(value);
                        setSidebarCollapsed(false);
                      }}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {label}
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto border-t pt-4">
              <Button
                variant="destructive"
                className="w-full flex items-center"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const DoctorDashboard = () => {
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const alertsRef = useRef(null);
  const navigate = useNavigate();

  const { data: doctorProfile } = useQuery({
    queryKey: ["doctorProfile"],
    queryFn: async () => (await userAPI.profile()).data
  });

  useEffect(() => {
    // Socket.IO logic remains the same
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("token") || "" },
    });
    socket.on("connect", () => console.log("✅ WebSocket connected"));
    socket.on("appointment:updated", () => queryClient.invalidateQueries({ queryKey: ["doctorAppointments"] }));
    socket.on("patient:assigned", () => queryClient.invalidateQueries({ queryKey: ["assignedPatients"] }));
    socket.on("vital_alert", () => queryClient.invalidateQueries({ queryKey: ["doctorStats"] }));
    return () => socket.disconnect();
  }, [queryClient]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  return (
    <motion.div
      className="min-h-screen bg-background flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.header
        className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur p-4 flex justify-between items-center"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div
          className="flex items-center space-x-4"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">MedAIron</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">AI Healthcare Dashboard</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          className="flex items-center space-x-4"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* ... Rest of the header content (alerts button, logout) remains the same */}
          <div className="hidden sm:block text-right">
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-sm font-semibold">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
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
        </motion.div>
      </motion.header>

      {/* The new MobileSidebar component */}
      <MobileSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />
      
      <motion.main
        className="flex-1 w-full px-4 mt-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="shadow-card">
            <CardContent className="p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Horizontal tabs list for desktop, hidden on mobile */}
                <TabsList className="hidden md:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 w-full">
                  {TABS.map(({ value, label, icon: Icon }) => (
                    <motion.div
                      key={value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <TabsTrigger
                        value={value}
                        className="flex items-center justify-center md:justify-start px-4 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
                      >
                        <Icon className="h-4 w-4 mr-2" /> {label}
                      </TabsTrigger>
                    </motion.div>
                  ))}
                </TabsList>
                {/* ... TabsContent remains the same */}
                <motion.div
                  className="mt-6"
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="dashboard">
                    <Index />
                  </TabsContent>
                  <TabsContent value="patients">
                    <DoctorPatientList />
                  </TabsContent>
                  <TabsContent value="appointments">
                    <DoctorAppointments />
                  </TabsContent>
                  <TabsContent value="actions">
                    <ActionsPage />
                  </TabsContent>
                  <TabsContent value="in-patients">
                    <InPatientsPage />
                  </TabsContent>
                  <TabsContent value="notifications">
                    <NotificationsCenter />
                  </TabsContent>
                  <TabsContent value="preview">
                    <PatientManagementDashboard/>
                  </TabsContent>
                </motion.div>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>
      
      {/* ... Rest of the component (footer) remains the same */}
      <motion.footer
        className="bg-muted mt-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
      >
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r bg-primary rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">MedAIron</h3>
              </div>
              <p className="text-muted-foreground">
                AI Healthcare Dashboard
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <a href="https://github.com/Durga62823" target="_blank" rel="noopener noreferrer">About Us</a>
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    onClick={() => navigate('/register')}
                    className="p-0 h-auto text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Register
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    onClick={() => navigate('/login')}
                    className="p-0 h-auto text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Login
                  </Button>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Contact Info</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  Email: <a href="mailto:psivadurgaprasad88@gmail.com" className="hover:underline">psivadurgaprasad88@gmail.com</a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  Phone: +91 9030512334
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  Linkedin: <a href="https://www.linkedin.com/in/durga-prasad-peddapalli-1616a8297/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Durga Prasad Peddapalli</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} MedAIron. All rights reserved. Made with ❤️ for humanity.</p>
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default DoctorDashboard;