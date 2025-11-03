import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MessageCircle, Accessibility, Pill, HeartPulse, AlertTriangle, ArrowRight, ClipboardList, Pencil, Trash2 } from "lucide-react";
import { BackBar } from "@/components/BackBar";
// imports consolidated above
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type KPI = { label: string; value: string; sub?: string };
type RecentItem = { id: string; title: string; meta: string; status?: string };

const Admin = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  // Auth check (demo admin or supabase role admin). No DB fetching.
  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email?.toLowerCase();
        const role = (session?.user?.user_metadata as any)?.role as string | undefined;
        const isAdmin = (role || "").toLowerCase() === "admin" || email === "admin@university.edu";
        if (isAdmin) {
          setAuthorized(true);
        } else {
          navigate("/auth", { replace: true });
        }
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [navigate]);

  // Mock KPIs (no backend)
  const kpis: KPI[] = [
    { label: "Today's Appointments", value: "18", sub: "+3 vs yesterday" },
    { label: "Pending Counseling", value: "7", sub: "2 urgent" },
    { label: "Wheelchair Bookings", value: "12", sub: "4 in-progress" },
    { label: "Medicine Orders", value: "24", sub: "6 awaiting pickup" },
  ];

  const quickManage = [
    { icon: Calendar, title: "Medical Appointment", href: "/admin/appointments", desc: "Create, reassign, and close" },
    { icon: MessageCircle, title: "Counseling", href: "/admin/counseling", desc: "Track sessions & outcomes" },
    { icon: Accessibility, title: "Wheelchairs", href: "/admin/wheelchairs", desc: "Inventory & bookings" },
    { icon: Pill, title: "Medicines", href: "/medicines", desc: "Orders & stock" },
    { icon: HeartPulse, title: "Wellness", href: "/wellness", desc: "Programs & enrollments" },
    { icon: AlertTriangle, title: "Emergency", href: "/emergency", desc: "SOS logs & audits" },
  ];

  const [adminAppointments, setAdminAppointments] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editTime, setEditTime] = useState("");


  useEffect(() => {
    const loadAll = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, user_id, doctor_id, appointment_date, appointment_time, status')
        .order('created_at', { ascending: false });
      if (!error && data) setAdminAppointments(data);
    };
    loadAll();
  }, []);

  const refreshAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('id, user_id, doctor_id, appointment_date, appointment_time, status')
      .order('created_at', { ascending: false });
    if (data) setAdminAppointments(data);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setEditTime(row.appointment_time);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    await supabase.from('appointments').update({ appointment_time: editTime }).eq('id', editing.id);
    setEditOpen(false);
    setEditing(null);
    refreshAppointments();
  };

  const deleteRow = async (id: string) => {
    await supabase.from('appointments').delete().eq('id', id);
    setAdminAppointments(adminAppointments.filter(appointment => appointment.id !== id));
  };



  const recentAppointments: RecentItem[] = [
    { id: "A-1024", title: "Dr. Smith • John D.", meta: "Today 10:30 AM • Cardiology", status: "scheduled" },
    { id: "A-1025", title: "Dr. Lee • Priya K.", meta: "Today 12:00 PM • General", status: "scheduled" },
    { id: "A-1026", title: "Dr. Johnson • Alex R.", meta: "Tomorrow 09:15 AM • Pediatrics", status: "pending" },
  ];

  const recentCounseling: RecentItem[] = [
    { id: "C-346", title: "Sarah J. • Anxiety", meta: "Today 3:00 PM • Online", status: "pending" },
    { id: "C-347", title: "Michael B. • Stress", meta: "Tomorrow 11:30 AM • In-Person", status: "scheduled" },
  ];

  if (checking) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading admin...</div>
      </section>
    );
  }
  if (!authorized) return null;

  return (
    <section className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <BackBar label="Back" to="/" />
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Operational overview and quick management</p>
          </div>

        {/* Edit dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[380px]">
            <DialogHeader>
              <DialogTitle>Edit Appointment Time</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <label className="block text-sm mb-1">Time</label>
                <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full border rounded px-3 py-2 bg-background" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={saveEdit}>Save</Button>
                <Button className="flex-1" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4 bg-card border-border">
              <div className="text-xs text-muted-foreground mb-1">{k.label}</div>
              <div className="text-2xl font-bold text-foreground">{k.value}</div>
              {k.sub && <div className="text-xs text-muted-foreground mt-1">{k.sub}</div>}
            </Card>
          ))}
        </div>

        {/* Quick manage tiles */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {quickManage.map((m) => (
            <Card key={m.title} className="p-4 bg-card border-border hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <m.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">{m.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{m.desc}</p>
                  <Button variant="secondary" onClick={() => navigate(m.href)}>Manage</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>


    </section>
  );
};

export default Admin;
