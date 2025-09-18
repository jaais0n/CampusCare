import { ArrowRight, Heart, Shield, Users, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const HeroSection = () => {
  const features = [
    {
      icon: Shield,
      title: "Emergency SOS",
      description: "Instant emergency alerts and campus security notification",
      color: "text-destructive"
    },
    {
      icon: Stethoscope,
      title: "Health Services",
      description: "Book appointments, order medicines, and access medical care",
      color: "text-primary"
    },
    {
      icon: Heart,
      title: "Wellness Programs",
      description: "Yoga, meditation, counseling, and fitness programs",
      color: "text-success"
    },
    {
      icon: Users,
      title: "Accessibility Support",
      description: "Wheelchair booking and disability assistance services",
      color: "text-warning"
    }
  ];

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 pt-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
            Campus
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Wellness</span>
            <br />
            Made Simple
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Comprehensive health and wellness platform connecting students and faculty 
            to emergency services, medical care, counseling, and fitness programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="xl" className="group">
              Get Started Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl" className="border-primary/30 text-primary hover:bg-primary/10">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 
                         transition-all duration-300 hover:shadow-glow hover:translate-y-[-2px] group"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-2xl bg-background/50 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
            <div className="text-muted-foreground">Emergency Support</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-muted-foreground">Students Served</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">50+</div>
            <div className="text-muted-foreground">Health Professionals</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">95%</div>
            <div className="text-muted-foreground">Satisfaction Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;