import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Heart, UserCog, Shield } from "lucide-react";

interface Role {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  permissions: string[];
  color: string;
}

const roles: Role[] = [
  {
    id: "doctor",
    title: "Doctor",
    description: "Full access to patient records and AI diagnostics",
    icon: Stethoscope,
    permissions: ["Full patient access", "AI diagnostics", "Prescriptions", "Analytics"],
    color: "primary"
  },
  {
    id: "nurse",
    title: "Nurse",
    description: "Patient monitoring and vital sign management",
    icon: Heart,
    permissions: ["Patient monitoring", "Vital signs", "Alerts", "Basic records"],
    color: "accent"
  },
  {
    id: "patient",
    title: "Patient",
    description: "View your health data and communicate with care team",
    icon: UserCog,
    permissions: ["Personal data", "AI assistant", "Appointments", "Messaging"],
    color: "secondary"
  },
  {
    id: "admin",
    title: "Administrator",
    description: "System management and compliance oversight",
    icon: Shield,
    permissions: ["System config", "User management", "Audit logs", "Security"],
    color: "muted"
  }
];

interface AuthSelectionProps {
  onRoleSelect: (roleId: string) => void;
}

export function AuthSelection({ onRoleSelect }: AuthSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-medical flex items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Welcome to MedAIron</h1>
          <p className="text-xl text-white/80">AI-Powered Healthcare Dashboard</p>
          <p className="text-white/60">Select your role to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Card 
                key={role.id} 
                className="relative overflow-hidden hover:shadow-medical transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                onClick={() => onRoleSelect(role.id)}
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-sm">{role.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {role.permissions.map((permission, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    className="w-full mt-4 bg-gradient-primary hover:opacity-90"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRoleSelect(role.id);
                    }}
                  >
                    Continue as {role.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-white/60 text-sm">
          <p>Secure authentication powered by OAuth 2.0 | HIPAA Compliant</p>
        </div>
      </div>
    </div>
  );
}