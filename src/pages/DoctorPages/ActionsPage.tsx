// import { Navigation } from "@/components/doctor/Navigation";
import { QuickActions } from "@/components/doctor/QuickActions";
import { 
  FileText, 
  FlaskConical, 
  PillBottle, 
  MessageCircle,
  Stethoscope,
  Calendar,
  Users,
  BarChart3,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ActionCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  actions: {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    shortcut: string;
    frequency: 'high' | 'medium' | 'low';
  }[];
}

const actionCategories: ActionCategory[] = [
      {
    id: 'communication',
    title: 'Communication',
    description: 'Patient and team communication',
    icon: MessageCircle,
    actions: [
      { id: 'message', label: 'Message Nurse', description: 'Send message to nursing staff', icon: MessageCircle, shortcut: 'Ctrl+M', frequency: 'medium' },
      { id: 'consult', label: 'Request Consult', description: 'Request specialist consultation', icon: Users, shortcut: 'Ctrl+R', frequency: 'medium' },
      { id: 'patient-msg', label: 'Patient Message', description: 'Send message to patient', icon: MessageCircle, shortcut: 'Ctrl+U', frequency: 'low' }
    ]
  },
  
  {
    id: 'clinical',
    title: 'Clinical Actions',
    description: 'Medical procedures and examinations',
    icon: Stethoscope,
    actions: [
      { id: 'examine', label: 'Physical Exam', description: 'Perform patient examination', icon: Stethoscope, shortcut: 'Ctrl+E', frequency: 'high' },
      { id: 'vitals', label: 'Record Vitals', description: 'Update patient vital signs', icon: BarChart3, shortcut: 'Ctrl+V', frequency: 'high' },
      { id: 'assessment', label: 'Assessment', description: 'Clinical assessment and diagnosis', icon: Stethoscope, shortcut: 'Ctrl+A', frequency: 'medium' }
    ]
  },
  {
    id: 'orders',
    title: 'Orders & Prescriptions',
    description: 'Medical orders and medications',
    icon: PillBottle,
    actions: [
      { id: 'labs', label: 'Order Labs', description: 'Request laboratory tests', icon: FlaskConical, shortcut: 'Ctrl+L', frequency: 'high' },
      { id: 'prescribe', label: 'e-Prescribe', description: 'Electronic prescription', icon: PillBottle, shortcut: 'Ctrl+P', frequency: 'high' },
      { id: 'imaging', label: 'Order Imaging', description: 'Request diagnostic imaging', icon: BarChart3, shortcut: 'Ctrl+I', frequency: 'medium' }
    ]
  },

  {
    id: 'scheduling',
    title: 'Scheduling',
    description: 'Appointments and follow-ups',
    icon: Calendar,
    actions: [
      { id: 'schedule', label: 'Schedule Follow-up', description: 'Book next appointment', icon: Calendar, shortcut: 'Ctrl+F', frequency: 'medium' },
      { id: 'reschedule', label: 'Reschedule', description: 'Modify existing appointment', icon: Clock, shortcut: 'Ctrl+Shift+R', frequency: 'low' },
      { id: 'urgent', label: 'Urgent Booking', description: 'Schedule urgent appointment', icon: Calendar, shortcut: 'Ctrl+Shift+U', frequency: 'low' }
    ]
  }
];

const frequencyColors = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200"
};

// Define variants for the main staggered container
const parentContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Delay between each child category
      delayChildren: 0.2
    }
  }
};

// Define variants for each category card
const categoryItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: "easeOut" 
    }
  }
};

// Define variants for the buttons within each card
const buttonItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { 
      duration: 0.3,
    }
  }
};


export default function ActionsPage() {
  const handleActionClick = (actionId: string) => {
    console.log(`Action clicked: ${actionId}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          variants={categoryItemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Essential Actions</CardTitle>
              <CardDescription>
                Quick access to common workflows and clinical tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickActions nextPatientReady={true} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Categories */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={parentContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {actionCategories.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <motion.div
                key={category.id}
                variants={categoryItemVariants}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary rounded-lg p-2">
                        <CategoryIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>{category.title}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <motion.div 
                      className="space-y-3"
                      variants={parentContainerVariants}
                    >
                      {category.actions.map((action) => {
                        const ActionIcon = action.icon;
                        return (
                          <motion.div
                            key={action.id}
                            variants={buttonItemVariants}
                            whileHover={{ scale: 1.02 }}
                          >
                            <Button
                              variant="outline"
                              onClick={() => handleActionClick(action.id)}
                              className="w-full h-auto p-4 justify-start"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="p-2 rounded-lg bg-muted">
                                  <ActionIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{action.label}</span>
                                    <Badge variant="outline" className={frequencyColors[action.frequency]}>
                                      {action.frequency}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{action.description}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {action.shortcut}
                                </Badge>
                              </div>
                            </Button>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}