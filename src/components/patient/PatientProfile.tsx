import { useState, useEffect } from "react";
import { User, Mail, Phone, Calendar, MapPin, AlertCircle, Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userAPI, patientAPI } from "@/services/api";

interface PatientProfileProps {
  userData: any;
}

const PatientProfile = ({ userData }: PatientProfileProps) => {
  const [patientData, setPatientData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const patientsResponse = await patientAPI.getAllPatients();
        const matchedPatient = patientsResponse.data.find(
          (p: any) => p.email === userData?.email
        );
        setPatientData(matchedPatient);
      } catch (error) {
        console.error("Error fetching patient data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      fetchPatientData();
    }
  }, [userData]);

  const handleSave = async () => {
    try {
      // Update patient data logic here
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            >
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={patientData?.full_name || userData?.full_name || ""}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={
                  patientData?.date_of_birth
                    ? new Date(patientData.date_of_birth).toISOString().split("T")[0]
                    : ""
                }
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                value={patientData?.gender || ""}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bloodType">Blood Type</Label>
              <Input
                id="bloodType"
                value={patientData?.blood_type || ""}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center mt-1">
                <Mail className="h-4 w-4 text-gray-500 mr-2" />
                <Input
                  id="email"
                  type="email"
                  value={patientData?.email || userData?.email || ""}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center mt-1">
                <Phone className="h-4 w-4 text-gray-500 mr-2" />
                <Input
                  id="phone"
                  type="tel"
                  value={patientData?.phone || ""}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <div className="flex items-center mt-1">
                <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                <Input
                  id="address"
                  value={patientData?.address || ""}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="emergencyName">Contact Name</Label>
              <Input
                id="emergencyName"
                value={patientData?.emergency_contact_name || ""}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Contact Phone</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={patientData?.emergency_contact_phone || ""}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Medical History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Medical Conditions</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                {patientData?.medical_history && patientData.medical_history.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {patientData.medical_history.map((condition: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700">
                        {condition}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No medical history recorded</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Allergies
              </Label>
              <div className="mt-2 p-4 bg-red-50 rounded-lg border border-red-200">
                {patientData?.allergies && patientData.allergies.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {patientData.allergies.map((allergy: string, index: number) => (
                      <li key={index} className="text-sm text-red-700 font-medium">
                        {allergy}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No known allergies</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center">
                <Pill className="h-4 w-4 mr-2" />
                Current Medications
              </Label>
              <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                {patientData?.current_medications &&
                patientData.current_medications.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {patientData.current_medications.map((medication: string, index: number) => (
                      <li key={index} className="text-sm text-blue-700">
                        {medication}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No current medications</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Healthcare Team */}
      {(patientData?.assigned_doctor || patientData?.assigned_nurse) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Healthcare Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patientData.assigned_doctor && (
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">
                      {patientData.assigned_doctor.full_name || "Doctor"}
                    </p>
                    <p className="text-sm text-gray-600">Primary Physician</p>
                  </div>
                </div>
              )}
              {patientData.assigned_nurse && (
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-green-700" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">
                      {patientData.assigned_nurse.full_name || "Nurse"}
                    </p>
                    <p className="text-sm text-gray-600">Assigned Nurse</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientProfile;
