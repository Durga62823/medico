import React, { useState, useEffect, useRef } from "react";
import { HeartPulse, Menu, Users, User, Bell, Zap, Bed, LogOut, Smartphone, X,} from "lucide-react";
import NursePatientList from "./NursePatientList";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PatientManagementDashboard from "./PatientManagement";
import { userAPI } from "@/services/api";
import { NotificationsCenter } from "./NotificationCenter";
import Index from "@/pages/NursePages/Index";
import { QuickActions } from "./QuickActions";
import {Vitals} from "./Vitals";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { io } from "socket.io-client";
import InPatientsPage from "./InPatientsPage";

const Tabs = ({ value, onValueChange, className, children }) => (
  <div className={className}>{children}</div>
);
const TabsList = ({ className = "", children }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground ${className}`}>{children}</div>
);
const TabsTrigger = ({ value, className = "", children, ...props }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ${className}`}
    data-state={props.value === value ? "active" : "inactive"}
    {...props}
  >
    {children}
  </button>
);
const TabsContent = ({ value, children, ...props }) => (
  <div data-state={props.activeTab === value ? "active" : "inactive"} className={props.activeTab === value ? "" : "hidden"} {...props}>
    {children}
  </div>
);




// --- TABS DATA FOR NURSE ---
const TABS = [
  { value: "dashboard", label: "Dashboard", icon: Users },
  { value: "my-patients", label: "Assigned Patients", icon: Bed },
  { value: "vitals-tasks", label: "Vitals", icon: HeartPulse },
  { value: "preview", label: "Patient Preview", icon: User },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "actions", label: "Quick Actions", icon: Zap },
  { value: "inpatients", label: "In-patients", icon: Smartphone },
];

// --- MobileSidebar Component ---
const MobileSidebar = ({ sidebarCollapsed, setSidebarCollapsed, activeTab, setActiveTab, handleLogout }) => {
  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" }
  };

  return (
    <AnimatePresence>
      {sidebarCollapsed && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarCollapsed(false)}
          />
          {/* Sidebar */}
          <motion.div
            className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 z-50 shadow-2xl p-4 flex flex-col md:hidden"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ type: "tween", duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-red-600 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">MedIron</h1>
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
                className="w-full flex items-center bg-red-600 hover:bg-red-700"
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

// --- NurseDashboard Main Component ---
const NurseDashboard = () => {
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const alertsRef = useRef(null);
  const navigate = useNavigate();

  const { data: nurseProfile } = useQuery({
    queryKey: ["nurseProfile"],
    queryFn: async () => (await userAPI.profile()).data
  });

  // Mock useEffect logic for Socket.IO and authentication
  useEffect(() => {
    // FIX: Hardcoded URL to avoid import.meta.env warning.
    const socketUrl = "http://localhost:5000"; 
    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem("token") || "" },
    });
    console.log("Starting WebSocket connection...");
    socket.on("connect", () => console.log("✅ WebSocket Connected"));
    socket.on("task:updated", () => queryClient.invalidateQueries({ queryKey: ["nurseTasks"] }));
    socket.on("patient:vitals:alert", () => queryClient.invalidateQueries({ queryKey: ["nurseStats"] }));
    return () => socket.disconnect();
  }, [queryClient]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.header
        className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900/90 backdrop-blur p-4 flex justify-between items-center shadow-md"
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
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-red-600 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">MedIron</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Nurse & Task Management</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex items-center space-x-4"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="hidden sm:block text-right">
      
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
              setActiveTab("notifications");
              setTimeout(() => alertsRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
            }}
          >
            <Bell className="h-4 w-4 mr-2 text-yellow-500" /> Alerts
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="flex items-center bg-red-600 hover:bg-red-700"
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </motion.div>
      </motion.header>

      {/* Mobile Sidebar */}
      <MobileSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />

      <motion.main
        className="flex-1 w-full p-4 lg:p-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="shadow-2xl border-2 border-primary/10">
            <CardContent className="p-4 lg:p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Horizontal tabs list for desktop, hidden on mobile */}
                <TabsList className="hidden md:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 w-full bg-gray-100 dark:bg-gray-800 p-2 rounded-xl">
                  {TABS.map(({ value, label, icon: Icon }) => (
                    <motion.div
                      key={value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <TabsTrigger
                        value={value}
                        onClick={() => setActiveTab(value)}
                        className={`flex items-center justify-center md:justify-start px-4 py-2 text-sm font-medium transition-all duration-200 ${
                          activeTab === value ? "bg-primary text-white shadow-lg shadow-primary/30" : "hover:bg-accent/50"
                        } rounded-lg`}
                      >
                        <Icon className="h-4 w-4 mr-2" /> {label}
                      </TabsTrigger>
                    </motion.div>
                  ))}
                </TabsList>

                {/* TabsContent container */}
                <motion.div
                  className="mt-6"
                  key={activeTab}
                  activeTab={activeTab} // Passing activeTab for the mock TabsContent
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="dashboard" activeTab={activeTab}>
                    <Index />
                  </TabsContent>
                  <TabsContent value="my-patients" activeTab={activeTab}>
                    <NursePatientList />
                  </TabsContent>
                          <TabsContent value="vitals-tasks" activeTab={activeTab}>
                            <Vitals />
                          </TabsContent>
                  <TabsContent value="actions" activeTab={activeTab}>
                    <QuickActions />
                  </TabsContent>
                  <TabsContent value="inpatients" activeTab={activeTab}>
                    <InPatientsPage />
                  </TabsContent>
                  <TabsContent value="notifications" activeTab={activeTab}>
                    <NotificationsCenter />
                  </TabsContent>
                  <TabsContent value="preview" activeTab={activeTab}>
                    <PatientManagementDashboard/>
                  </TabsContent>
                </motion.div>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>


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
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-600 rounded-lg flex items-center justify-center">
                  <HeartPulse className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">MedIron</h3>
              </div>
              <p className="text-muted-foreground">
                Compassionate Care. Intelligent Management.
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
              <h3 className="text-xl font-bold text-foreground">Contact Information</h3>
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
                  LinkedIn: <a href="https://www.linkedin.com/in/durga-prasad-peddapalli-1616a8297/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Durga Prasad Peddapalli</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} MedIron. All rights reserved. Made with ❤️ for humanity.</p>
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default NurseDashboard;

// function NurseDashboard() {
//   return (
//     <div>
//     {/* <Alerts/> */}
   
//     </div>
//   );
// }

// export default NurseDashboard;
