import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BackBar } from "@/components/BackBar";
import { Calendar, RefreshCw } from "lucide-react";
import { useNotificationSound } from "@/hooks/use-notification-sound";

const AdminCounseling = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editTime, setEditTime] = useState("");
  const { toast } = useToast();
  const { playNotification } = useNotificationSound();
  const initialLoadRef = useRef(true);

  // Status chip classes
  const statusClass = (s: string) => {
    switch (s) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending':
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('counseling_bookings')
      .select('id, user_id, counselor_id, preferred_date, preferred_time, status, student_name, student_roll, issue_description')
      .order('preferred_date', { ascending: false })
      .order('preferred_time', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load counseling bookings",
        variant: "destructive",
      });
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setEditTime(row.preferred_time || "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from('counseling_bookings')
      .update({ preferred_time: editTime })
      .eq('id', editing.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update time", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Time updated successfully" });
      setEditOpen(false);
      setEditing(null);
      load();
    }
  };

  const deleteBooking = async (id: string) => {
    const { error } = await supabase.from('counseling_bookings').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete booking", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Booking deleted" });
      setBookings(prev => prev.filter(r => r.id !== id));
    }
  };

  const updateStatus = async (id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    const { error } = await supabase.from('counseling_bookings').update({ status }).eq('id', id);
    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Status updated to ${status}` });
      setBookings(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  useEffect(() => { 
    load();
    
    // Realtime subscription for new/updated counseling bookings
    const subscription = supabase
      .channel('admin_counseling_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'counseling_bookings' },
        (payload) => {
          // Skip notification on initial load
          if (initialLoadRef.current) return;
          
          if (payload.eventType === 'INSERT') {
            playNotification();
            toast({
              title: "New Counseling Request!",
              description: "A new counseling session has been booked",
            });
          } else if (payload.eventType === 'UPDATE') {
            playNotification();
            toast({
              title: "Booking Updated",
              description: "A counseling booking has been modified",
            });
          }
          load(); // Refresh the list
        }
      )
      .subscribe();

    // Mark initial load complete after first load
    setTimeout(() => { initialLoadRef.current = false; }, 2000);

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <BackBar label="Back to Admin" to="/admin" desktopOnly />
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Counseling Bookings</h1>
            <p className="text-muted-foreground">Manage all counseling sessions</p>
          </div>
          <Button onClick={load} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-6">
          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">scheduled</span>
          <span className="px-2 py-1 rounded bg-green-100 text-green-800">confirmed</span>
          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800">completed</span>
          <span className="px-2 py-1 rounded bg-red-100 text-red-800">cancelled</span>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading counseling bookings...</p>
              </div>
            </CardContent>
          </Card>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No counseling bookings yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="font-medium">
                        Student: {booking.student_name || (booking.user_id ? booking.user_id.slice(0,8) + '…' : '—')}
                        {booking.student_roll ? <span className="text-muted-foreground"> ( {booking.student_roll} )</span> : null}
                      </p>
                      <p className="text-sm text-muted-foreground">Counselor: {booking.counselor_id}</p>
                      {booking.issue_description && (
                        <p className="text-xs text-muted-foreground">• {booking.issue_description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(booking.preferred_date).toLocaleDateString()} • {booking.preferred_time}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusClass(booking.status)}`}>
                        {booking.status}
                      </span>
                      <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={() => updateStatus(booking.id, 'confirmed')}>Approve</Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm" onClick={() => updateStatus(booking.id, 'completed')}>Completed</Button>
                      <Button variant="destructive" size="sm" onClick={() => updateStatus(booking.id, 'cancelled')}>Decline</Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(booking)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteBooking(booking.id)}>Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Time dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[380px]">
            <DialogHeader>
              <DialogTitle>Edit Counseling Time</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="block text-sm mb-1">Time</label>
                <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={saveEdit}>Save</Button>
                <Button className="flex-1" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminCounseling;
