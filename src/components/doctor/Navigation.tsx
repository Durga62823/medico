import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
  User, 
  Bell, 
  Zap, 
  Bed,
  Stethoscope,
  Activity
} from "lucide-react";

const navItems = [
  {
    to: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
    color: "medical-cardiology"
  },
  {
    to: "/appointments",
    icon: Calendar,
    label: "Appointments", 
    color: "medical-neurology"
  },
  {
    to: "/patients",
    icon: User,
    label: "Patient Preview",
    color: "medical-oncology"
  },
  {
    to: "/notifications",
    icon: Bell,
    label: "Notifications",
    color: "medical-emergency"
  },
  {
    to: "/actions",
    icon: Zap,
    label: "Quick Actions",
    color: "medical-surgery"
  },
  {
    to: "/inpatients",
    icon: Bed,
    label: "In-Patients",
    color: "medical-pediatrics"
  }
];

export const Navigation = () => {
  return (
    <nav className="glass rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg gradient-primary">
          <Stethoscope className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="medical-heading text-xl text-primary-navy">Medical Dashboard</h1>
          <p className="text-sm text-muted-foreground">HMS - Doctor Portal</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 medical-card-hover ${
                  isActive
                    ? 'glass-primary border-2 border-primary/20 shadow-lg'
                    : 'glass hover:glass-secondary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-2 rounded-lg ${isActive ? 'gradient-primary' : 'bg-muted/50'} transition-all duration-200`}>
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
      
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-success pulse-medical" />
          <span className="text-sm text-success font-medium">System Online</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      </div>
    </nav>
  );
};