import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { User as AuthUser } from "@supabase/supabase-js";
import { HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Cache for profile data to avoid refetching
const profileCache = new Map<string, { fullName: string; rollNumber: string; avatarUrl: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const Header = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [rollNumber, setRollNumber] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const fetchingRef = useRef<string | null>(null);

  // Extract user data from metadata immediately (no DB call)
  const setFromMetadata = useCallback((authUser: AuthUser) => {
    const meta = authUser.user_metadata || {};
    const metaName = meta.full_name?.trim() || authUser.email?.split("@")[0] || "";
    const metaAvatar = meta.avatar_url || "";
    const metaRoll = meta.roll_number || "";
    
    setFullName(metaName);
    setAvatarUrl(metaAvatar);
    setRollNumber(metaRoll);
    
    return { metaName, metaAvatar, metaRoll };
  }, []);

  // Load profile from DB (runs in background)
  const fetchProfileFromDB = useCallback(async (userId: string) => {
    // Check cache first
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setFullName(cached.fullName);
      setRollNumber(cached.rollNumber);
      setAvatarUrl(cached.avatarUrl);
      return;
    }

    // Prevent duplicate fetches
    if (fetchingRef.current === userId) return;
    fetchingRef.current = userId;

    try {
      const { data, error } = await (supabase
        .from("profiles") as any)
        .select("full_name, roll_number, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        const dbName = data.full_name || "";
        const dbRoll = data.roll_number || "";
        const dbAvatar = data.avatar_url || "";

        // Only update if we got better data from DB
        if (dbName) setFullName(dbName);
        if (dbRoll) setRollNumber(dbRoll);
        if (dbAvatar) setAvatarUrl(dbAvatar);

        // Cache the result
        profileCache.set(userId, {
          fullName: dbName || fullName,
          rollNumber: dbRoll || rollNumber,
          avatarUrl: dbAvatar || avatarUrl,
          timestamp: Date.now()
        });
      }
    } catch {
      // Silently fail - metadata is already shown
    } finally {
      fetchingRef.current = null;
    }
  }, [fullName, rollNumber, avatarUrl]);

  useEffect(() => {
    // Get session immediately on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // Immediately set from metadata (instant)
        setFromMetadata(session.user);
        // Then fetch from DB in background
        if (location.pathname !== "/auth") {
          fetchProfileFromDB(session.user.id);
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      
      if (authUser) {
        setFromMetadata(authUser);
        if (location.pathname !== "/auth") {
          fetchProfileFromDB(authUser.id);
        }
      } else {
        setFullName("");
        setRollNumber("");
        setAvatarUrl("");
      }

      // Clear cache on sign out
      if (event === 'SIGNED_OUT') {
        profileCache.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [setFromMetadata, fetchProfileFromDB, location.pathname]);

  const signOut = async () => {
    profileCache.clear();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Sign out failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed out" });
      navigate("/auth", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/", { replace: true })} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <HeartPulse className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent hidden sm:inline">
              CampusCarePlus
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button 
                onClick={() => navigate("/profile", { replace: true })}
                className="hidden sm:flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-sm text-foreground font-medium uppercase">
                    {fullName || user.email || "User"}
                  </span>
                  { fullName && user.email && (
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  )}
                </div>
                <Avatar className="h-10 w-10 border-2 border-primary/30">
                  <AvatarImage src={avatarUrl} alt={fullName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
              {/* SOS quick button removed from header as requested */}
              {user?.user_metadata?.role === 'admin' && (
                <Button variant="ghost" onClick={() => navigate("/admin", { replace: true })}>Admin</Button>
              )}
              <Button variant="outline" onClick={signOut}>Log out</Button>
            </>
          ) : (
            <Button className="bg-gradient-primary" onClick={() => navigate("/auth", { replace: true })}>Sign in</Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
