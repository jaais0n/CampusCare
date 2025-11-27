import { useState, useEffect } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Heart, Mail, Lock, User, Phone, BookOpen, IdCard, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Session } from "@supabase/supabase-js";

const Auth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  // Role is fixed to 'student' for account creation
  const role: "student" = "student";
  const [rollNumber, setRollNumber] = useState("");
  const [course, setCourse] = useState("");
  const [department, setDepartment] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [designation, setDesignation] = useState("");
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      toast({
        title: "Authentication Required",
        description: location.state.message,
        variant: "destructive",
      });
      // Clear the state to prevent the toast from re-appearing on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, toast]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const metaRole = (session.user!.user_metadata as any)?.role as string | undefined;
        const r = (metaRole || '').toLowerCase();
        if (r === 'admin') {
          navigate('/admin', { replace: true });
          return;
        }
        const em = session.user!.email?.toLowerCase();
        navigate(em === 'admin@university.edu' ? '/admin' : '/', { replace: true });
        return;
      }
    });
  }, [navigate]);

  // Render-time guard: if already signed in, redirect deterministically
  const metaRole = (session?.user?.user_metadata as any)?.role as string | undefined;
  const isAdminNow = (metaRole || "").toLowerCase() === "admin" || (session?.user?.email?.toLowerCase() === "admin@university.edu");
  if (session?.user) {
    return <Navigate to={isAdminNow ? "/admin" : "/"} replace />;
  }

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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Signed In User:', session.user);
        const metadata = session.user.user_metadata as any;
        
        // Always sync profile with user_metadata on sign-in
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: session.user.id,
          user_id: session.user.id,
          email: session.user.email,
          full_name: metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          phone: metadata?.phone || null,
          role: metadata?.role || 'student',
          roll_number: metadata?.roll_number || null,
          course: metadata?.course || null,
          department: metadata?.department || null,
          faculty_id: metadata?.faculty_id || null,
          designation: metadata?.designation || null,
        } as any, { onConflict: 'id' });
        
        if (upsertError) {
          console.error('Error syncing profile on sign-in:', upsertError);
        } else {
          console.log('Profile synced on sign-in.');
        }

        let role: string | undefined = metadata?.role;
        toast({ title: "Welcome back!" });
        const r = (role || '').toLowerCase();
        if (r === 'admin') {
          window.location.replace('/admin');
          return;
        } else {
          const em = session.user.email?.toLowerCase();
          window.location.replace(em === 'admin@university.edu' ? '/admin' : '/');
          return;
        }
      }
    }
    setLoading(false);
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Enforce university email for non-admin users
    // Enforce university email domain for student signups
    {
      const universityPattern = /^[A-Za-z0-9]+@university\.edu$/;
      if (!universityPattern.test(email.trim())) {
        toast({
          title: "Invalid Email",
          description: "Students must use their university email (e.g., 24mscs09@university.edu).",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // No email authentication/confirmation required
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
      // If a session exists, proceed; otherwise auto sign-in (no email auth)
      let userId = data.session?.user?.id;
      if (!userId) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          toast({ title: "Sign In After Sign Up Failed", description: signInErr.message, variant: "destructive" });
          setLoading(false);
          return;
        }
        userId = signInData.session?.user?.id;
      }
      if (userId) {
        // Best-effort create/update profile row (RLS allows self-upsert)
        const { error: upsertErr } = await supabase.from('profiles').upsert({
          id: userId,
          user_id: userId,
          email: email,
          full_name: fullName,
          phone,
          role,
          roll_number: rollNumber,
          course,
          department,
          faculty_id: facultyId,
          designation,
        } as any, { onConflict: 'id' });
        if (upsertErr) {
          // Non-blocking warning
          console.error('Profile upsert error:', upsertErr);
          toast({ title: "Signed up (profile pending)", description: upsertErr.message });
        }

        // Route to student home after signup
        navigate('/');
      }
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
                      placeholder="rollno@university.edu"
                      required
                      className="bg-background/50 border-border focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2 text-foreground">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="bg-background/50 border-border focus:border-primary pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all"
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                  
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="w-full text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
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
                        placeholder="David Mathew"
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
                        placeholder="+91 999XXXXXXX"
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
                      placeholder={'rollno@university.edu'}
                      required
                      className="bg-background/50 border-border focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2 text-foreground">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="bg-background/50 border-border focus:border-primary pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role selection removed: only Student accounts can be created here */}

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
                          placeholder="24MCAB23"
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

                  {/* Faculty option removed from sign up */}

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

        {/* removed vendor-specific attribution */}
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Forgot Password?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please contact the administrator to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-secondary/30 p-4 rounded-lg border border-border">
              <p className="text-sm text-foreground mb-2">Contact Administrator:</p>
              <a 
                href="mailto:support@campuscare.edu" 
                className="text-primary hover:underline font-medium flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                support@campuscare.edu
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Please include your registered email address and full name in your request.
            </p>
            <Button 
              onClick={() => setForgotPasswordOpen(false)}
              className="w-full bg-gradient-primary"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;