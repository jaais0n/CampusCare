import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Brain, Calendar, Clock, MessageSquare, Plus, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BackBar } from "@/components/BackBar";
import { Loader, SkeletonCard } from "@/components/ui/loader";

interface Counselor {
  id: string;
  name: string;
  specialization: string[];
}

interface CounselingBooking {
  id: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  counselors: Counselor;
  confirmed_date?: string;
  confirmed_time?: string;
  meeting_link?: string;
  is_anonymous?: boolean;
  category?: 'academic' | 'personal' | 'career' | 'stress' | 'relationships' | 'other';
  mode?: 'in_person' | 'online';
  issue_description?: string;
  session_notes?: string;
  created_at?: string;
  updated_at?: string;
  anonymous_contact?: string;
}

const Counseling = () => {
  const [bookings, setBookings] = useState<CounselingBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  // Single counselor similar to medical
  const [counselors] = useState<Counselor[]>([
    { id: '1', name: 'Dr. Anita Verma', specialization: ['Counseling Psychologist'] }
  ]);
  
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<"academic" | "personal" | "career" | "stress" | "relationships" | "other">("personal");
  const [mode, setMode] = useState<"in_person" | "online">("online");
  const [issueDescription, setIssueDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousContact, setAnonymousContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  // Edit/Delete controls similar to medical
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CounselingBooking | null>(null);
  const [editTime, setEditTime] = useState("");
  
  const { toast } = useToast();

  // Mount-only: wire auth listener and set defaults
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Fixed today, default counselor and current time like medical
    setPreferredDate(new Date().toISOString().split('T')[0]);
    if (counselors && counselors.length > 0) {
      setSelectedCounselor(counselors[0].id);
    }
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setPreferredTime(`${hh}:${mm}`);

    return () => subscription.unsubscribe();
  }, []);

  // Fetch once when user becomes available
  useEffect(() => {
    if (!user) return;
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Realtime: update when admin changes booking status
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      channel = supabase
        .channel(`counseling-status-${userId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'counseling_bookings', filter: `user_id=eq.${userId}` }, (payload: any) => {
          const n = payload.new as any; const o = payload.old as any;
          if (n?.status && n.status !== o?.status) {
            const msg = n.status === 'confirmed' ? {t:'Session Approved', d:'Your counseling session has been approved.'}
              : n.status === 'cancelled' ? {t:'Session Declined', d:'Your counseling session was declined.'}
              : n.status === 'completed' ? {t:'Session Completed', d:'Your counseling session has been marked as completed.'}
              : {t:'Session Updated', d:'Your counseling session was updated.'};
            toast({ title: msg.t, description: msg.d, variant: n.status === 'cancelled' ? 'destructive' : 'default' });
            setBookings(prev => prev.map(b => b.id === n.id ? { ...b, status: n.status } as any : b));
          }
        })
        .subscribe();
    };
    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const fetchBookings = async () => {
    if (!user) return;
    setIsLoadingBookings(true);
    try {
      const { data, error } = await supabase
        .from('counseling_bookings')
        .select('id, preferred_date, preferred_time, confirmed_date, confirmed_time, status')
        .eq('user_id', user.id)
        .order('preferred_date', { ascending: false });

      if (error) {
        toast({ title: 'Error', description: 'Failed to fetch bookings', variant: 'destructive' });
      } else {
        // Map to the CounselingBooking shape with a synthetic counselor
        const mapped = (data || []).map((row: any) => ({
          id: row.id,
          preferred_date: row.preferred_date,
          preferred_time: row.preferred_time,
          confirmed_date: row.confirmed_date,
          confirmed_time: row.confirmed_time,
          status: row.status,
          counselors: { id: '1', name: 'Dr. Anita Verma', specialization: ['Counseling Psychologist'] },
        } as unknown as CounselingBooking));
        setBookings(mapped);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const bookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !isAnonymous) return;
    
    setLoading(true);
    // Prevent double booking for same counselor/date/time when pending or confirmed
    const { data: existing } = await supabase
      .from('counseling_bookings')
      .select('id')
      .eq('counselor_id', selectedCounselor)
      .eq('preferred_date', preferredDate)
      .eq('preferred_time', preferredTime)
      .in('status', ['pending','confirmed'])
      .limit(1);
    if (existing && existing.length > 0) {
      toast({ title: 'Slot already booked', description: 'Please choose a different time.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const meta: any = session?.user?.user_metadata || {};
    const studentName = (meta.full_name || (session?.user?.email ? session.user.email.split("@")[0] : "")).toUpperCase();
    const studentRoll = meta.roll_number || "";

    const { error } = await supabase
      .from("counseling_bookings")
      .insert({
        user_id: isAnonymous ? null : user?.id,
        counselor_id: selectedCounselor,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        category: category,
        mode: mode,
        issue_description: issueDescription,
        is_anonymous: isAnonymous,
        anonymous_contact: isAnonymous ? anonymousContact : null,
        student_name: studentName,
        student_roll: studentRoll,
        status: "pending" as const,
      });

    if (error) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Session Booked!",
        description: "Your counseling session has been requested successfully.",
      });
      setIsOpen(false);
      resetForm();
      fetchBookings();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedCounselor("");
    setPreferredDate("");
    setPreferredTime("");
    setCategory("personal");
    setMode("online");
    setIssueDescription("");
    setIsAnonymous(false);
    setAnonymousContact("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
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
      case 'pending':
      default:
        return 'scheduled';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "academic": return "🎓";
      case "personal": return "❤️";
      case "career": return "💼";
      case "mental_health": return "🧠";
      default: return "💭";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <BackBar label="Back" to="/" />
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Counseling</h1>
            <p className="text-muted-foreground">Book with our campus counselor</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-primary hover:shadow-glow">
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Book Counseling Session
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={bookSession} className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label> Counselor</Label>
                      <Input value={`${counselors[0].name}`} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label> Date</Label>
                      <Input type="date" value={preferredDate} readOnly />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label> Time</Label>
                      <Input type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-2 bg-gradient-primary" disabled={loading}>
                    {loading ? 'Booking...' : 'Book Session'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {isLoadingBookings ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No counseling sessions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by booking a session with one of our counselors.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{booking.counselors?.name || 'Campus Counselor'}</h3>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">General Counseling</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{new Date(booking.confirmed_date || booking.preferred_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{booking.confirmed_time || booking.preferred_time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => { setEditing(booking); setEditTime(booking.preferred_time); setEditOpen(true); }}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={async () => { await supabase.from('counseling_bookings').delete().eq('id', booking.id); setBookings(prev => prev.filter(b => b.id !== booking.id)); }}>Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Counseling;