import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BackBar } from "@/components/BackBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, Pencil, Trash2 } from "lucide-react";

const AdminMedicalAppointment = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editTime, setEditTime] = useState("");

  const statusClass = (s: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | string) => {
    switch (s) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'scheduled':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("id, user_id, doctor_id, appointment_date, appointment_time, status")
      .order("created_at", { ascending: false });
    setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (row: any) => {
    setEditing(row);
    setEditTime(row.appointment_time);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    await supabase.from("appointments").update({ appointment_time: editTime }).eq("id", editing.id);
    setEditOpen(false);
    setEditing(null);
    load();
  };

  const deleteRow = async (id: string) => {
    await supabase.from("appointments").delete().eq("id", id);
    setAppointments((prev) => prev.filter((r) => r.id !== id));
  };

  const updateStatus = async (
    id: string,
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  ) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    setAppointments((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <section className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <BackBar label="Back" to="/admin" />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medical Appointment</h1>
            <p className="text-sm text-muted-foreground">Manage student medical appointments</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-4">
          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">scheduled</span>
          <span className="px-2 py-1 rounded bg-green-100 text-green-800">confirmed</span>
          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800">completed</span>
          <span className="px-2 py-1 rounded bg-red-100 text-red-800">cancelled</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No appointments yet</p>
        ) : (
          <div className="grid gap-4">
            {appointments.map((row) => (
              <Card key={row.id} className="border-border">
                <CardContent className="p-4 flex items-start justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Student</div>
                    <div className="font-medium">
                      {(row.student_name && row.student_name.trim()) ? row.student_name : (row._profile?.full_name ? row._profile.full_name : row.user_id?.slice(0,8) + "…")}
                      {(row.student_roll && row.student_roll.trim()) ? (
                        <span className="text-muted-foreground"> ( {row.student_roll} )</span>
                      ) : (row._profile?.roll_number ? (
                        <span className="text-muted-foreground"> ( {row._profile.roll_number} )</span>
                      ) : null)}
                    </div>
                    <div className="text-sm mt-1">• Doctor: {row.doctor_id}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Calendar className="w-4 h-4" /> {new Date(row.appointment_date).toLocaleDateString()} • <Clock className="w-4 h-4" /> {row.appointment_time}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusClass(row.status)}`}>{row.status}</span>
                    <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={() => updateStatus(row.id, 'confirmed')}>Approve</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm" onClick={() => updateStatus(row.id, 'completed')}>Completed</Button>
                    <Button variant="destructive" size="sm" onClick={() => updateStatus(row.id, 'cancelled')}>Decline</Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteRow(row.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[380px]">
            <DialogHeader>
              <DialogTitle>Edit Appointment Time</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Time</Label>
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
    </section>
  );
};

export default AdminMedicalAppointment;
