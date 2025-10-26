import { Bed, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { allocationApi } from "../../services/api";
import { useQuery } from "@tanstack/react-query";

// Animation variants
const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const patientItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Type definitions
interface Allocation {
  _id: string;
  id: string;
  patient: {
    _id: string;
    full_name: string;
  };
  name: string;
  room: string;
  department: string;
  status: "stable" | "critical" | "monitoring" | "improving";
  day: number;
  primaryDiagnosis: string;
  admission_date?: string;
  discharged: boolean;
}

// Style mappings
const conditionStyles = {
  stable: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  monitoring: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  improving: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

// JWT helpers
function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  return decodeJwt(raw);
}

export const InPatientSnapshot = () => {
  const user = getStoredUser();
  const DoctorId = user?.id || "";

  // 🔹 Fetch patient allocations for doctor
  const { data: allocations = [], isLoading: isLoadingAllocations } =
    useQuery<Allocation[]>({
      queryKey: ["doctorAllocations", DoctorId],
      queryFn: async () => {
        if (!DoctorId) return [];
        const res = await allocationApi.get();
        return Array.isArray(res) ? res : [];
      },
      enabled: !!DoctorId,
    });

  // 🔹 Loading state
  if (isLoadingAllocations) {
    return (
      <div className="text-center text-muted-foreground py-6">
        Loading admitted patients...
      </div>
    );
  }

  return (
    <motion.div
      className="rounded-xl border bg-card shadow-sm p-6"
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Bed className="h-5 w-5 text-blue-500" />
        My Admitted Patients
      </h3>

      {allocations.length === 0 ? (
        <motion.div
          className="text-center text-muted-foreground py-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          No admitted patients found
        </motion.div>
      ) : 
      
      (
        
        <div className="space-y-3">
          {allocations.map((allocation) => (
            
            <motion.div
              key={allocation._id || allocation.id}
              variants={patientItemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="p-3 rounded-lg border border-border hover:border-secondary/50 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{allocation.name}</span>
                <Badge
                  variant="outline"
                  className={`border ${
                    conditionStyles[
                      allocation.status as keyof typeof conditionStyles
                    ] || "bg-muted/50 text-muted-foreground border-border"
                  }`}
                >
                  {allocation.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  Room {allocation.room}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Day {allocation.day}
                </span>
              </div>
              {allocation.primaryDiagnosis && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {allocation.primaryDiagnosis}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
