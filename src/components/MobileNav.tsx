import { Link, useLocation } from "react-router-dom";
import { Home, User, AlertTriangle, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { User as AuthUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Add custom animation for pulsing effect
const style = document.createElement('style');
style.textContent = `
  @keyframes ping-slow {
    0% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.5); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
  }
  .animate-ping-slow {
    animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  .animation-delay-1000 {
    animation-delay: 1s;
  }
`;
document.head.appendChild(style);

const MobileNav = () => {
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const navItems = user
    ? [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Profile', path: '/profile', icon: User },
      ]
    : [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Sign In', path: '/auth', icon: LogIn },
      ];

  return (
    <>
      {/* SOS Floating Button */}
      {location.pathname !== "/sos" && !location.pathname.startsWith("/admin") && (
        <div className="fixed bottom-20 right-4 z-50">
          <Link to="/sos" className="block">
            <div className="relative">
              {/* Pulsing ring effect */}
              <div className="absolute -inset-1 bg-red-500/30 rounded-full animate-ping-slow" />
              <div className="absolute -inset-2 bg-red-500/20 rounded-full animate-ping-slow animation-delay-1000" />
              
              {/* Main SOS button */}
              <Button 
                variant="destructive" 
                size="lg" 
                className="relative rounded-full h-16 w-16 p-0 shadow-xl hover:scale-105 transform transition-transform duration-200"
              >
                <div className="flex flex-col items-center">
                  <AlertTriangle className="h-6 w-6 mb-0.5" />
                  <span className="text-xs font-bold tracking-wider">SOS</span>
                </div>
              </Button>
            </div>
          </Link>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 sm:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full",
                "text-muted-foreground hover:text-foreground transition-colors",
                location.pathname === item.path && "text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
          

        </div>
      </nav>
    </>
  );
};

export default MobileNav;
