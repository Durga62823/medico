import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  Activity, 
  Clock,
  CheckCircle,
  UserCheck,
  AlertTriangle,
  Calendar,
  Thermometer
} from "lucide-react";

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  condition: string;
  status: 'stable' | 'critical' | 'improving' | 'discharged';
  admissionDate: string;
  room: string;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSat: number;
  };
  avatar?: string;
}

const DoctorPatientList = () => {
  // const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 1,
      name: "Emily Rodriguez",
      age: 45,
      gender: "Female",
      condition: "Pneumonia",
      status: "improving",
      admissionDate: "2024-01-15",
      room: "A-204",
      vitals: {
        heartRate: 78,
        bloodPressure: "120/80",
        temperature: 99.2,
        oxygenSat: 96
      }
    },
    {
      id: 2,
      name: "Michael Chen",
      age: 62,
      gender: "Male",
      condition: "Heart Surgery Recovery",
      status: "stable",
      admissionDate: "2024-01-12",
      room: "B-301",
      vitals: {
        heartRate: 65,
        bloodPressure: "110/70",
        temperature: 98.6,
        oxygenSat: 98
      }
    },
    {
      id: 3,
      name: "Sarah Thompson",
      age: 29,
      gender: "Female",
      condition: "Appendectomy",
      status: "critical",
      admissionDate: "2024-01-16",
      room: "C-105",
      vitals: {
        heartRate: 105,
        bloodPressure: "140/90",
        temperature: 101.4,
        oxygenSat: 94
      }
    },
    {
      id: 4,
      name: "David Wilson",
      age: 55,
      gender: "Male",
      condition: "Diabetes Management",
      status: "stable",
      admissionDate: "2024-01-10",
      room: "A-108",
      vitals: {
        heartRate: 72,
        bloodPressure: "125/75",
        temperature: 98.4,
        oxygenSat: 97
      }
    }
  ]);

  const getStatusColor = (status: Patient['status']) => {
    switch (status) {
      case 'critical': return 'bg-warning text-warning-foreground';
      case 'stable': return 'bg-info text-info-foreground';
      case 'improving': return 'bg-success text-success-foreground';
      case 'discharged': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: Patient['status']) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="h-3 w-3" />;
      case 'stable': return <Activity className="h-3 w-3" />;
      case 'improving': return <CheckCircle className="h-3 w-3" />;
      case 'discharged': return <UserCheck className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const handleDischarge = (patientId: number, patientName: string) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
    // toast({
    //   title: "Patient Discharged",
    //   description: `${patientName} has been successfully discharged.`,
    //   variant: "default",
    // });
  };

  const scheduleVisit = (patientName: string) => {
    // toast({
    //   title: "Visit Scheduled",
    //   description: `Next visit scheduled for ${patientName} at 2:00 PM today.`,
    //   variant: "default",
    // });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Current Patients</h3>
        <Badge variant="secondary" className="text-sm">
          {patients.length} Active
        </Badge>
      </div>

      <div className="grid gap-4">
        {patients.map((patient) => (
          <Card key={patient.id} className="shadow-medical border-0 transition-all hover:shadow-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between space-x-4">
                {/* Patient Info */}
                <div className="flex items-start space-x-4 flex-1">
                  <Avatar className="h-12 w-12 border-2 border-muted">
                    <AvatarImage src={patient.avatar} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-foreground">{patient.name}</h4>
                      <Badge className={`text-xs ${getStatusColor(patient.status)}`}>
                        {getStatusIcon(patient.status)}
                        <span className="ml-1 capitalize">{patient.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p><span className="font-medium">Age:</span> {patient.age} • {patient.gender}</p>
                        <p><span className="font-medium">Room:</span> {patient.room}</p>
                        <p><span className="font-medium">Condition:</span> {patient.condition}</p>
                      </div>
                      <div>
                        <p className="flex items-center space-x-2">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span>{patient.vitals.heartRate} BPM</span>
                        </p>
                        <p className="flex items-center space-x-2">
                          <Activity className="h-3 w-3 text-blue-500" />
                          <span>{patient.vitals.bloodPressure}</span>
                        </p>
                        <p className="flex items-center space-x-2">
                          <Thermometer className="h-3 w-3 text-orange-500" />
                          <span>{patient.vitals.temperature}°F</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => scheduleVisit(patient.name)}
                    className="border-primary/20 text-primary hover:bg-primary/5"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Visit
                  </Button>
                  
                  {patient.status !== 'discharged' && patient.status !== 'critical' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-success/20 text-success hover:bg-success/5"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Discharge
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Discharge Patient</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to discharge {patient.name}? This action will remove them from your active patient list.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDischarge(patient.id, patient.name)}
                            className="bg-success hover:bg-success/90"
                          >
                            Confirm Discharge
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DoctorPatientList;