import { Bed, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InPatient {
  id: string;
  name: string;
  room: string;
  admissionDay: number;
  condition: 'stable' | 'monitoring' | 'improving';
}

const mockInPatients: InPatient[] = [
  {
    id: '1',
    name: 'Robert Johnson',
    room: '302A',
    admissionDay: 3,
    condition: 'stable'
  },
  {
    id: '2',
    name: 'Maria Santos',
    room: '418B',
    admissionDay: 1,
    condition: 'monitoring'
  },
  {
    id: '3',
    name: 'David Park',
    room: '205C',
    admissionDay: 7,
    condition: 'improving'
  }
];

const conditionStyles = {
  stable: 'bg-status-completed/10 text-status-completed border-status-completed/20',
  monitoring: 'bg-status-checked-in/10 text-status-checked-in border-status-checked-in/20',
  improving: 'bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20'
};

export const InPatientSnapshot = () => {
  return (
    <div className="glass rounded-xl p-6 fade-in-stagger">
      <h3 className="text-lg font-semibold text-primary-navy mb-4 flex items-center gap-2">
        <Bed className="h-5 w-5" />
        My Admitted Patients
      </h3>
      
      <div className="space-y-3">
        {mockInPatients.map((patient) => (
          <div
            key={patient.id}
            className="p-3 rounded-lg border border-border hover:border-secondary/50 cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">{patient.name}</span>
              <Badge 
                variant="outline" 
                className={conditionStyles[patient.condition]}
              >
                {patient.condition}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Bed className="h-3 w-3" />
                Room {patient.room}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Day {patient.admissionDay}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {mockInPatients.length === 0 && (
        <div className="text-center text-muted-foreground py-6">
          No admitted patients today
        </div>
      )}
    </div>
  );
};