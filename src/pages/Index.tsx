import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dashboard } from "@/components/Dashboard";

// Using token from localStorage instead of a custom session object

const Index = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch token and user data (e.g. from localStorage or API)
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      navigate("/auth"); // Redirect to login if no auth
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("session"); // legacy cleanup
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-primary/10 via-background to-medical-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-medical-primary mx-auto"></div>
          <p className="mt-4 text-medical-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null; 
  }

  return <Dashboard onLogout={handleLogout} />;
};

export default Index;
