import { useState } from "react";
import { AlertTriangle, Phone, MapPin, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface EmergencyAlert {
  id: string;
  timestamp: Date;
  location: string;
  status: 'active' | 'resolved';
  userType: 'student' | 'faculty';
  userName: string;
}

const SOSEmergency = () => {
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      location: 'Library Building - Floor 2',
      status: 'active',
      userType: 'student',
      userName: 'Anonymous Student'
    }
  ]);
  const { toast } = useToast();

  const triggerSOS = () => {
    setIsSOSActive(true);
    
    const newAlert: EmergencyAlert = {
      id: Date.now().toString(),
      timestamp: new Date(),
      location: 'Current Location', // In real app, would use geolocation
      status: 'active',
      userType: 'student', // Would come from auth context
      userName: 'Current User'
    };
    
    setEmergencyAlerts(prev => [newAlert, ...prev]);
    
    toast({
      title: "🚨 Emergency Alert Sent!",
      description: "Campus security has been notified. Help is on the way.",
      variant: "destructive"
    });

    // Auto-deactivate after 3 seconds
    setTimeout(() => setIsSOSActive(false), 3000);
  };

  const resolveAlert = (alertId: string) => {
    setEmergencyAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved' as const }
          : alert
      )
    );
    
    toast({
      title: "Alert Resolved",
      description: "Emergency has been marked as resolved."
    });
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Emergency Assistance</h2>
          <p className="text-muted-foreground text-lg">
            Quick access to emergency services and real-time safety alerts
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* SOS Button Section */}
          <Card className="p-8 bg-card border-destructive/20 shadow-card">
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-4">Emergency SOS</h3>
              <p className="text-muted-foreground mb-8">
                Press the button below to immediately alert campus security and emergency services
              </p>
              
              <Button
                variant="sos"
                size="sos-lg"
                onClick={triggerSOS}
                disabled={isSOSActive}
                className="mx-auto mb-6"
              >
                <AlertTriangle className="w-8 h-8" />
              </Button>
              
              <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Auto-call Security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Location Shared</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Active Alerts Section */}
          <Card className="p-6 bg-card shadow-card">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
              Active Alerts
            </h3>
            
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {emergencyAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                  <p>No active emergencies</p>
                </div>
              ) : (
                emergencyAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.status === 'active'
                        ? 'border-destructive/30 bg-destructive/5'
                        : 'border-success/30 bg-success/5'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            alert.status === 'active'
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-success/20 text-success'
                          }`}>
                            {alert.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">{alert.location}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.userType}: {alert.userName}
                        </p>
                      </div>
                      
                      {alert.status === 'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resolveAlert(alert.id)}
                          className="text-success hover:bg-success/10"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Emergency Contacts */}
        <Card className="mt-8 p-6 bg-card shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Emergency Contacts</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Campus Security</p>
                <p className="text-sm text-primary">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Medical Emergency</p>
                <p className="text-sm text-primary">+1 (555) 911-0000</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Mental Health Crisis</p>
                <p className="text-sm text-primary">+1 (555) 424-4357</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default SOSEmergency;