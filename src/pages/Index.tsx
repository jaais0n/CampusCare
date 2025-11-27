import HeroSection from "@/components/HeroSection";
import ServicesOverview from "@/components/ServicesOverview";

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const go = async (path: string, title: string) => {
    if (path === "/sos") {
      navigate(path, { replace: true });
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true, state: { message: `You must be logged in to access ${title}.` } });
        return;
      }
      navigate(path, { replace: true });
    } catch {
      navigate(path, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <ServicesOverview />
        {/* SOS section removed to avoid duplication; use /sos page for SOS interface */}


        {/* Footer */}
        <footer className="bg-card py-12 px-4 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-xl">
                    <Heart className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">CampusCare+</h3>
                    <p className="text-xs text-muted-foreground">Campus Wellness Platform</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Comprehensive wellness platform connecting campus community to essential health services, 
                  emergency support, and wellness programs.
                </p>
                <div className="flex space-x-4">
                  <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10" onClick={() => go('/privacy-policy', 'Privacy Policy')}>
                    Privacy Policy
                  </Button>
                  <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10" onClick={() => go('/terms-of-service', 'Terms of Service')}>
                    Terms of Service
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
                <div className="space-y-2">
                  <button type="button" onClick={() => go('/sos', 'Emergency Services')} className="block text-left w-full text-muted-foreground hover:text-primary transition-colors">
                    Emergency Services
                  </button>
                  <button type="button" onClick={() => go('/appointments', 'Health Services')} className="block text-left w-full text-muted-foreground hover:text-primary transition-colors">
                    Health Services
                  </button>
                  <button type="button" onClick={() => go('/wellness', 'Wellness Programs')} className="block text-left w-full text-muted-foreground hover:text-primary transition-colors">
                    Wellness Programs
                  </button>
                  <button type="button" onClick={() => go('/counseling', 'Support Center')} className="block text-left w-full text-muted-foreground hover:text-primary transition-colors">
                    Support Center
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-4">Contact Us</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">support@campuscare.edu</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Campus Health Center</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-border mt-8 pt-8 text-center">
              <p className="text-muted-foreground text-sm">
                © 2024 CampusCare+. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;