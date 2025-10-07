import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import  Dashboard  from "@/components/Dashboard";
import DoctorDashboard from "@/components/doctor/DoctorDashboard";
import { userAPI } from "@/services/api";
// import { PatientPreview } from "@/components/doctor/PatientPreview";
// import { AppointmentTimeline } from "@/components/doctor/AppointmentTimeline";
// import { PatientPreview } from "@/components/doctor/PatientPreview";
import NurseDashboard from "@/components/nurse/NurseDashboard";

const safeJSONParse = (value: string | null) => {
  if (!value || value === "undefined" || value === "null") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const Index = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const [selectedPatient, setSelectedPatient] = useState("68a2ca62fe11a3ad9d1ecb99");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      navigate("/auth");
      return;
    }
    setToken(storedToken);

    const fetchUserRole = async () => {
      try {
        const localUser = safeJSONParse(localStorage.getItem("user"));
        if (localUser?.role) {
          setRole(localUser.role);
        } else {
          const response = await userAPI.profile();
          if (response.data?.role) {
            setRole(response.data.role);
            localStorage.setItem("user", JSON.stringify(response.data));
          } else {
            throw new Error("No role found");
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setRole(null);
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-primary/10 via-background to-medical-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-medical-primary border-solid mx-auto"></div>
          <p className="mt-4 text-medical-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) return null;
  if (role === "doctor") 
     return <DoctorDashboard /> 
  else if (role === "admin") {
    return <Dashboard onLogout={handleLogout} />; } 
  else if (role === "nurse") { 
    return <NurseDashboard/>; } 
  else {
    return <div>Unauthorized Access</div>; 
} };

export default Index;