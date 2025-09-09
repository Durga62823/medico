import { useState } from "react";
import { Navigation } from "@/components/doctor/Navigation";
import { PatientPreview } from "@/components/doctor/PatientPreview";
import { 
  User, 
  Search, 
  Filter, 
  Heart, 
  AlertTriangle, 
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Patient = {
  id: string;
  name: string;
  condition: string;
  hasAllergies?: boolean;
};

const mockPatients: Patient[] = [
  {
    id: "1",
    name: "John Doe",
    condition: "Hypertension",
    hasAllergies: true,
  },
  {
    id: "2",
    name: "Emma Wilson",
    condition: "Annual Physical",
  },
  {
    id: "3",
    name: "Michael Brown",
    condition: "Knee Pain",
    hasAllergies: true,
  },
  {
    id: "4",
    name: "Lisa Garcia",
    condition: "Diabetes",
  },
  {
    id: "5",
    name: "Thomas Anderson",
    condition: "Chest Pain",
    hasAllergies: true,
  },
];

const PatientsPage = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(mockPatients[0]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = mockPatients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <Navigation />
        
        {/* Page Header */}
        <div className="glass rounded-2xl p-6 mb-6 fade-in-stagger">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="medical-heading text-3xl text-primary-navy mb-2">
                Patient Management
              </h1>
              <p className="text-muted-foreground">
                Comprehensive patient information and medical records
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{background: 'hsl(var(--medical-oncology))'}}>
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="secondary" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Patient List */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6 fade-in-stagger">
              <h2 className="medical-heading text-xl text-primary-navy mb-6 flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient List ({filteredPatients.length})
              </h2>
              
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 medical-card-hover ${
                      selectedPatient?.id === patient.id 
                        ? "glass-primary border-primary/30 shadow-lg" 
                        : "glass hover:glass-secondary border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          selectedPatient?.id === patient.id ? "gradient-primary" : "bg-muted/50"
                        }`}>
                          <User
                            className={`h-4 w-4 ${
                              selectedPatient?.id === patient.id ? "text-white" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{patient.name}</h3>
                          <p className="text-sm text-muted-foreground">{patient.condition}</p>
                        </div>
                      </div>
                      {patient.hasAllergies && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Details + Analytics */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Patient Preview */}
              {selectedPatient && <PatientPreview patient={selectedPatient} />}
              
              {/* Quick Stats */}
              <div className="glass rounded-2xl p-6 fade-in-stagger">
                <h3 className="medical-heading text-lg text-primary-navy mb-4">
                  Patient Analytics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 glass-secondary rounded-xl">
                    <Heart className="h-8 w-8 text-medical-cardiology mx-auto mb-2" />
                    <div className="medical-data text-2xl font-bold text-medical-cardiology">138/85</div>
                    <div className="text-sm text-muted-foreground">Blood Pressure</div>
                  </div>
                  <div className="text-center p-4 glass-primary rounded-xl">
                    <Activity className="h-8 w-8 text-success mx-auto mb-2" />
                    <div className="medical-data text-2xl font-bold text-success">72</div>
                    <div className="text-sm text-muted-foreground">Heart Rate</div>
                  </div>
                  <div className="text-center p-4 glass rounded-xl">
                    <div className="h-8 w-8 bg-info/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="medical-data text-info font-bold">°F</span>
                    </div>
                    <div className="medical-data text-2xl font-bold text-info">98.6</div>
                    <div className="text-sm text-muted-foreground">Temperature</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientsPage;
