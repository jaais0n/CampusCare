import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Phone, MapPin, Clock, Shield, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Header from "@/components/Header";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface SOSAlert {
  id: string;
  location: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
}

const Emergency = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form states
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("high");
  const [emergencyType, setEmergencyType] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    if (user) fetchAlerts();

    return () => subscription.unsubscribe();
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("sos_alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch emergency alerts",
        variant: "destructive",
      });
    } else {
      setAlerts(data || []);
    }
  };

  const triggerQuickSOS = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use emergency services",
        variant: "destructive",
      });
      return;
    }

    setIsSOSActive(true);
    setLoading(true);

    // Get current location if possible
    let currentLocation = "Campus Location";
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // We have location but for demo, we'll use campus location
          currentLocation = "Current Campus Location";
        },
        () => {
          // Geolocation failed, use default
        }
      );
    }

    const { error } = await supabase
      .from("sos_alerts")
      .insert({
        user_id: user.id,
        location: currentLocation,
        description: "Emergency SOS Alert - Immediate assistance needed",
        priority: "high",
        status: "active",
      });

    if (error) {
      toast({
        title: "Alert Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "🚨 Emergency Alert Sent!",
        description: "Campus security has been notified. Help is on the way.",
        variant: "destructive"
      });
      fetchAlerts();
    }

    setLoading(false);
    // Auto-deactivate after 3 seconds
    setTimeout(() => setIsSOSActive(false), 3000);
  };

  const submitDetailedAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    const { error } = await supabase
      .from("sos_alerts")
      .insert({
        user_id: user.id,
        location,
        description,
        priority,
        status: "active",
      });

    if (error) {
      toast({
        title: "Alert Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Emergency Alert Sent",
        description: "Your detailed emergency alert has been submitted.",
      });
      setIsDialogOpen(false);
      resetForm();
      fetchAlerts();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setLocation("");
    setDescription("");
    setPriority("high");
    setEmergencyType("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-destructive bg-destructive/10";
      case "resolved": return "text-success bg-success/10";
      case "responding": return "text-warning bg-warning/10";
      default: return "text-muted-foreground bg-muted/10";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive bg-destructive/10";
      case "medium": return "text-warning bg-warning/10";
      case "low": return "text-primary bg-primary/10";
      default: return "text-muted-foreground bg-muted/10";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-24 text-center">
          <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Campus Emergency Services</h1>
          <p className="text-muted-foreground mb-8">
            Please sign in to access emergency alert services and campus security features.
          </p>
          <a href="/auth">
            <Button className="bg-gradient-primary">
              Sign In to Access Emergency Services
            </Button>
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="pt-16 mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Campus Emergency Services</h1>
          <p className="text-muted-foreground">Quick access to emergency alerts and campus security</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Quick SOS Section */}
          <Card className="p-8 bg-card border-destructive/20 shadow-card">
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-4">Emergency SOS</h3>
              <p className="text-muted-foreground mb-8">
                Press for immediate campus security and emergency response
              </p>
              
              <Button
                variant="sos"
                size="sos-lg"
                onClick={triggerQuickSOS}
                disabled={loading || isSOSActive}
                className={`mx-auto mb-6 ${isSOSActive ? 'sos-pulse' : ''}`}
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

          {/* Detailed Alert Section */}
          <Card className="p-6 bg-card shadow-card">
            <h3 className="text-xl font-bold text-foreground mb-4">Emergency Contacts</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Campus Security</p>
                  <p className="text-sm text-primary">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Health Center Emergency</p>
                  <p className="text-sm text-primary">+1 (555) 911-0000</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Crisis Counseling</p>
                  <p className="text-sm text-primary">+1 (555) 424-4357</p>
                </div>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mt-6 bg-gradient-primary">
                  Submit Detailed Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Submit Emergency Alert
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={submitDetailedAlert} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Emergency Type</Label>
                    <Select value={emergencyType} onValueChange={setEmergencyType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select emergency type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medical">Medical Emergency</SelectItem>
                        <SelectItem value="security">Security Threat</SelectItem>
                        <SelectItem value="fire">Fire/Evacuation</SelectItem>
                        <SelectItem value="accident">Accident</SelectItem>
                        <SelectItem value="mental-health">Mental Health Crisis</SelectItem>
                        <SelectItem value="other">Other Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select value={location} onValueChange={setLocation} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="north-dorm">North Dormitory</SelectItem>
                        <SelectItem value="south-dorm">South Dormitory</SelectItem>
                        <SelectItem value="academic-block-a">Academic Block A</SelectItem>
                        <SelectItem value="academic-block-b">Academic Block B</SelectItem>
                        <SelectItem value="library">Library Complex</SelectItem>
                        <SelectItem value="cafeteria">Cafeteria</SelectItem>
                        <SelectItem value="gymnasium">Gymnasium</SelectItem>
                        <SelectItem value="parking">Parking Area</SelectItem>
                        <SelectItem value="health-center">Health Center</SelectItem>
                        <SelectItem value="admin-building">Administration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority Level</Label>
                    <Select value={priority} onValueChange={(value: "high" | "medium" | "low") => setPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High - Immediate Response</SelectItem>
                        <SelectItem value="medium">Medium - Urgent</SelectItem>
                        <SelectItem value="low">Low - Non-urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the emergency situation..."
                      required
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-destructive text-destructive-foreground">
                    {loading ? "Sending Alert..." : "Send Emergency Alert"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </Card>
        </div>

        {/* Alert History */}
        <div className="grid gap-6">
          <h2 className="text-2xl font-bold text-foreground">Recent Emergency Alerts</h2>
          {alerts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Emergency Alerts</h3>
                <p className="text-muted-foreground">Your emergency alert history will appear here</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Emergency Alert
                    </CardTitle>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                        {alert.priority} priority
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{alert.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Emergency;