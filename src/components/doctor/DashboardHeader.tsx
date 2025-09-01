import { useQuery } from "@tanstack/react-query";
import { Clock, Calendar } from "lucide-react";
import { userAPI, appointmentAPI } from "@/services/api";
import { useMemo } from "react";

// Hooks for doctor dashboard header logic
export function useDoctorDashboardHeaderData() {
  // 1. Fetch doctor profile
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => userAPI.profile().then(res => res.data),
  });

  const doctorId = profile?.id;

  // 2. Fetch today's appointments assigned to this doctor
  const todayIso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: apptResult, isLoading: loadingAppointments } = useQuery({
    queryKey: ["doctorTodayAppointments", doctorId, todayIso],
    queryFn: () => appointmentAPI.getAppointments({
      staff_id: doctorId,
      from: todayIso,
      to: todayIso
    }).then(res => res.data.data),
    enabled: !!doctorId,
  });

  // 3. Compute seen/remaining/next appointment
  const headerStats = useMemo(() => {
    if (!apptResult || apptResult.length === 0) {
      return {
        seen: 0,
        remaining: 0,
        nextAppointment: undefined,
      };
    }
    const now = new Date();
    // Filter today's appointments, sort by time
    const sorted = [...apptResult].sort(
      (a, b) => `${a.appointment_date}T${a.appointment_time}`.localeCompare(`${b.appointment_date}T${b.appointment_time}`)
    );
    const completed = sorted.filter(appt => appt.status === "completed");
    const scheduled = sorted.filter(appt => appt.status === "scheduled");

    // Find the next scheduled (and not in the past)
    const next = scheduled.find(appt => {
      const apptTimestamp = new Date(`${appt.appointment_date}T${appt.appointment_time}`);
      return apptTimestamp > now;
    });

    let minutesUntil = undefined;
    if (next) {
      const apptTimestamp = new Date(`${next.appointment_date}T${next.appointment_time}`);
      minutesUntil = Math.max(0, Math.round((apptTimestamp.getTime() - now.getTime()) / 60000));
    }

    return {
      seen: completed.length,
      remaining: scheduled.length,
      nextAppointment: next
        ? {
            patientName: next.patient_id?.full_name || "Patient",
            time: `${next.appointment_time?.slice(0, 5)}`,
            minutesUntil: minutesUntil ?? 0,
          }
        : undefined,
    };
  }, [apptResult]);

  return {
    doctorName: profile?.full_name || "",
    todayStats: {
      seen: headerStats.seen,
      remaining: headerStats.remaining,
    },
    nextAppointment: headerStats.nextAppointment,
    loading: loadingProfile || loadingAppointments,
  };
}

// Usage in your component
export const DashboardHeader = () => {
  const { doctorName, nextAppointment, todayStats, loading } = useDoctorDashboardHeaderData();

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 mb-6">
        <div className="animate-pulse h-8 w-2/3 bg-muted rounded mb-2" />
        <div className="animate-pulse h-6 w-1/3 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 mb-6 fade-in-stagger">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-navy mb-2">
            Good morning, {doctorName}
          </h1>
          {nextAppointment && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Next appointment:{" "}
                <span className="font-medium text-foreground">{nextAppointment.patientName}</span>, {nextAppointment.time}
                <span className="text-secondary ml-2">
                  (In {nextAppointment.minutesUntil} mins)
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">{todayStats.seen}</div>
            <div className="text-sm text-muted-foreground">Patients seen</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{todayStats.remaining}</div>
            <div className="text-sm text-muted-foreground">Remaining</div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
          
          </div>
        </div>
      </div>
    </div>
  );
};
