import { ArrowRight, Heart, Shield, Users, Stethoscope } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

// Simple reusable fade-in-on-scroll wrapper
const FadeInOnScroll: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {children}
    </div>
  );
};

const HeroSection = () => {
  const { toast } = useToast();
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

  const scrollToServices = () => {
    const el = document.getElementById("services");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-hero px-3 sm:px-4 pt-12 sm:pt-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <FadeInOnScroll>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-foreground mb-4 sm:mb-6">
              Campus
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Wellness</span>
              <br />
              Made Simple
            </h1>
          </FadeInOnScroll>
          <FadeInOnScroll delay={100}>
            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
              Comprehensive health and wellness platform connecting students and faculty 
              to emergency services, medical care, counseling, and fitness programs.
            </p>
          </FadeInOnScroll>
          <FadeInOnScroll delay={200}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Button variant="hero" size="xl" className="group w-full sm:w-auto" type="button" onClick={scrollToServices}>
                Get Started Today
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                type="button"
                className="border-primary/30 text-primary hover:bg-primary/10 w-full sm:w-auto"
                onClick={() =>
                  toast({ title: "Coming soon", description: "A demo video will be available shortly." })
                }
              >
                Watch Demo
              </Button>
            </div>
          </FadeInOnScroll>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-2">
          {features.map((feature, index) => (
            <FadeInOnScroll key={index} delay={index * 100}>
              <Card
                className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 
                           transition-all duration-300 hover:shadow-glow hover:translate-y-[-2px] group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-2 sm:p-3 rounded-2xl bg-background/50 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </FadeInOnScroll>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-12 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center px-2">
          <FadeInOnScroll>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">24/7</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Emergency Support</div>
            </div>
          </FadeInOnScroll>
          <FadeInOnScroll delay={100}>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">500+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Students Served</div>
            </div>
          </FadeInOnScroll>
          <FadeInOnScroll delay={200}>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">50+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Health Professionals</div>
            </div>
          </FadeInOnScroll>
          <FadeInOnScroll delay={300}>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">95%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Satisfaction Rate</div>
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;