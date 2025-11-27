import { useEffect, useState, useRef } from "react";
import { Check, MapPin } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Accessibility, Pill, HeartPulse, AlertTriangle, ArrowRight, ClipboardList, Pencil, Trash2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LiveLocationMap from "@/components/LiveLocationMap";

type KPI = { label: string; value: string; sub?: string };
type RecentItem = { id: string; title: string; meta: string; status?: string };

interface SOSAlert {
  id: string;
  user_id: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  created_at: string | null;
  resolved: boolean;
  user_name?: string | null;
  student_name?: string | null;
  student_roll?: string | null;
  location?: string | null;
  additional_info?: any;
  address?: string | null;
  profiles: { full_name: string | null; roll_number: string | null } | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const profilesCache = useRef<Record<string, { full_name: string | null; roll_number: string | null }>>({});
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolving, setResolving] = useState<Record<string, boolean>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const livePulseRef = useRef<number | null>(null);
  const [liveTick, setLiveTick] = useState(0); // triggers small pulse animation when updates arrive
  
  // Alert sound for new SOS notifications
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const previousAlertCountRef = useRef<number>(0);

  // Play alert sound
  const playAlertSound = () => {
    if (alertAudioRef.current) {
      alertAudioRef.current.loop = true;
      alertAudioRef.current.volume = 1.0;
      alertAudioRef.current.play()
        .then(() => setIsPlayingSound(true))
        .catch(error => console.error("Error playing audio:", error));
    }
  };

  // Stop alert sound
  const stopAlertSound = () => {
    if (alertAudioRef.current) {
      alertAudioRef.current.pause();
      alertAudioRef.current.currentTime = 0;
      alertAudioRef.current.loop = false;
      setIsPlayingSound(false);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (alertAudioRef.current) {
        alertAudioRef.current.pause();
        alertAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Auth check (demo admin or supabase role admin). No DB fetching.
  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email?.toLowerCase();
        const role = (session?.user?.user_metadata as any)?.role as string | undefined;
        const isAdmin = (role || "").toLowerCase() === "admin" || email === "admin@university.edu";
        // TEMP: allow any authenticated user to open admin to unblock access
        if (session) {
          setAuthorized(true);
        } else {
          navigate("/auth", { replace: true });
        }
        // If you want to restrict later, replace the above with:
        // setAuthorized(isAdmin);
        // if (!isAdmin) navigate("/auth", { replace: true });
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
    { icon: Pill, title: "Medicines", href: "/admin/medicines", desc: "Orders & stock" },
    { icon: HeartPulse, title: "Wellness", href: "/wellness", desc: "Programs & enrollments" },
    
  ];

  const [adminAppointments, setAdminAppointments] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editTime, setEditTime] = useState("");


  useEffect(() => {
    const loadAll = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, user_id, doctor_id, appointment_date, appointment_time, status, profiles(full_name, roll_number)')
        .order('created_at', { ascending: false });
      if (!error && data) setAdminAppointments(data);
    };
    loadAll();
  }, []);

  const refreshAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('id, user_id, doctor_id, appointment_date, appointment_time, status, profiles(full_name, roll_number)')
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

  useEffect(() => {
    const fetchSosAlerts = async () => {
      setIsLoading(true);
      // 1) Fetch latest alerts with only needed columns
      const { data: alerts, error: alertsErr } = await supabase
        .from('emergency_alerts' as any)
        .select('id, user_id, user_name, student_name, student_roll, latitude, longitude, address, location, created_at, resolved, additional_info')
        .order('created_at', { ascending: false })
        .limit(25);

      if (alertsErr) {
        console.error('Error fetching alerts:', alertsErr);
        setIsLoading(false);
        return;
      }

      const list = alerts as any[];
      if (!list || list.length === 0) {
        setSosAlerts([]);
        setIsLoading(false);
        return;
      }

      // 2) If name/roll missing, fetch profiles just for those users (use cache to minimize hits)
      const missingIds = Array.from(new Set(
        list
          .filter(a => !a?.student_name || !a?.student_roll)
          .map(a => a.user_id)
          .filter((id): id is string => Boolean(id) && !profilesCache.current[id])
      ));
      if (missingIds.length > 0) {
        const { data: profs } = await (supabase.from as any)('profiles')
          .select('id, full_name, roll_number')
          .in('id', missingIds);
        if (profs) {
          for (const p of profs as any[]) {
            profilesCache.current[p.id] = { full_name: p.full_name ?? null, roll_number: p.roll_number ?? null };
          }
        }
      }

      const merged = list.map((a: any) => {
        const lat = a.latitude ?? a.lat ?? a.location_lat ?? a.coords_lat ?? a?.additional_info?.latitude ?? null;
        const lon = a.longitude ?? a.lng ?? a.location_lng ?? a.coords_lng ?? a?.additional_info?.longitude ?? null;
        const norm = {
          id: a.id,
          user_id: a.user_id,
          user_name: a.user_name ?? null,
          student_name: a.student_name ?? a?.additional_info?.full_name ?? null,
          student_roll: a.student_roll ?? a?.additional_info?.roll_number ?? null,
          latitude: typeof lat === 'string' ? parseFloat(lat) : lat,
          longitude: typeof lon === 'string' ? parseFloat(lon) : lon,
          created_at: a.created_at ?? a.createdAt ?? null,
          resolved: a.resolved ?? false,
          location: a.location ?? null,
          additional_info: a.additional_info ?? null,
          address: a.address ?? a?.additional_info?.address ?? null,
        } as any;
        const prof = profilesCache.current[a.user_id] || null;
        return { ...norm, profiles: prof } as SOSAlert;
      }) as any;
      setSosAlerts(merged);
      setIsLoading(false);
      setLastUpdated(new Date());
    };

    fetchSosAlerts();

    // Realtime subscription for instant updates
    const subscription = supabase
      .channel('sos_alerts_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_alerts' },
        (payload) => {
          const row: any = payload.new || payload.old;
          if (!row) return fetchSosAlerts();
          const lat = row.latitude ?? row.lat ?? row.location_lat ?? row.coords_lat ?? row?.additional_info?.latitude ?? null;
          const lon = row.longitude ?? row.lng ?? row.location_lng ?? row.coords_lng ?? row?.additional_info?.longitude ?? null;
          const normalized: SOSAlert = {
            id: row.id,
            user_id: row.user_id,
            user_name: row.user_name ?? null,
            latitude: typeof lat === 'string' ? parseFloat(lat) : lat,
            longitude: typeof lon === 'string' ? parseFloat(lon) : lon,
            created_at: row.created_at ?? null,
            resolved: row.resolved ?? false,
            location: row.location ?? null,
            additional_info: row.additional_info ?? null,
            profiles: profilesCache.current[row.user_id] ?? null,
          };
          setSosAlerts((prev) => {
            const idx = prev.findIndex(a => a.id === normalized.id);
            if (payload.eventType === 'DELETE') {
              return idx >= 0 ? [...prev.slice(0, idx), ...prev.slice(idx + 1)] : prev;
            }
            if (idx >= 0) {
              const copy = prev.slice();
              copy[idx] = normalized;
              return copy;
            }
            // New alert inserted - play sound!
            if (payload.eventType === 'INSERT' && !normalized.resolved) {
              playAlertSound();
            }
            return [normalized, ...prev].slice(0, 25);
          });
          setLastUpdated(new Date());
          // Trigger a small pulse effect in UI
          if (livePulseRef.current) window.clearTimeout(livePulseRef.current);
          setLiveTick((t) => t + 1);
          livePulseRef.current = window.setTimeout(() => setLiveTick((t) => t + 1), 600);
        }
      )
      .subscribe();

    // Fallback polling every 12 seconds in case realtime is disconnected transiently
    const pollId = window.setInterval(() => {
      fetchSosAlerts();
    }, 12000);

    return () => {
      supabase.removeChannel(subscription);
      if (pollId) window.clearInterval(pollId);
      if (livePulseRef.current) window.clearTimeout(livePulseRef.current);
    };
  }, []);

  const resolveAlert = async (id: string) => {
    setResolving(prev => ({ ...prev, [id]: true }));
    try {
      await (supabase.from as any)('emergency_alerts').delete().eq('id', id);
      // Optimistically remove from UI in case realtime is delayed
      setSosAlerts(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Failed to resolve alert', e);
    } finally {
      setResolving(prev => ({ ...prev, [id]: false }));
    }
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

  // Helpers for safe rendering
  const fmtCoord = (n: unknown) => {
    if (typeof n === 'number' && isFinite(n)) return n.toFixed(4);
    if (typeof n === 'string') {
      const v = parseFloat(n);
      if (!Number.isNaN(v) && isFinite(v)) return v.toFixed(4);
    }
    return 'N/A';
  };
  const unresolved = sosAlerts.filter(a => a.resolved === false);
  const firstUnresolvedWithCoords = unresolved.find(a => typeof a.latitude === 'number' && isFinite(a.latitude) && typeof a.longitude === 'number' && isFinite(a.longitude));
  const firstAnyWithCoords = sosAlerts.find(a => typeof a.latitude === 'number' && isFinite(a.latitude) && typeof a.longitude === 'number' && isFinite(a.longitude));
  const selected = selectedAlertId ? sosAlerts.find(a => a.id === selectedAlertId) : undefined;
  const parseNum = (v: any): number | undefined => {
    const f = typeof v === 'number' ? v : (typeof v === 'string' ? parseFloat(v) : NaN);
    return Number.isFinite(f) ? f : undefined;
  };
  const chooseCenter = (a?: SOSAlert) => {
    if (!a) return undefined;
    const lat = parseNum(a.latitude);
    const lon = parseNum(a.longitude);
    if (lat !== undefined && lon !== undefined) return { latitude: lat, longitude: lon } as { latitude: number; longitude: number };
    return undefined;
  };
  const mapCenter = chooseCenter(selected) || chooseCenter(firstUnresolvedWithCoords) || chooseCenter(firstAnyWithCoords);

  // Helpers to render identity and location details
  const renderName = (a: any) => {
    const raw = a?.profiles?.full_name || a?.student_name || a?.user_name || a?.additional_info?.full_name || a?.additional_info?.email || `User: ${String(a?.user_id || '').substring(0,8)}...`;
    return String(raw).toUpperCase();
  };
  const renderRoll = (a: any) => a?.student_roll || a?.profiles?.roll_number || a?.additional_info?.roll_number || null;
  const pickAddressField = (a: any): string | null => {
    const addr = a?.address || a?.place || a?.geo_address || (a?.additional_info && (a.additional_info.address || a.additional_info.location));
    if (typeof addr === 'string' && addr.trim()) return addr.trim();
    return null;
  };
  const renderLocationLine = (a: any) => {
    const addr = pickAddressField(a);
    if (addr) return addr;
    const latStr = fmtCoord(a?.latitude);
    const lonStr = fmtCoord(a?.longitude);
    if (latStr !== 'N/A' && lonStr !== 'N/A') return `Lat: ${latStr}, Lon: ${lonStr}`;
    return 'Location unavailable';
  };

  return (
    <section className="min-h-screen bg-background px-4 py-8">
      {/* Hidden audio element for SOS alert sound */}
      <audio
        ref={alertAudioRef}
        src="/Alertsound.mp3"
        preload="auto"
        loop
        style={{ display: 'none' }}
      />
      
      {/* Stop Sound Button - shows when sound is playing */}
      {isPlayingSound && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={stopAlertSound}
            variant="destructive"
            className="animate-pulse shadow-lg gap-2"
          >
            🔊 Stop Alert Sound
          </Button>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
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

        {/* Emergency Monitoring Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Emergency Monitoring</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Emergency Details */}
            <Card className="p-4 bg-card border-border h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-foreground">Active Alerts</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className={`flex items-center gap-1 ${liveTick % 2 === 0 ? 'opacity-100' : 'opacity-70'} transition-opacity`}>
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Live</span>
              </div>
              {lastUpdated && (
                <span>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              )}
            </div>
          </div>
              {unresolved.length === 0 ? (
                <div>
                  <div className="text-muted-foreground mb-2">No active alerts.</div>
                  {sosAlerts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Recent Alerts</h4>
                      {isLoading ? (
                        <div className="flex justify-center items-center p-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : sosAlerts.length > 0 ? (
                        <div className="space-y-2">
                          {sosAlerts.map((alert) => (
                            <div key={alert.id} className="rounded-md p-3 border border-border/60 bg-card/40 hover:bg-card/60 transition-colors">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-foreground uppercase">
                                    {renderName(alert)}
                                    {alert.resolved && <span className="ml-2 text-xs text-muted-foreground normal-case">(resolved)</span>}
                                    {renderRoll(alert) && (
                                      <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Roll: {renderRoll(alert)}</span>
                                    )}
                                  </p>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                                  {new Date(alert.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">{renderLocationLine(alert)}</p>
                              <div className="flex items-center gap-2 mt-3 p-1 rounded-full bg-muted/10 w-fit">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 p-0 rounded-full border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                                  onClick={() => setSelectedAlertId(alert.id)}
                                  aria-label="View on map"
                                  title="View on map"
                                >
                                  <MapPin className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 p-0 rounded-full border-green-600 text-green-600 hover:bg-green-600/10"
                                  disabled={Boolean(resolving[alert.id])}
                                  onClick={() => resolveAlert(alert.id)}
                                  aria-label="Resolve alert"
                                  title="Resolve alert"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No emergency alerts found.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                isLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sosAlerts.map((alert) => (
                      <div key={alert.id} className="border-b pb-2 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground uppercase">{renderName(alert)}{alert.resolved && <span className="ml-2 text-xs text-muted-foreground normal-case">(resolved)</span>}</p>
                            {renderRoll(alert) && <p className="text-xs text-muted-foreground">Roll: <span className="font-medium">{renderRoll(alert)}</span></p>}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{renderLocationLine(alert)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 p-0 rounded-full border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                            onClick={() => setSelectedAlertId(alert.id)}
                            aria-label="View on map"
                            title="View on map"
                          >
                            <MapPin className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 p-0 rounded-full border-green-600 text-green-600 hover:bg-green-600/10"
                            disabled={Boolean(resolving[alert.id])}
                            onClick={() => resolveAlert(alert.id)}
                            aria-label="Resolve alert"
                            title="Resolve alert"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </Card>
            {/* Live Map */}
            <Card className="p-0 overflow-hidden bg-card border-border h-full flex">
              <div className="h-full min-h-[420px] w-full">
                <LiveLocationMap
                  sosAlerts={sosAlerts as any}
                  location={mapCenter}
                  isActive={Boolean(mapCenter)}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Admin;