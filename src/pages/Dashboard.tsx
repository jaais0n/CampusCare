import { useState } from "react";
import { 
  Calendar, 
  Pill, 
  MessageCircle, 
  Dumbbell, 
  Brain, 
  Accessibility,
  AlertTriangle,
  User,
  Settings,
  Bell,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const [userRole] = useState<'student' | 'faculty' | 'admin'>('student');
  
  const quickActions = [
    {
      icon: AlertTriangle,
      title: "Emergency SOS",
      description: "Instant emergency alert",
      color: "bg-destructive/10 text-destructive border-destructive/20",
      urgent: true
    },
    {
      icon: Calendar,
      title: "Book Appointment",
      description: "Schedule with doctors",
      color: "bg-primary/10 text-primary border-primary/20"
    },
    {
      icon: Pill,
      title: "Order Medicine",
      description: "Browse pharmacy",
      color: "bg-success/10 text-success border-success/20"
    },
    {
      icon: MessageCircle,
      title: "Counseling",
      description: "Book session",
      color: "bg-warning/10 text-warning border-warning/20"
    },
    {
      icon: Brain,
      title: "Wellness Tips",
      description: "Daily activities",
      color: "bg-primary/10 text-primary border-primary/20"
    },
    {
      icon: Accessibility,
      title: "Accessibility",
      description: "Book wheelchair",
      color: "bg-accent/10 text-foreground border-accent/20"
    }
  ];

  const recentActivity = [
    { type: "appointment", message: "Appointment with Dr. Smith confirmed for tomorrow 2:00 PM", time: "2 hours ago" },
    { type: "medicine", message: "Medicine order #12345 delivered to dormitory", time: "1 day ago" },
    { type: "counseling", message: "Counseling session completed - feedback submitted", time: "3 days ago" }
  ];

  const upcomingReminders = [
    { title: "Doctor Appointment", time: "Tomorrow 2:00 PM", type: "appointment" },
    { title: "Yoga Class", time: "Wednesday 6:00 PM", type: "wellness" },
    { title: "Meditation Session", time: "Friday 8:00 AM", type: "wellness" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-xl">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">CampusCare+ Dashboard</h1>
              <p className="text-sm text-muted-foreground capitalize">{userRole} Portal</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button size="sm" variant="ghost" className="text-muted-foreground">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground">
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-muted-foreground">
            Here's your wellness dashboard. Quick access to all campus health services.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className={`p-4 border transition-all duration-300 hover:shadow-glow hover:translate-y-[-2px] cursor-pointer ${action.color} ${
                    action.urgent ? 'sos-pulse' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-background/50">
                      <action.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{action.title}</h4>
                      <p className="text-sm opacity-80">{action.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-6">Recent Activity</h3>
              <Card className="p-6 bg-card shadow-card">
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 pb-4 border-b border-border last:border-0">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Upcoming Reminders */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">Upcoming</h3>
              <Card className="p-4 bg-card shadow-card">
                <div className="space-y-3">
                  {upcomingReminders.map((reminder, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">{reminder.title}</p>
                        <p className="text-xs text-muted-foreground">{reminder.time}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {reminder.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Health Metrics */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">Wellness Stats</h3>
              <Card className="p-4 bg-card shadow-card">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wellness Score</span>
                    <span className="text-2xl font-bold text-primary">85%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div className="bg-gradient-primary h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">12</p>
                      <p className="text-xs text-muted-foreground">Services Used</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">8</p>
                      <p className="text-xs text-muted-foreground">This Month</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Backend Notice */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="text-center">
                <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-primary font-medium mb-2">Full Features Available</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Connect Supabase to enable user authentication, data storage, and full functionality.
                </p>
                <Button size="sm" className="w-full">
                  Setup Backend
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;