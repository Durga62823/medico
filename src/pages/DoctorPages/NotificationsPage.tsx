import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NotificationsCenter } from "@/components/NotificationsCenter";
import { 
  Bell, 
  AlertTriangle, 
  MessageSquare, 
  FlaskConical,
  Clock,
  CheckCircle,
  X,
  Filter,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ExtendedNotification {
  id: string;
  type: 'critical' | 'message' | 'lab' | 'appointment' | 'system';
  title: string;
  description: string;
  patient: string;
  time: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

const mockNotifications: ExtendedNotification[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Critical: Elevated Potassium Level',
    description: 'Patient K+ level at 6.2 mEq/L (normal: 3.5-5.0). Immediate attention required.',
    patient: 'Sarah Lin',
    time: '5 min ago',
    isRead: false,
    priority: 'high'
  },
  {
    id: '2',
    type: 'message',
    title: 'Patient Message Requires Response',
    description: 'Patient requesting clarification on medication dosage and side effects.',
    patient: 'Michael Chen',
    time: '12 min ago',
    isRead: false,
    priority: 'medium'
  },
  {
    id: '3',
    type: 'lab',
    title: 'Lab Results Available',
    description: 'Complete blood count and metabolic panel results ready for review.',
    patient: 'Emma Rodriguez',
    time: '1 hour ago',
    isRead: true,
    priority: 'medium'
  },
  {
    id: '4',
    type: 'appointment',
    title: 'Appointment Rescheduled',
    description: 'Patient has rescheduled their follow-up appointment to next week.',
    patient: 'John Smith',
    time: '2 hours ago',
    isRead: true,
    priority: 'low'
  },
  {
    id: '5',
    type: 'critical',
    title: 'Abnormal EKG Reading',
    description: 'EKG shows irregular rhythm pattern. Cardiology consultation recommended.',
    patient: 'Robert Johnson',
    time: '3 hours ago',
    isRead: false,
    priority: 'high'
  },
  {
    id: '6', 
    type: 'system',
    title: 'System Maintenance Scheduled',
    description: 'Electronic health records system will be offline for maintenance tonight.',
    patient: 'System Administrator',
    time: '4 hours ago',
    isRead: true,
    priority: 'low'
  }
];

const notificationIcons = {
  critical: AlertTriangle,
  message: MessageSquare,
  lab: FlaskConical,
  appointment: Clock,
  system: Bell
};

const priorityColors = {
  high: 'text-critical',
  medium: 'text-warning',
  low: 'text-info'
};

const typeStyles = {
  critical: 'glass-primary border-l-4 border-l-critical',
  message: 'glass-secondary border-l-4 border-l-secondary',
  lab: 'glass border-l-4 border-l-info',
  appointment: 'glass border-l-4 border-l-warning',
  system: 'glass border-l-4 border-l-muted-foreground'
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.patient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || notif.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const criticalCount = notifications.filter(n => n.type === 'critical' && !n.isRead).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <Navigation />
        
        {/* Page Header */}
        <div className="glass rounded-2xl p-6 mb-6 fade-in-stagger">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="medical-heading text-3xl text-primary-navy mb-2">
                Notifications Center
              </h1>
              <p className="text-muted-foreground">
                Stay updated with critical alerts and important messages
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{background: 'hsl(var(--medical-emergency))'}}>
              <Bell className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-primary rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unread</p>
                  <p className="medical-data text-2xl font-bold text-primary">{unreadCount}</p>
                </div>
                <Bell className="h-8 w-8 text-info" />
              </div>
            </div>
            
            <div className="glass rounded-xl p-4 border-l-4 border-l-critical">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="medical-data text-2xl font-bold text-critical">{criticalCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-critical" />
              </div>
            </div>
            
            <div className="glass-secondary rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="medical-data text-2xl font-bold text-secondary">{notifications.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'critical', 'message', 'lab', 'appointment'].map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="medical-heading text-xl text-primary-navy">
              Active Notifications ({filteredNotifications.length})
            </h2>
            
            {filteredNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type];
              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-xl transition-all duration-300 medical-card-hover ${
                    typeStyles[notification.type]
                  } ${!notification.isRead ? 'shadow-lg' : 'opacity-75'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        notification.priority === 'high' ? 'bg-critical/10' :
                        notification.priority === 'medium' ? 'bg-warning/10' : 'bg-info/10'
                      }`}>
                        <Icon className={`h-4 w-4 ${priorityColors[notification.priority]}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <Badge variant="destructive" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground">
                            Patient: {notification.patient}
                          </span>
                          <span className="text-muted-foreground">
                            {notification.time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        className="h-6 w-6 p-0 hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Right Sidebar */}
          <div>
            <NotificationsCenter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;