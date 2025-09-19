import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Stethoscope, Plus, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Header from "@/components/Header";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  available_days: string[];
  available_start_time: string;
  available_end_time: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  issue_description: string;
  symptoms: string;
  status: string;
  priority: string;
  doctors: Doctor;
  consultation_notes?: string;
  prescription?: string;
}

const Appointments = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Form states
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");

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

    fetchDoctors();
    if (user) fetchAppointments();

    return () => subscription.unsubscribe();
  }, [user]);

  const fetchDoctors = async () => {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_active", true);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch doctors",
        variant: "destructive",
      });
    } else {
      setDoctors(data || []);
    }
  };

  const fetchAppointments = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        doctors (
          id,
          name,
          specialization,
          qualification,
          available_days,
          available_start_time,
          available_end_time
        )
      `)
      .eq("user_id", user.id)
      .order("appointment_date", { ascending: false });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive",
      });
    } else {
      setAppointments(data || []);
    }
  };

  const bookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    const { error } = await supabase
      .from("appointments")
      .insert({
        user_id: user.id,
        doctor_id: selectedDoctor,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        issue_description: issueDescription,
        symptoms: symptoms,
        priority: priority,
        status: "scheduled",
      });

    if (error) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Appointment Booked!",
        description: "Your appointment has been scheduled successfully.",
      });
      setIsOpen(false);
      resetForm();
      fetchAppointments();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedDoctor("");
    setAppointmentDate("");
    setAppointmentTime("");
    setIssueDescription("");
    setSymptoms("");
    setPriority("normal");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "text-warning bg-warning/10";
      case "completed": return "text-success bg-success/10";
      case "cancelled": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-muted/10";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-destructive bg-destructive/10";
      case "normal": default: return "text-primary bg-primary/10";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Medical Appointments</h1>
            <p className="text-muted-foreground">Book and manage your medical consultations</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:shadow-glow">
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Book New Appointment
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={bookAppointment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Doctor</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(value: "normal" | "urgent") => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issue">Issue Description</Label>
                  <Textarea
                    id="issue"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Describe your health concern..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms (Optional)</Label>
                  <Textarea
                    id="symptoms"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="List any symptoms you're experiencing..."
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">
                  {loading ? "Booking..." : "Book Appointment"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {appointments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Appointments Yet</h3>
                <p className="text-muted-foreground mb-4">Book your first medical consultation</p>
                <Button onClick={() => setIsOpen(true)} className="bg-gradient-primary">
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            appointments.map((appointment) => (
              <Card key={appointment.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Dr. {appointment.doctors.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {appointment.doctors.specialization}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(appointment.priority)}`}>
                        {appointment.priority}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{appointment.appointment_time}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Issue Description</h4>
                    <p className="text-sm text-muted-foreground">{appointment.issue_description}</p>
                  </div>

                  {appointment.symptoms && (
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Symptoms</h4>
                      <p className="text-sm text-muted-foreground">{appointment.symptoms}</p>
                    </div>
                  )}

                  {appointment.consultation_notes && (
                    <div className="bg-success/10 p-3 rounded-lg">
                      <h4 className="font-medium text-success mb-1">Consultation Notes</h4>
                      <p className="text-sm text-success-foreground">{appointment.consultation_notes}</p>
                    </div>
                  )}

                  {appointment.prescription && (
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <h4 className="font-medium text-primary mb-1">Prescription</h4>
                      <p className="text-sm text-primary-foreground">{appointment.prescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Appointments;