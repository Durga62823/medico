import { Syringe, UserPlus, ClipboardList, MessageCircle, HandHeart, Calendar, FileText, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'outline';
  shouldPulse?: boolean;
}

interface QuickActionsProps {
  urgentTask?: boolean; // e.g., urgent medication or request
}

export const QuickActions = ({ urgentTask }: QuickActionsProps) => {
  const actions: QuickAction[] = [
    {
      id: 'vitals',
      label: 'Record Vitals',
      icon: ClipboardList,
      variant: 'default',
      shouldPulse: urgentTask
    },
    {
      id: 'meds',
      label: 'Administer Meds',
      icon: Syringe,
      variant: 'secondary',
    },
    {
      id: 'admit',
      label: 'Admit New Patient',
      icon: UserPlus,
      variant: 'secondary',
    },
    {
      id: 'handover',
      label: 'Handover/Shift Notes',
      icon: FileText,
      variant: 'outline',
    },
    {
      id: 'chat',
      label: 'Message Doctor',
      icon: MessageCircle,
      variant: 'outline',
    },
    {
      id: 'care',
      label: 'Record Care Activity',
      icon: HandHeart,
      variant: 'outline',
    },
    {
      id: 'schedule',
      label: 'Schedule Care Review',
      icon: Calendar,
      variant: 'outline',
    },
    {
      id: 'examine',
      label: 'Physical Assessment',
      icon: Stethoscope,
      variant: 'outline',
    },
  ];

  const handleActionClick = (actionId: string) => {
    console.log(`Nurse action clicked: ${actionId}`);
    // Navigation/modal logic here
  };

  return (
    <div className="glass rounded-xl p-6 fade-in-stagger">
      <h3 className="text-lg font-semibold text-primary-navy mb-4">Nurse Quick Actions</h3>
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
