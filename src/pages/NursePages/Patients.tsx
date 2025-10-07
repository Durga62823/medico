import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, User, Heart, Thermometer, Wind, MapPin } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  room: string;
  status: "stable" | "warning" | "critical";
  condition: string;
  admittedDate: string;
  vitals: {
    heartRate: number;
    temperature: number;
    oxygenSat: number;
  };
}

const mockPatients: Patient[] = [
  {
    id: "1",
    name: "John Evans",
    age: 67,
    room: "504",
    status: "critical",
    condition: "Post-operative care",
    admittedDate: "2025-09-25",
    vitals: { heartRate: 92, temperature: 99.2, oxygenSat: 96 }
  },
  {
    id: "2",
    name: "Sarah Li",
    age: 42,
    room: "501",
    status: "warning",
    condition: "Pneumonia recovery",
    admittedDate: "2025-09-27",
    vitals: { heartRate: 78, temperature: 98.9, oxygenSat: 97 }
  },
  {
    id: "3",
    name: "Michael Johnson",
    age: 55,
    room: "503",
    status: "stable",
    condition: "Diabetes management",
    admittedDate: "2025-09-28",
    vitals: { heartRate: 72, temperature: 98.6, oxygenSat: 99 }
  },
  {
    id: "4",
    name: "Emily Chen",
    age: 38,
    room: "502",
    status: "stable",
    condition: "General checkup",
    admittedDate: "2025-09-29",
    vitals: { heartRate: 68, temperature: 98.4, oxygenSat: 98 }
  },
];

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: Patient["status"]) => {
    switch (status) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      case "stable":
        return "bg-success text-success-foreground";
    }
  };

  const getStatusBorder = (status: Patient["status"]) => {
    switch (status) {
      case "critical":
        return "border-l-4 border-destructive";
      case "warning":
        return "border-l-4 border-warning";
      case "stable":
        return "border-l-4 border-success";
    }
  };

  const filteredPatients = mockPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.room.includes(searchTerm)
  );

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Patient Management</h1>
          <p className="text-muted-foreground">Monitor and manage patient records</p>
        </div>

        {/* Search and Actions */}
        <div className="flex gap-4 mb-6 animate-fade-in">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name or room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Patient
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="animate-fade-in">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Total Patients</p>
                <p className="text-3xl font-bold">{mockPatients.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Stable</p>
                <p className="text-3xl font-bold text-success">
                  {mockPatients.filter(p => p.status === "stable").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Warning</p>
                <p className="text-3xl font-bold text-warning">
                  {mockPatients.filter(p => p.status === "warning").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Critical</p>
                <p className="text-3xl font-bold text-destructive">
                  {mockPatients.filter(p => p.status === "critical").length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className={`hover:shadow-lg transition-all duration-200 animate-fade-in ${getStatusBorder(patient.status)}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{patient.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>Age: {patient.age}</span>
                        <span>•</span>
                        <MapPin className="w-3 h-3" />
                        <span>Room {patient.room}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(patient.status)}>
                    {patient.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Condition</p>
                    <p className="font-medium">{patient.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Admitted</p>
                    <p className="font-medium">{new Date(patient.admittedDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Current Vitals</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-success" />
                      <div>
                        <p className="text-xs text-muted-foreground">Heart Rate</p>
                        <p className="font-medium">{patient.vitals.heartRate} BPM</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-warning" />
                      <div>
                        <p className="text-xs text-muted-foreground">Temperature</p>
                        <p className="font-medium">{patient.vitals.temperature} °F</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-info" />
                      <div>
                        <p className="text-xs text-muted-foreground">O2 Sat</p>
                        <p className="font-medium">{patient.vitals.oxygenSat}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Patients;