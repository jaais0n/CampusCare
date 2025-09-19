import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, Plus, Users, Clock, MapPin, Calendar, Trophy, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [programs, setPrograms] = useState<WellnessProgram[]>([]);
  const [bookings, setBookings] = useState<ProgramBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<WellnessProgram | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [notes, setNotes] = useState("");

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

    fetchPrograms();
    if (user) fetchBookings();

    return () => subscription.unsubscribe();
  }, [user]);

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from("wellness_programs")
      .select("*")
      .eq("is_active", true)
      .order("name");
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch wellness programs",
        variant: "destructive",
      });
    } else {
      setPrograms(data || []);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("program_bookings")
      .select(`
        *,
        wellness_programs (*)
      `)
      .eq("user_id", user.id)
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
      fetchBookings();
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
      case "dance": return "💃";
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
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Wellness Programs</h1>
            <p className="text-muted-foreground">Join fitness classes and wellness activities</p>
          </div>
        </div>

        {/* Program Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {["Yoga", "Fitness", "Meditation", "Dance"].map((category) => (
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
                      <div className="text-xs text-muted-foreground">
                        {program.max_capacity - program.current_enrollment} spots left
                      </div>
                    </div>
                    
                    {isEnrolled(program.id) ? (
                      <Badge className="text-success bg-success/10">
                        <Trophy className="w-3 h-3 mr-1" />
                        Enrolled
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => {
                          setSelectedProgram(program);
                          setIsBookingOpen(true);
                        }}
                        disabled={program.current_enrollment >= program.max_capacity}
                        className="bg-gradient-primary hover:shadow-glow"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Enroll Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* My Enrollments */}
        {bookings.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">My Enrollments</h2>
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="border-primary/20">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <span className="text-lg">{getTypeIcon(booking.wellness_programs.type)}</span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{booking.wellness_programs.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Enrolled on {new Date(booking.enrollment_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        {booking.payment_status === "pending" && (
                          <Badge variant="outline">Payment Pending</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{booking.wellness_programs.schedule_days.join(", ")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{booking.wellness_programs.start_time} - {booking.wellness_programs.end_time}</span>
                      </div>
                    </div>
                    {booking.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium text-foreground mb-1">Notes</h4>
                        <p className="text-sm text-muted-foreground">{booking.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Enrollment Dialog */}
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Enroll in Program
              </DialogTitle>
            </DialogHeader>
            {selectedProgram && (
              <div className="space-y-4">
                <div className="bg-secondary/20 p-4 rounded-lg">
                  <h3 className="font-semibold">{selectedProgram.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedProgram.schedule_days.join(", ")} • {selectedProgram.start_time} - {selectedProgram.end_time}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Location: {selectedProgram.location}
                  </p>
                  {selectedProgram.price > 0 && (
                    <p className="font-semibold text-primary">Price: ₹{selectedProgram.price}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requirements or questions..."
                  />
                </div>

                <Button 
                  onClick={enrollInProgram} 
                  disabled={loading}
                  className="w-full bg-gradient-primary"
                >
                  {loading ? "Enrolling..." : "Confirm Enrollment"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {programs.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Programs Available</h3>
              <p className="text-muted-foreground">Check back later for new wellness programs</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Wellness;