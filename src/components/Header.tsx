import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import type { User as AuthUser } from "@supabase/supabase-js";
import { HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [rollNumber, setRollNumber] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [profileLoadedFor, setProfileLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load profile details for display (name + roll)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user?.id) {
          setFullName("");
          setRollNumber("");
          setProfileLoadedFor(null);
          return;
        }
        // Do not query profile while on /auth to avoid flicker and 500 loops
        if (location.pathname === "/auth") return;
        // Avoid re-fetching for the same user
        if (profileLoadedFor === user.id) return;
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, roll_number")
          .eq("id", user.id)
          .single();
        if (!error) {
          setFullName(data?.full_name || "");
          setRollNumber(data?.roll_number || "");
          setProfileLoadedFor(user.id);
        }
      } catch {
        // Swallow errors; header will fallback to email
      }
    };
    loadProfile();
  }, [user?.id, location.pathname, profileLoadedFor]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Sign out failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed out" });
      navigate("/auth");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <HeartPulse className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent hidden sm:inline">
              CampusCarePlus
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm text-foreground font-medium">
                  {fullName || user.email?.split("@")[0] || "User"}
                </span>
                {(rollNumber || user.email) && (
                  <span className="text-xs text-muted-foreground">
                    {rollNumber || user.email}
                  </span>
                )}
              </div>
              <Link to="/sos" className="hidden sm:block">
                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  SOS
                </Button>
              </Link>
              {user?.user_metadata?.role === 'admin' && (
                <Link to="/admin" className="hidden sm:block">
                  <Button variant="ghost">Admin</Button>
                </Link>
              )}
              <Button variant="outline" onClick={signOut}>Log out</Button>
            </>
          ) : (
            <Link to="/auth">
              <Button className="bg-gradient-primary">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
