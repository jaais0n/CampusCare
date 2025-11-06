import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BackBar } from "@/components/BackBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Stethoscope, Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  doctors: Doctor;
  issue_description?: string;
  symptoms?: string;
  consultation_notes?: string;
  prescription?: string;
  created_at?: string;
  updated_at?: string;
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // Single doctor as requested
  const [doctors] = useState<Doctor[]>([
    { id: '1', name: 'Dr. David Mathew', specialization: 'General Medicine' },
  ]);
  
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [editTime, setEditTime] = useState("");
  const { toast } = useToast();

  // Set today's date (fixed), default doctor, and prefill current time
  useEffect(() => {
    setAppointmentDate(new Date().toISOString().split('T')[0]);
    if (doctors && doctors.length > 0) {
      setSelectedDoctor(doctors[0].id);
    }
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setAppointmentTime(`${hh}:${mm}`);
  }, [doctors]);

  // Load existing appointments for the signed-in user
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      const { data, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, status, doctor_id')
        .eq('user_id', userId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });
      if (error) {
        toast({ title: 'Load failed', description: error.message, variant: 'destructive' });
      } else if (data) {
        const mapped: Appointment[] = data.map((row: any) => ({
          id: row.id,
          appointment_date: row.appointment_date,
          appointment_time: row.appointment_time,
          status: (['scheduled','completed','cancelled'].includes(row.status) ? row.status : 'scheduled') as Appointment['status'],
          doctors: doctors[0] || { id: row.doctor_id, name: 'Campus Doctor', specialization: 'General Medicine' },
        }));
        setAppointments(mapped);
      }
    };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'approved';
      case 'cancelled':
        return 'declined';
      case 'completed':
        return 'completed';
      case 'scheduled':
      default:
        return 'scheduled';
    }
  };
    load();
  }, [doctors]);

  // Realtime: notify user when admin approves/declines/completes
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      channel = supabase
        .channel(`appointments-status-${userId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` },
          (payload: any) => {
            const newRow = payload.new as any;
            const oldRow = payload.old as any;
            if (newRow?.status && newRow.status !== oldRow?.status) {
              const status = newRow.status as string;
              const messages: Record<string, { title: string; description: string; variant?: 'destructive' | 'default' }>= {
                confirmed: { title: 'Appointment Approved', description: 'Your medical appointment has been approved.' },
                cancelled: { title: 'Appointment Declined', description: 'Your medical appointment was declined.', variant: 'destructive' },
                completed: { title: 'Appointment Completed', description: 'Your appointment has been marked as completed.' },
                scheduled: { title: 'Appointment Updated', description: 'Your appointment status was updated.' },
              };
              const msg = messages[status] || messages['scheduled'];
              toast({ title: msg.title, description: msg.description, variant: msg.variant as any });
              // reflect status in local list
              setAppointments((prev) => prev.map((a) => a.id === newRow.id ? { ...a, status: status as any } : a));
            }
          }
        )
        .subscribe();
    };
    init();
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleDeleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast({ title: 'Deleted', description: 'Appointment removed.' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message || 'Unknown error', variant: 'destructive' });
    }
  };

  const openEdit = (appt: Appointment) => {
    setEditing(appt);
    setEditTime(appt.appointment_time);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ appointment_time: editTime })
        .eq('id', editing.id);
      if (error) throw error;
      setAppointments((prev) => prev.map((a) => a.id === editing.id ? { ...a, appointment_time: editTime } : a));
      setEditOpen(false);
      setEditing(null);
      toast({ title: 'Updated', description: 'Appointment time updated.' });
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message || 'Unknown error', variant: 'destructive' });
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !appointmentTime) {
      toast({
        title: "Error",
        description: "Please select a time",
        variant: "destructive",
      });
      return;
    }
    setBooking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      const meta: any = session?.user?.user_metadata || {};
      const studentName = (meta.full_name || (session?.user?.email ? session.user.email.split("@")[0] : "")).toUpperCase();
      const studentRoll = meta.roll_number || "";

      // Check if slot is already booked for this doctor/date/time
      const { data: existing, error: existingErr } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', selectedDoctor)
        .eq('appointment_date', appointmentDate)
        .eq('appointment_time', appointmentTime)
        .in('status', ['scheduled', 'confirmed'])
        .limit(1);
      if (existingErr) {
        // Non-blocking: continue, but log client-side
        console.error('Slot check failed:', existingErr.message);
      } else if (existing && existing.length > 0) {
        toast({ title: 'Slot already booked', description: 'Please choose a different time.', variant: 'destructive' });
        setBooking(false);
        return;
      }

      // Insert into database (ensure minimal required fields)
      const payload: any = {
        user_id: userId,
        doctor_id: selectedDoctor,
        appointment_date: appointmentDate, // today
        appointment_time: appointmentTime,
        status: 'scheduled',
        issue_description: 'General checkup',
        student_name: studentName,
        student_roll: studentRoll,
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(payload as any)
        .select(
          `id, appointment_date, appointment_time, status`
        )
        .single();

      if (error) throw error;

      const newAppointment: Appointment = {
        id: data.id,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        status: 'scheduled',
        doctors: doctors.find(d => d.id === selectedDoctor) || { id: selectedDoctor, name: 'Campus Doctor', specialization: 'General' },
      };

      setAppointments([newAppointment, ...appointments]);
      setSelectedDoctor("");
      setIsOpen(false);
      toast({ title: "Success", description: "Appointment booked successfully!" });
      // Refresh from DB so it persists when revisiting the page
      const { data: { session: s } } = await supabase.auth.getSession();
      if (s?.user?.id) {
        const { data: list, error: e2 } = await supabase
          .from('appointments')
          .select('id, appointment_date, appointment_time, status, doctor_id')
          .eq('user_id', s.user.id)
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false });
        if (e2) {
          toast({ title: 'Load failed', description: e2.message, variant: 'destructive' });
        } else if (list) {
          const mapped: Appointment[] = list.map((row: any) => ({
            id: row.id,
            appointment_date: row.appointment_date,
            appointment_time: row.appointment_time,
            status: (['scheduled','completed','cancelled'].includes(row.status) ? row.status : 'scheduled') as Appointment['status'],
            doctors: doctors[0] || { id: row.doctor_id, name: 'Campus Doctor', specialization: 'General Medicine' },
          }));
          setAppointments(mapped);
        }
      }
    } catch (e: any) {
      toast({ title: "Booking failed", description: e.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setBooking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'approved';
      case 'cancelled':
        return 'declined';
      case 'completed':
        return 'completed';
      case 'scheduled':
      default:
        return 'scheduled';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        <BackBar />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Medical Appointments</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Book and manage your health appointments</p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:shadow-glow w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] mx-3">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Book New Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-sm">Doctor</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id} className="text-sm">
                          {doctor.name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Date</Label>
                    <Input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Time</Label>
                    <Input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                <Button type="button" className="w-full mt-2 text-sm sm:text-base" onClick={handleBookAppointment} disabled={booking}>
                  {booking ? 'Booking...' : 'Book Now'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {appointments.length === 0 ? (
            <Card className="text-center p-6 sm:p-8 bg-card border-border">
              <Calendar className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mb-2" />
              <h3 className="text-base sm:text-lg font-medium text-foreground">No Appointments</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Book your first appointment to get started</p>
            </Card>
          ) : (
            appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                        <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h3 className="font-medium text-sm sm:text-base truncate">{appointment.doctors.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${getStatusColor(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{appointment.doctors.specialization}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                          </div>
                          <span className="hidden sm:inline">•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>{appointment.appointment_time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(appointment)} className="w-full sm:w-auto text-xs sm:text-sm">
                        <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteAppointment(appointment.id)} className="w-full sm:w-auto text-xs sm:text-sm">
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit time dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[380px] mx-3">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Edit Appointment Time</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm">Time</Label>
                <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="text-sm" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1 text-sm sm:text-base" onClick={saveEdit}>Save</Button>
                <Button className="flex-1 text-sm sm:text-base" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Appointments;