import { useState } from "react";
import { 
  Bed, 
  Activity, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Users,
  Heart,
  Thermometer,
  BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { InPatientSnapshot } from "@/components/doctor/InPatientSnapshot";
import { motion } from "framer-motion";

interface DetailedInPatient {
  id: string;
  name: string;
  room: string;
  admissionDay: number;
  condition: 'stable' | 'monitoring' | 'improving' | 'critical';
  department: string;
  diagnosis: string;
  vitals: {
    bloodPressure: string;
    heartRate: number;
    temperature: string;
    respiratoryRate: number;
    oxygenSaturation: number;
  };
  alerts: string[];
  lastUpdate: string;
}

const mockDetailedPatients: DetailedInPatient[] = [
  {
    id: '1',
    name: 'Robert Johnson',
    room: '302A',
    admissionDay: 3,
    condition: 'stable',
    department: 'Cardiology',
    diagnosis: 'Acute Myocardial Infarction',
    vitals: { bloodPressure: '128/82', heartRate: 72, temperature: '98.6°F', respiratoryRate: 16, oxygenSaturation: 97 },
    alerts: [],
    lastUpdate: '2 hours ago'
  },
  {
    id: '2',
    name: 'Maria Santos',
    room: '418B',
    admissionDay: 1,
    condition: 'monitoring',
    department: 'ICU',
    diagnosis: 'Post-operative Complications',
    vitals: { bloodPressure: '142/88', heartRate: 88, temperature: '99.2°F', respiratoryRate: 20, oxygenSaturation: 94 },
    alerts: ['Elevated Temperature', 'Low O₂ Saturation'],
    lastUpdate: '30 min ago'
  },
  {
    id: '3',
    name: 'David Park',
    room: '205C',
    admissionDay: 7,
    condition: 'improving',
    department: 'Orthopedics',
    diagnosis: 'Hip Fracture Repair',
    vitals: { bloodPressure: '118/76', heartRate: 68, temperature: '98.4°F', respiratoryRate: 14, oxygenSaturation: 99 },
    alerts: [],
    lastUpdate: '1 hour ago'
  },
  {
    id: '4',
    name: 'Elizabeth Taylor',
    room: '156A',
    admissionDay: 2,
    condition: 'critical',
    department: 'ICU',
    diagnosis: 'Septic Shock',
    vitals: { bloodPressure: '85/52', heartRate: 125, temperature: '102.1°F', respiratoryRate: 28, oxygenSaturation: 89 },
    alerts: ['Hypotension', 'Tachycardia', 'High Fever', 'Low O₂'],
    lastUpdate: '15 min ago'
  }
];

const conditionColors = {
  stable: "bg-green-100 text-green-700",
  monitoring: "bg-yellow-100 text-yellow-700",
  improving: "bg-blue-100 text-blue-700",
  critical: "bg-red-100 text-red-700"
};

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const statItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const patientCardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

export default function InPatientsPage() {
  const totalPatients = mockDetailedPatients.length;
  const criticalCount = mockDetailedPatients.filter(p => p.condition === 'critical').length;
  const stableCount = mockDetailedPatients.filter(p => p.condition === 'stable').length;
  const totalAlerts = mockDetailedPatients.reduce((sum, p) => sum + p.alerts.length, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <motion.div 
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-3xl">In-Patient Management</CardTitle>
                <CardDescription>
                  Monitor and manage admitted patients across all departments
                </CardDescription>
              </div>
              <div className="bg-primary rounded-full p-3">
                <Bed className="h-8 w-8 text-white" />
              </div>
            </CardHeader>

            {/* Overview Stats */}
            <CardContent>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <motion.div variants={statItemVariants}>
                  <Card className="p-4 flex flex-row justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Patients</p>
                      <p className="text-2xl font-bold">{totalPatients}</p>
                    </div>
                    <Users className="h-6 w-6 text-primary" />
                  </Card>
                </motion.div>
                <motion.div variants={statItemVariants}>
                  <Card className="p-4 flex flex-row justify-between items-center border-l-4 border-red-500">
                    <div>
                      <p className="text-sm text-muted-foreground">Critical</p>
                      <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </Card>
                </motion.div>
                <motion.div variants={statItemVariants}>
                  <Card className="p-4 flex flex-row justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Stable</p>
                      <p className="text-2xl font-bold text-green-600">{stableCount}</p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </Card>
                </motion.div>
                <motion.div variants={statItemVariants}>
                  <Card className="p-4 flex flex-row justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Alerts</p>
                      <p className="text-2xl font-bold text-yellow-600">{totalAlerts}</p>
                    </div>
                    <Activity className="h-6 w-6 text-yellow-500" />
                  </Card>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Patient Cards Grid */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {mockDetailedPatients.map((patient) => (
            <motion.div
              key={patient.id}
              variants={patientCardVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6">
                {/* Header */}
                <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Room {patient.room} • {patient.department}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={conditionColors[patient.condition]}>
                      {patient.condition}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Day {patient.admissionDay}
                    </p>
                  </div>
                </CardHeader>

                {/* Diagnosis */}
                <CardContent>
                  <p className="text-sm font-medium mb-1">Primary Diagnosis</p>
                  <p className="text-sm text-muted-foreground mb-4">{patient.diagnosis}</p>

                  {/* Vitals */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <Heart className="h-4 w-4 text-red-500 mx-auto mb-1" />
                      <div className="font-bold">{patient.vitals.bloodPressure}</div>
                      <div className="text-xs text-muted-foreground">BP</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <Activity className="h-4 w-4 text-green-500 mx-auto mb-1" />
                      <div className="font-bold">{patient.vitals.heartRate}</div>
                      <div className="text-xs text-muted-foreground">HR</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <Thermometer className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                      <div className="font-bold">{patient.vitals.temperature}</div>
                      <div className="text-xs text-muted-foreground">Temp</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <BarChart3 className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                      <div className="font-bold">{patient.vitals.respiratoryRate}</div>
                      <div className="text-xs text-muted-foreground">RR</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <span className="text-sm font-bold text-purple-600">O₂</span>
                      <div className="font-bold">{patient.vitals.oxygenSaturation}%</div>
                      <div className="text-xs text-muted-foreground">SpO₂</div>
                    </div>
                  </div>

                  {/* Alerts */}
                  {patient.alerts.length > 0 && (
                    <motion.div 
                      className="mb-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <p className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Active Alerts
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {patient.alerts.map((alert, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            {alert}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>

                {/* Footer */}
                <CardFooter className="flex justify-between text-xs text-muted-foreground border-t pt-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated {patient.lastUpdate}
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Snapshot Section */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4">Quick Overview</h2>
          <InPatientSnapshot />
        </motion.div>
      </div>
    </div>
  );
}
