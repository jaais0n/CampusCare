import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, Plus, Users, Clock, MapPin, Calendar, Trophy, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [loading, setLoading] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<WellnessProgram | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    const checkSessionAndFetchData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate("/auth", { state: { message: "You must be logged in to access wellness programs." } });
        return;
      }

      setUser(session.user);
      fetchPrograms();
    };

    checkSessionAndFetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth", { state: { message: "Your session has expired. Please log in again." } });
      } else {
        setUser(session.user);
        // Bookings disabled for static wellness content
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const fetchPrograms = async () => {
    // Static sample programs with videos; no database calls
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
        name: 'Guided Mindfulness',
        type: 'Meditation',
        description: '15-minute guided meditation for focus and calm.',
        instructor_name: 'Anita Verma',
        instructor_qualification: 'Mindfulness Coach',
        duration_minutes: 15,
        max_capacity: 100,
        current_enrollment: 0,
        price: 0,
        difficulty_level: 'beginner',
        location: 'Quiet Room',
        schedule_days: ['Daily'],
        start_time: '20:00',
        end_time: '20:15',
        equipment_required: 'Quiet space, optional headphones',
        is_active: true,
        video_url: 'https://www.youtube.com/watch?v=inpok4MKVLM'
      }
    ];
    setPrograms(staticPrograms);
  };

  const fetchBookings = async (currentUser: SupabaseUser | null) => {
    if (!currentUser) return;
    
    const { data, error } = await supabase
      .from("program_bookings")
      .select(`
        *,
        wellness_programs (*)
      `)
      .eq("user_id", currentUser.id)
      .order("enrollment_date", { ascending: false });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } else {
      setBookings(data || []);
    }
  };

  const enrollInProgram = async () => {
    if (!user || !selectedProgram) return;
    
    setLoading(true);

    const { error } = await supabase
      .from("program_bookings")
      .insert({
        user_id: user.id,
        program_id: selectedProgram.id,
        notes: notes,
        status: "confirmed",
        payment_status: selectedProgram.price > 0 ? "pending" : "completed",
      });

    if (error) {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Enrolled Successfully!",
        description: `You have been enrolled in ${selectedProgram.name}`,
      });
      setIsBookingOpen(false);
      setNotes("");
      setSelectedProgram(null);
      fetchBookings(user);
    }
    setLoading(false);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
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
      case "martial arts": return "🥋";
      case "swimming": return "🏊";
      case "sports": return "⚽";
      default: return "🏃";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "text-success bg-success/10";
      case "pending": return "text-warning bg-warning/10";
      case "cancelled": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-muted/10";
    }
  };

  const isEnrolled = (programId: string) => {
    return bookings.some(booking => 
      booking.wellness_programs.id === programId && 
      booking.status === "confirmed"
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Wellness Programs</h1>
            <p className="text-muted-foreground">Join fitness classes and wellness activities</p>
          </div>
        </div>

        {/* Program Categories (Dance removed) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {["Yoga", "Fitness", "Meditation"].map((category) => (
            <Card key={category} className="text-center hover:shadow-glow transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="text-2xl mb-2">{getTypeIcon(category)}</div>
                <h3 className="font-semibold">{category}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {programs.filter(p => p.type.toLowerCase().includes(category.toLowerCase())).length} programs
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Available Programs */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Available Programs</h2>
          <div className="grid gap-6">
            {programs.map((program) => (
              <Card key={program.id} className="border-primary/20 hover:shadow-glow transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <span className="text-2xl">{getTypeIcon(program.type)}</span>
                      </div>
                      <div>
                        <CardTitle className="text-xl">{program.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          by {program.instructor_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getDifficultyColor(program.difficulty_level)}>
                        {program.difficulty_level}
                      </Badge>
                      {program.price > 0 && (
                        <Badge variant="outline">
                          ₹{program.price}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{program.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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

                  <div className="flex justify-between items-center pt-4">
                    <div className="flex items-center gap-4">
                      {program.price === 0 && (
                        <Badge className="text-success bg-success/10">Free</Badge>
                      )}
                    </div>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      {programs.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Programs Available</h3>
            <p className="text-muted-foreground">Check back later for new wellness programs</p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default Wellness;