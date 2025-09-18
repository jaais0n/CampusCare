import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesOverview from "@/components/ServicesOverview";
import SOSEmergency from "@/components/SOSEmergency";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ServicesOverview />
        <SOSEmergency />
        
        {/* Authentication Notice */}
        <section className="py-16 px-4 bg-card/30">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="p-8 bg-card border-primary/20 shadow-glow">
              <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                CampusCare+ uses secure authentication and database management to protect your health information. 
                To enable full functionality including user accounts, appointment booking, and medical records, 
                we need to connect to our backend services.
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-primary">
                  🔒 <strong>Secure Backend Required:</strong> To store user data, manage appointments, 
                  and handle medical information, this application requires a secure database connection 
                  via Supabase integration.
                </p>
              </div>
              <Button variant="hero" size="lg">
                Connect Backend Services
              </Button>
            </Card>
          </div>
        </section>

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
                © 2024 CampusCare+. All rights reserved. Built with ❤️ for campus wellness.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;