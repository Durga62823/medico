import React, { useState, useEffect } from "react";
import { Activity, Heart, Thermometer, Weight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { vitalAPI, userAPI, patientAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

const PatientVitals = () => {
  const [userData, setUserData] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await userAPI.profile();
        setUserData(userResponse.data);
        
        // Since patient dashboard is for users with role 'patient', 
        // we need to find the patient record associated with this user
        // This might require backend modification to link user to patient
        // For now, we'll use a mock patient ID or the user's email to find patient
        const patientsResponse = await patientAPI.getAllPatients();
        const matchedPatient = patientsResponse.data.find(
          (p: any) => p.email === userResponse.data.email
        );
        setPatientData(matchedPatient);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const { data: vitalsData, isLoading } = useQuery({
    queryKey: ["patient-vitals", patientData?._id],
    queryFn: async () => {
      if (!patientData?._id) return [];
      const response = await vitalAPI.getVitals(patientData._id);
      return response.data;
    },
    enabled: !!patientData?._id,
  });

  const vitals = vitalsData || [];
  const latestVitals = vitals[vitals.length - 1] || {};

  // Prepare chart data
  const chartData = vitals.slice(-7).map((vital: any) => ({
    date: new Date(vital.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bloodPressure: parseInt(vital.blood_pressure?.split('/')[0]) || 0,
    heartRate: vital.heart_rate || 0,
    temperature: parseFloat(vital.temperature) || 0,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  const vitalCards = [
    {
      title: "Blood Pressure",
      value: latestVitals.blood_pressure || "N/A",
      unit: "mmHg",
      icon: Activity,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Heart Rate",
      value: latestVitals.heart_rate || "N/A",
      unit: "bpm",
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "Temperature",
      value: latestVitals.temperature || "N/A",
      unit: "°F",
      icon: Thermometer,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Weight",
      value: latestVitals.weight || "N/A",
      unit: "lbs",
      icon: Weight,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current Vitals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vitalCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
                <p className="text-2xl font-bold">
                  {card.value}
                  {card.value !== "N/A" && (
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      {card.unit}
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Vital Signs Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vital Signs Trend (Last 7 Readings)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="bloodPressure"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Systolic BP"
                  />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    stroke="#ec4899"
                    strokeWidth={2}
                    name="Heart Rate"
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#f97316"
                    strokeWidth={2}
                    name="Temperature"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vitals History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          {vitals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No vital signs recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Blood Pressure</th>
                    <th className="text-left py-3 px-4">Heart Rate</th>
                    <th className="text-left py-3 px-4">Temperature</th>
                    <th className="text-left py-3 px-4">Weight</th>
                    <th className="text-left py-3 px-4">Oxygen Level</th>
                  </tr>
                </thead>
                <tbody>
                  {vitals.slice(-10).reverse().map((vital: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(vital.recorded_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">{vital.blood_pressure || "N/A"}</td>
                      <td className="py-3 px-4">
                        {vital.heart_rate ? `${vital.heart_rate} bpm` : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {vital.temperature ? `${vital.temperature}°F` : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {vital.weight ? `${vital.weight} lbs` : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {vital.oxygen_level ? `${vital.oxygen_level}%` : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientVitals;
