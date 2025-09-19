import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Heart, Mail, Lock, User, Phone, BookOpen, IdCard } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

const Auth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"student" | "faculty" | "admin">("student");
  const [rollNumber, setRollNumber] = useState("");
  const [course, setCourse] = useState("");
  const [department, setDepartment] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [designation, setDesignation] = useState("");
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) {
          navigate("/dashboard");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    }
    setLoading(false);
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          phone,
          role,
          roll_number: rollNumber,
          course,
          department,
          faculty_id: facultyId,
          designation,
        }
      }
    });

    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mx-auto mb-4">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">CampusCare+</h1>
          <p className="text-muted-foreground">Your Campus Wellness Platform</p>
        </div>

        <Card className="bg-card/95 backdrop-blur-sm border-primary/20 shadow-glow">
          <CardHeader>
            <CardTitle className="text-center text-foreground">
              Access Your Health Portal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center gap-2 text-foreground">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@university.edu"
                      required
                      className="bg-background/50 border-border focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2 text-foreground">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="bg-background/50 border-border focus:border-primary"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all"
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="flex items-center gap-2 text-foreground">
                        <User className="w-4 h-4" />
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="bg-background/50 border-border focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-foreground">
                        <Phone className="w-4 h-4" />
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="bg-background/50 border-border focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2 text-foreground">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@university.edu"
                      required
                      className="bg-background/50 border-border focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2 text-foreground">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="bg-background/50 border-border focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Role</Label>
                    <Select value={role} onValueChange={(value: "student" | "faculty" | "admin") => setRole(value)}>
                      <SelectTrigger className="bg-background/50 border-border focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {role === "student" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rollNumber" className="flex items-center gap-2 text-foreground">
                          <IdCard className="w-4 h-4" />
                          Roll Number
                        </Label>
                        <Input
                          id="rollNumber"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          placeholder="CS2024001"
                          className="bg-background/50 border-border focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="course" className="flex items-center gap-2 text-foreground">
                          <BookOpen className="w-4 h-4" />
                          Course
                        </Label>
                        <Input
                          id="course"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          placeholder="B.Tech Computer Science"
                          className="bg-background/50 border-border focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  {role === "faculty" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="facultyId" className="flex items-center gap-2 text-foreground">
                          <IdCard className="w-4 h-4" />
                          Faculty ID
                        </Label>
                        <Input
                          id="facultyId"
                          value={facultyId}
                          onChange={(e) => setFacultyId(e.target.value)}
                          placeholder="FAC2024"
                          className="bg-background/50 border-border focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="designation" className="text-foreground">
                          Designation
                        </Label>
                        <Input
                          id="designation"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="Assistant Professor"
                          className="bg-background/50 border-border focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-foreground">Department</Label>
                    <Input
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Computer Science & Engineering"
                      className="bg-background/50 border-border focus:border-primary"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-muted-foreground text-sm">
            Secure authentication powered by Supabase
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;