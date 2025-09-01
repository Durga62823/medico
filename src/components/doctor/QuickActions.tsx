import { FileText, FlaskConical, PillBottle, MessageCircle, Stethoscope, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'outline';
  shouldPulse?: boolean;
}

interface QuickActionsProps {
  nextPatientReady?: boolean;
}

export const QuickActions = ({ nextPatientReady }: QuickActionsProps) => {
  const actions: QuickAction[] = [
    {
      id: 'chart',
      label: 'Start Charting',
      icon: FileText,
      variant: 'default',
      shouldPulse: nextPatientReady
    },
    {
      id: 'labs',
      label: 'Order Labs',
      icon: FlaskConical,
      variant: 'secondary'
    },
    {
      id: 'prescribe',
      label: 'e-Prescribe',
      icon: PillBottle,
      variant: 'secondary'
    },
    {
      id: 'message',
      label: 'Message Nurse',
      icon: MessageCircle,
      variant: 'outline'
    },
    {
      id: 'examine',
      label: 'Physical Exam',
      icon: Stethoscope,
      variant: 'outline'
    },
    {
      id: 'schedule',
      label: 'Schedule Follow-up',
      icon: Calendar,
      variant: 'outline'
    }
  ];

  const handleActionClick = (actionId: string) => {
    console.log(`Action clicked: ${actionId}`);
    // Here you would typically navigate to the appropriate screen or open a modal
  };

  return (
    <div className="glass rounded-xl p-6 fade-in-stagger">
      <h3 className="text-lg font-semibold text-primary-navy mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant}
              onClick={() => handleActionClick(action.id)}
              className={`h-auto p-4 flex flex-col items-center gap-2 text-center transition-all duration-200 hover:scale-[1.02] ${
                action.shouldPulse ? 'pulse-gentle' : ''
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};