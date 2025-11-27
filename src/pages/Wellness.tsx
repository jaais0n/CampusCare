import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, Plus, Users, Clock, MapPin, Calendar, Pencil, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { BackBar } from "@/components/BackBar";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface WellnessProgram {
  id: string;
  name: string;
  type: string;
  description: string;
  instructor_name: string;
  instructor_qualification: string;
  duration_minutes: number;
  max_capacity: number;
  current_enrollment: number;
  price: number;
  difficulty_level: string;
  location: string;
  schedule_days: string[];
  start_time: string;
  end_time: string;
  equipment_required: string;
  is_active: boolean;
  video_url?: string;
}

interface ProgramBooking {
  id: string;
  enrollment_date: string;
  status: string;
  payment_status: string;
  notes: string;
  wellness_programs: WellnessProgram;
}

const Wellness = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [programs, setPrograms] = useState<WellnessProgram[]>([]);
  const [bookings, setBookings] = useState<ProgramBooking[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editProgram, setEditProgram] = useState<WellnessProgram | null>(null);

  const { toast } = useToast();

  const isAdmin = user && (user.app_metadata?.role === 'admin' || user.email === 'admin@university.edu');

  useEffect(() => {
    const checkSessionAndFetchData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate("/auth", { state: { message: "You must be logged in to access wellness programs." } });
        return;
      }
      setUser(session.user);
      fetchPrograms();
      fetchBookings(session.user);
    };

    checkSessionAndFetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth", { state: { message: "Your session has expired. Please log in again." } });
      } else {
        setUser(session.user);
        fetchBookings(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Realtime updates so user view reflects admin edits immediately
  useEffect(() => {
    const channel = supabase
      .channel('wellness_programs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_programs' }, () => {
        // Refetch programs whenever a program is inserted/updated/deleted
        fetchPrograms();
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, []);

  const fetchPrograms = async () => {
    // Try to load from Supabase first; if table not ready, fall back to static
    try {
      const { data, error } = await supabase
        .from('wellness_programs')
        .select('*')
        .order('name');

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: WellnessProgram[] = data.map((row: any) => ({
          // Prefer external_id (string like 'yoga-1'). Fallback to uuid id as string.
          id: row.external_id || row.id?.toString?.() || row.id,
          name: row.name || '',
          type: row.type || 'Fitness',
          description: row.description || '',
          instructor_name: row.instructor_name || '',
          instructor_qualification: row.instructor_qualification || '',
          duration_minutes: Number(row.duration_minutes) || 0,
          max_capacity: Number(row.max_capacity) || 0,
          current_enrollment: Number(row.current_enrollment) || 0,
          price: Number(row.price) || 0,
          difficulty_level: row.difficulty_level || 'beginner',
          location: row.location || '',
          schedule_days: Array.isArray(row.schedule_days)
            ? row.schedule_days
            : (row.schedule_days ? String(row.schedule_days).split(',').map((s: string) => s.trim()).filter(Boolean) : []),
          start_time: row.start_time || '',
          end_time: row.end_time || '',
          equipment_required: row.equipment_required || '',
          is_active: row.is_active ?? true,
          video_url: row.video_url || undefined,
        }));
        setPrograms(mapped);
        return;
      }
    } catch (e) {
      console.warn('Falling back to static wellness programs. Reason:', e);
    }

    // Fallback static programs
    const staticPrograms: WellnessProgram[] = [
      {
        id: 'yoga-1',
        name: 'Morning Yoga Flow',
        type: 'Yoga',
        description: 'A gentle 30-minute flow to energize your morning.',
        instructor_name: 'Priya Sharma',
        instructor_qualification: 'RYT-500 Certified',
        duration_minutes: 30,
        max_capacity: 100,
        current_enrollment: 0,
        price: 0,
        difficulty_level: 'beginner',
        location: 'Wellness Studio A',
        schedule_days: ['Mon', 'Wed', 'Fri'],
        start_time: '06:30',
        end_time: '07:00',
        equipment_required: 'Yoga mat, water bottle',
        is_active: true,
        video_url: 'https://www.youtube.com/watch?v=v7AYKMP6rOE'
      },
      {
        id: 'fitness-1',
        name: 'Campus HIIT Express',
        type: 'Fitness',
        description: '20-minute HIIT session to boost stamina and burn calories.',
        instructor_name: 'Rahul Mehta',
        instructor_qualification: 'ACE Certified Trainer',
        duration_minutes: 20,
        max_capacity: 100,
        current_enrollment: 0,
        price: 0,
        difficulty_level: 'intermediate',
        location: 'Gym Hall',
        schedule_days: ['Tue', 'Thu'],
        start_time: '18:00',
        end_time: '18:20',
        equipment_required: 'Towel, water bottle',
        is_active: true,
        video_url: 'https://www.youtube.com/watch?v=ml6cT4AZdqI'
      },
      {
        id: 'meditation-1',
        name: 'Mindfulness Meditation',
        type: 'Meditation',
        description: 'Guided meditation to reduce stress and improve focus.',
        instructor_name: 'Dr. Anjali Verma',
        instructor_qualification: 'PhD, Psychology',
        duration_minutes: 15,
        max_capacity: 100,
        current_enrollment: 0,
        price: 0,
        difficulty_level: 'beginner',
        location: 'Quiet Room, Library',
        schedule_days: ['Daily'],
        start_time: '12:00',
        end_time: '12:15',
        equipment_required: 'None',
        is_active: true,
        video_url: 'https://www.youtube.com/watch?v=O-6f5wQXSu8'
      }
    ];
    setPrograms(staticPrograms);
  };

  const fetchBookings = async (currentUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('program_bookings')
        .select(`*, wellness_programs (*)`)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      setBookings(data as ProgramBooking[]);
    } catch (error) {
      console.warn('Could not fetch bookings, table might not exist yet.');
      setBookings([]);
    }
  };

  const openEdit = (program: WellnessProgram) => {
    setEditProgram({ ...program });
    setIsEditOpen(true);
  };

  const handleEditChange = (field: keyof WellnessProgram, value: any) => {
    setEditProgram(prev => prev ? { ...prev, [field]: value } as WellnessProgram : prev);
  };

  // Create a brand-new program (admin). Uses a string external_id for human-readability.
  const createNewProgram = () => {
    const now = Date.now();
    const defaultType = 'Yoga';
    const newId = `${defaultType.toLowerCase()}-${now}`; // becomes external_id in backend
    const blank: WellnessProgram = {
      id: newId,
      name: '',
      type: defaultType,
      description: '',
      instructor_name: '',
      instructor_qualification: '',
      duration_minutes: 30,
      max_capacity: 50,
      current_enrollment: 0,
      price: 0,
      difficulty_level: 'beginner',
      location: '',
      schedule_days: ['Mon', 'Wed', 'Fri'],
      start_time: '09:00',
      end_time: '09:30',
      equipment_required: '',
      is_active: true,
      video_url: ''
    };
    setEditProgram(blank);
    setIsEditOpen(true);
  };

  const saveProgram = async () => {
    if (!editProgram) return;
    try {
      // Normalize payload for backend (schedule_days must be an array)
      const payload: any = {
        // Use external_id to carry human-readable id from frontend ('yoga-1')
        external_id: editProgram.id,
        name: editProgram.name,
        type: editProgram.type,
        description: editProgram.description,
        instructor_name: editProgram.instructor_name,
        instructor_qualification: editProgram.instructor_qualification,
        duration_minutes: Number(editProgram.duration_minutes) || 0,
        max_capacity: Number(editProgram.max_capacity) || 0,
        current_enrollment: Number(editProgram.current_enrollment) || 0,
        price: Number(editProgram.price) || 0,
        difficulty_level: editProgram.difficulty_level,
        location: editProgram.location,
        schedule_days: Array.isArray(editProgram.schedule_days)
          ? editProgram.schedule_days
          : String(editProgram.schedule_days || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
        start_time: editProgram.start_time,
        end_time: editProgram.end_time,
        equipment_required: editProgram.equipment_required,
        is_active: typeof editProgram.is_active === 'boolean' ? editProgram.is_active : true,
        video_url: editProgram.video_url || null,
      };

      const { error } = await supabase
        .from('wellness_programs')
        // Upsert on external_id to avoid UUID constraint; assumes a unique index on external_id
        .upsert(payload, { onConflict: 'external_id' });
      if (error) throw error;
      // Refetch from backend so all clients (and this one) see the canonical data
      await fetchPrograms();
      toast({ title: 'Program updated', description: `${editProgram.name} has been saved.` });
    } catch (e) {
      console.warn('Upsert wellness_programs failed:', e);
      const message = (e as any)?.message || 'Backend not ready, updated locally only.';
      toast({ title: 'Saved locally', description: message });
    }
    // Optimistic local update as a fallback
    setPrograms(prev => prev.map(p => p.id === editProgram.id ? editProgram : p));
    setIsEditOpen(false);
  };

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner": return "text-success bg-success/10";
      case "intermediate": return "text-warning bg-warning/10";
      case "advanced": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-muted/10";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "yoga": return "🧘";
      case "fitness": return "💪";
      case "meditation": return "🧠";
      default: return "🏃";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <BackBar label="Back" to="/" desktopOnly />
        <div className="flex items-center justify-between my-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Wellness Programs</h1>
            <p className="text-muted-foreground">Join fitness classes and wellness activities</p>
          </div>
          {isAdmin && (
            <Button onClick={createNewProgram} className="bg-gradient-primary hover:shadow-glow">
              <Plus className="w-4 h-4 mr-2" /> Add Program
            </Button>
          )}
        </div>

        {/* Program Categories removed as requested */}

        {/* Available Programs */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Available Programs</h2>
          <div className="grid gap-6">
            {programs.map((program) => (
              <Card key={program.id} className="border-primary/20 hover:shadow-glow transition-all">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/20">
                        <Heart className="w-4 h-4 text-primary" />
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                        {program.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        by {program.instructor_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className={getDifficultyColor(program.difficulty_level)}>
                      {program.difficulty_level}
                    </Badge>
                    {program.price > 0 && (
                      <Badge variant="outline">
                        ₹{program.price}
                      </Badge>
                    )}
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 p-0 rounded-full"
                        aria-label="Edit program"
                        onClick={() => openEdit(program)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{program.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{program.duration_minutes} mins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{program.current_enrollment}/{program.max_capacity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{program.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{program.schedule_days.join(", ")}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Schedule:</span>
                      <p className="font-medium">{program.start_time} - {program.end_time}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Instructor:</span>
                      <p className="font-medium">{program.instructor_qualification}</p>
                    </div>
                  </div>

                  {program.equipment_required && (
                    <div>
                      <span className="text-muted-foreground text-sm">Equipment needed:</span>
                      <p className="text-sm">{program.equipment_required}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-4">
                      {program.price === 0 && (
                        <Badge className="text-success bg-success/10">Free</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          if (program.video_url) {
                            window.open(program.video_url, '_blank');
                          }
                        }}
                        className="bg-gradient-primary hover:shadow-glow"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Watch Video
                      </Button>
                      {isAdmin && (
                        <Button variant="secondary" onClick={() => openEdit(program)}>Edit</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {programs.length === 0 && (
          <Card className="py-12 text-center">
            <CardContent>
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">No Programs Available</h3>
              <p className="text-muted-foreground">Check back later for new wellness programs</p>
            </CardContent>
          </Card>
        )}

        {/* Admin Edit Dialog */}
        {isAdmin && editProgram && (
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Edit Program</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="col-span-1 md:col-span-2">
                  <Label>Name</Label>
                  <Input value={editProgram.name} onChange={(e) => handleEditChange('name', e.target.value)} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Input value={editProgram.type} onChange={(e) => handleEditChange('type', e.target.value)} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={editProgram.location} onChange={(e) => handleEditChange('location', e.target.value)} />
                </div>
                <div>
                  <Label>Duration (mins)</Label>
                  <Input type="number" value={editProgram.duration_minutes} onChange={(e) => handleEditChange('duration_minutes', Number(e.target.value))} />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input type="number" value={editProgram.max_capacity} onChange={(e) => handleEditChange('max_capacity', Number(e.target.value))} />
                </div>
                <div>
                  <Label>Price (₹)</Label>
                  <Input type="number" value={editProgram.price} onChange={(e) => handleEditChange('price', Number(e.target.value))} />
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Input value={editProgram.difficulty_level} onChange={(e) => handleEditChange('difficulty_level', e.target.value)} />
                </div>
                <div>
                  <Label>Days (comma separated)</Label>
                  <Input value={editProgram.schedule_days.join(', ')} onChange={(e) => handleEditChange('schedule_days', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                </div>
                <div>
                  <Label>Start Time</Label>
                  <Input type="time" value={editProgram.start_time} onChange={(e) => handleEditChange('start_time', e.target.value)} />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input type="time" value={editProgram.end_time} onChange={(e) => handleEditChange('end_time', e.target.value)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label>Instructor</Label>
                  <Input value={editProgram.instructor_name} onChange={(e) => handleEditChange('instructor_name', e.target.value)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label>Qualification</Label>
                  <Input value={editProgram.instructor_qualification} onChange={(e) => handleEditChange('instructor_qualification', e.target.value)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label>Equipment</Label>
                  <Input value={editProgram.equipment_required} onChange={(e) => handleEditChange('equipment_required', e.target.value)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={editProgram.description} onChange={(e) => handleEditChange('description', e.target.value)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label>Video URL</Label>
                  <Input value={editProgram.video_url || ''} onChange={(e) => handleEditChange('video_url', e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setIsEditOpen(false)}><X className="w-4 h-4 mr-1" />Cancel</Button>
                <Button onClick={saveProgram}><Save className="w-4 h-4 mr-1" />Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Wellness;