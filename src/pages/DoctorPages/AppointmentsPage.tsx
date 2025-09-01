import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { AppointmentTimeline, Appointment } from "@/components/AppointmentTimeline";
import { PatientPreview } from "@/components/PatientPreview";
import { Clock, Users, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientName: 'John Doe',
    time: '9:15 AM',
    reason: 'Follow-up: Hypertension Management',
    status: 'checked-in',
    isNext: true,
    hasAllergies: true
  },
  {
    id: '2',
    patientName: 'Emma Wilson',
    time: '9:45 AM',
    reason: 'Annual Physical Examination - Complete Wellness Check',
    status: 'upcoming'
  },
  {
    id: '3',
    patientName: 'Michael Brown',
    time: '10:30 AM',
    reason: 'Orthopedic Consultation - Knee Pain Evaluation',
    status: 'upcoming',
    hasAllergies: true
  },
  {
    id: '4',
    patientName: 'Lisa Garcia',
    time: '11:15 AM',
    reason: 'Diabetes Management & Blood Sugar Monitoring',
    status: 'upcoming'
  },
  {
    id: '5',
    patientName: 'Thomas Anderson',
    time: '2:00 PM',
    reason: 'Cardiology Consultation - Chest Pain Assessment',
    status: 'upcoming',
    hasAllergies: true
  },
  {
    id: '6',
    patientName: 'Sarah Johnson',
    time: '2:30 PM',
    reason: 'Dermatology Follow-up - Skin Condition Review',
    status: 'upcoming'
  },
  {
    id: '7',
    patientName: 'David Park',
    time: '3:15 PM',
    reason: 'Mental Health Consultation - Anxiety Treatment',
    status: 'upcoming',
    hasAllergies: true
  }
];

const AppointmentsPage = () => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const upcomingCount = mockAppointments.filter(apt => apt.status === 'upcoming').length;
  const checkedInCount = mockAppointments.filter(apt => apt.status === 'checked-in').length;
  const completedCount = mockAppointments.filter(apt => apt.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <Navigation />
        
        {/* Page Header */}
        <div className="glass rounded-2xl p-6 mb-6 fade-in-stagger">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="medical-heading text-3xl text-primary-navy mb-2">
                Today's Appointments
              </h1>
              <p className="text-muted-foreground">
                Manage your patient schedule and appointments efficiently
              </p>
            </div>
            <div className="p-3 rounded-xl gradient-secondary">
              <Calendar className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="glass-primary rounded-xl p-4 medical-card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Today</p>
                  <p className="medical-data text-2xl font-bold text-primary">{mockAppointments.length}</p>
                </div>
                <Users className="h-8 w-8 text-info" />
              </div>
            </div>
            
            <div className="glass-secondary rounded-xl p-4 medical-card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Checked In</p>
                  <p className="medical-data text-2xl font-bold text-secondary">{checkedInCount}</p>
                </div>
                <Clock className="h-8 w-8 text-status-checked-in" />
              </div>
            </div>
            
            <div className="glass rounded-xl p-4 medical-card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="medical-data text-2xl font-bold text-accent">{upcomingCount}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-status-upcoming" />
              </div>
            </div>
            
            <div className="glass rounded-xl p-4 medical-card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="medical-data text-2xl font-bold text-success">{completedCount}</p>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  Done
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointments Timeline - Wider */}
          <div className="lg:col-span-2">
            <AppointmentTimeline
              appointments={mockAppointments}
              onAppointmentClick={setSelectedAppointment}
              selectedId={selectedAppointment?.id}
            />
          </div>

          {/* Patient Preview Sidebar */}
          <div className="lg:col-span-1">
            <PatientPreview appointment={selectedAppointment} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;