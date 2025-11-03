import HeroSection from "@/components/HeroSection";
import ServicesOverview from "@/components/ServicesOverview";
import SOSEmergency from "@/components/SOSEmergency";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <ServicesOverview />
        <SOSEmergency />


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
                  <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
                    Privacy Policy
                  </Button>
                  <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
                    Terms of Service
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
                <div className="space-y-2">
                  <a href="#emergency" className="block text-muted-foreground hover:text-primary transition-colors">
                    Emergency Services
                  </a>
                  <a href="#health" className="block text-muted-foreground hover:text-primary transition-colors">
                    Health Services
                  </a>
                  <a href="#wellness" className="block text-muted-foreground hover:text-primary transition-colors">
                    Wellness Programs
                  </a>
                  <a href="#support" className="block text-muted-foreground hover:text-primary transition-colors">
                    Support Center
                  </a>
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