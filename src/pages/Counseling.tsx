import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Brain, Plus, Calendar, Clock, MessageSquare, User, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Header from "@/components/Header";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Counselor {
  id: string;
  name: string;
  specialization: string[];
  qualification: string;
  experience_years: number;
  available_days: string[];
  available_modes: string[];
}

interface CounselingBooking {
  id: string;
  preferred_date: string;
  preferred_time: string;
  category: string;
  mode: string;
  issue_description: string;
  is_anonymous: boolean;
  anonymous_contact: string;
  status: string;
  counselors: Counselor;
  confirmed_date?: string;
  confirmed_time?: string;
  meeting_link?: string;
  session_notes?: string;
}

const Counseling = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [bookings, setBookings] = useState<CounselingBooking[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Form states
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [category, setCategory] = useState<"academic" | "personal" | "career" | "stress" | "relationships" | "other">("personal");
  const [mode, setMode] = useState<"in_person" | "online">("online");
  const [issueDescription, setIssueDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousContact, setAnonymousContact] = useState("");

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

    fetchCounselors();
    if (user) fetchBookings();

    return () => subscription.unsubscribe();
  }, [user]);

  const fetchCounselors = async () => {
    const { data, error } = await supabase
      .from("counselors")
      .select("*")
      .eq("is_active", true);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch counselors",
        variant: "destructive",
      });
    } else {
      setCounselors(data || []);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("counseling_bookings")
      .select(`
        *,
        counselors (
          id,
          name,
          specialization,
          qualification,
          experience_years,
          available_days,
          available_modes
        )
      `)
      .eq("user_id", user.id)
      .order("preferred_date", { ascending: false });
    
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

  const bookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !isAnonymous) return;
    
    setLoading(true);

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
      case "pending": return "text-warning bg-warning/10";
      case "confirmed": return "text-success bg-success/10";
      case "completed": return "text-primary bg-primary/10";
      case "cancelled": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-muted/10";
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
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Counseling Services</h1>
            <p className="text-muted-foreground">Professional support for your mental wellbeing</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:shadow-glow">
                <Plus className="w-4 h-4 mr-2" />
                Book Session
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
                <div className="flex items-center space-x-2 p-3 bg-secondary/20 rounded-lg">
                  <Switch
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                  <Label htmlFor="anonymous" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Anonymous Session
                  </Label>
                </div>

                {isAnonymous && (
                  <div className="space-y-2">
                    <Label htmlFor="contact">Anonymous Contact Info</Label>
                    <Input
                      id="contact"
                      value={anonymousContact}
                      onChange={(e) => setAnonymousContact(e.target.value)}
                      placeholder="How should we contact you? (phone/email)"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Select Counselor</Label>
                  <Select value={selectedCounselor} onValueChange={setSelectedCounselor} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a counselor" />
                    </SelectTrigger>
                    <SelectContent>
                      {counselors.map((counselor) => (
                        <SelectItem key={counselor.id} value={counselor.id}>
                          {counselor.name} - {counselor.specialization.join(", ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Preferred Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Preferred Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic Stress</SelectItem>
                        <SelectItem value="personal">Personal Issues</SelectItem>
                        <SelectItem value="career">Career Guidance</SelectItem>
                        <SelectItem value="mental_health">Mental Health</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select value={mode} onValueChange={(value: any) => setMode(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="in_person">In Person</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issue">Issue Description (Optional)</Label>
                  <Textarea
                    id="issue"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Brief description of what you'd like to discuss..."
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">
                  {loading ? "Booking..." : "Book Session"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {bookings.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Sessions Yet</h3>
                <p className="text-muted-foreground mb-4">Book your first counseling session</p>
                <Button onClick={() => setIsOpen(true)} className="bg-gradient-primary">
                  Book Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <span className="text-lg">{getCategoryIcon(booking.category)}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {booking.counselors.name}
                          {booking.is_anonymous && <Shield className="w-4 h-4 text-muted-foreground" />}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {booking.counselors.specialization.join(", ")}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        {booking.confirmed_date 
                          ? new Date(booking.confirmed_date).toLocaleDateString()
                          : new Date(booking.preferred_date).toLocaleDateString()
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{booking.confirmed_time || booking.preferred_time}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-secondary/20 rounded text-xs">
                      {booking.category.replace("_", " ")}
                    </span>
                    <span className="px-2 py-1 bg-secondary/20 rounded text-xs">
                      {booking.mode.replace("_", " ")}
                    </span>
                  </div>

                  {booking.issue_description && (
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Topic</h4>
                      <p className="text-sm text-muted-foreground">{booking.issue_description}</p>
                    </div>
                  )}

                  {booking.meeting_link && (
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <h4 className="font-medium text-primary mb-1">Meeting Link</h4>
                      <a 
                        href={booking.meeting_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Join Session
                      </a>
                    </div>
                  )}

                  {booking.session_notes && (
                    <div className="bg-success/10 p-3 rounded-lg">
                      <h4 className="font-medium text-success mb-1">Session Notes</h4>
                      <p className="text-sm text-success-foreground">{booking.session_notes}</p>
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

export default Counseling;