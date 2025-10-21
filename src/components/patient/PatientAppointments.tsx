import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Video, Phone, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { appointmentAPI, userAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

const PatientAppointments = () => {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await userAPI.profile();
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ["patient-appointments", userData?.id],
    queryFn: async () => {
      if (!userData?.id) return { data: [] };
      const response = await appointmentAPI.getAppointments({
        patient_id: userData.id,
      });
      return response.data;
    },
    enabled: !!userData?.id,
  });

  const appointments = appointmentsData?.data || [];

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      rescheduled: "bg-yellow-100 text-yellow-800",
    };
    return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      video: Video,
      phone: Phone,
      "in-person": MapPin,
    };
    const Icon = icons[type?.toLowerCase()] || MapPin;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status?.toLowerCase() === "scheduled" && new Date(apt.appointment_date) >= new Date()
  );

  const pastAppointments = appointments.filter(
    (apt) => apt.status?.toLowerCase() === "completed" || new Date(apt.appointment_date) < new Date()
  );

  return (
    <div className="space-y-6">
      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {appointment.staff_id?.full_name || "Doctor"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {appointment.appointment_type || "Consultation"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {appointment.appointment_time || "N/A"}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          {getTypeIcon(appointment.appointment_type)}
                          <span className="ml-2 capitalize">
                            {appointment.appointment_type || "In-person"}
                          </span>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status || "Scheduled"}
                        </Badge>
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-3 p-2 bg-gray-50 rounded">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <Button size="sm" variant="outline">
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Past Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastAppointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No past appointments</p>
          ) : (
            <div className="space-y-3">
              {pastAppointments.slice(0, 5).map((appointment) => (
                <div
                  key={appointment._id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {appointment.staff_id?.full_name || "Doctor"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.appointment_date).toLocaleDateString()} -{" "}
                        {appointment.appointment_time || "N/A"}
                      </p>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status || "Completed"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientAppointments;
