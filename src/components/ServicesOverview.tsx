import { 
  Accessibility, 
  Pill, 
  Calendar, 
  MessageCircle, 
  Dumbbell, 
  Brain,
  ArrowRight,
  HeartPulse
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Reusable fade-in on scroll wrapper (no external deps)
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
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {children}
    </div>
  );
};

const ServicesOverview = () => {
  const navigate = useNavigate();

  const handleExplore = async (service: { title: string; href: string }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true, state: { message: `You must be logged in to access ${service.title}.` } });
        return;
      }
      navigate(service.href, { replace: true });
    } catch (_e) {
      navigate(service.href, { replace: true });
    }
  };
  const services = [
    // First row: Appointments, Counseling, Wheelchairs
    {
      icon: Calendar,
      title: "Medical Appointment",
      description: "Book with our campus doctor",
      features: ["Multiple specializations", "Flexible scheduling", "Appointment history"],
      status: "Available Now",
      statusColor: "text-success",
      href: "/appointments",
      available: true
    },
    {
      icon: MessageCircle,
      title: "Counseling",
      description: "Professional counseling with anonymous booking options",
      features: ["Anonymous sessions", "Multiple categories", "Online & in-person"],
      status: "Available Now",
      statusColor: "text-success",
      href: "/counseling",
      available: true
    },
    {
      icon: Accessibility,
      title: "Wheelchairs",
      description: "Book wheelchairs and accessibility assistance",
      features: ["Real-time availability", "Campus-wide coverage", "Quick booking"],
      status: "Available Now",
      statusColor: "text-success",
      href: "/wheelchairs",
      available: true
    },
    // Second row: Medicines and Wellness (Coming Soon)
    {
      icon: Pill,
      title: "Medicines",
      description: "Browse and order medicines with campus delivery service",
      features: ["Online pharmacy", "Prescription tracking", "Campus delivery"],
      status: "Available Now",
      statusColor: "text-success",
      href: "/medicines",
      available: true
    },
    {
      icon: HeartPulse,
      title: "Wellness",
      description: "Access wellness programs and track your health",
      features: ["Fitness tracking", "Mental health", "Wellness challenges"],
      status: "Available Now",
      statusColor: "text-success",
      href: "/wellness",
      available: true
    }
  ];

  // Split into active and coming soon groups for custom layout
  const primaryServices = services.filter((s) => s.available);
  const firstRowServices = primaryServices.slice(0, 3);
  const secondRowServices = primaryServices.slice(3);
  const comingSoonServices = services.filter((s) => !s.available);

  return (
    <section id="services" className="py-12 sm:py-16 lg:py-20 px-4 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 md:mb-6">
            Complete Wellness
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Ecosystem</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            Seven integrated modules designed to support every aspect of campus wellness, 
            from emergency response to daily health maintenance.
          </p>
        </div>

        {/* Services grid */}

        {/* First row: active services in a 3-column grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {firstRowServices.map((service, index) => (
            <FadeInOnScroll key={service.title} delay={index * 100}>
              <Card 
                className={`h-full min-h-[230px] sm:min-h-[250px] p-4 sm:p-5 lg:p-6 bg-card border-border transition-all duration-300 group overflow-hidden relative ${
                  service.available ? "hover:border-primary/30 hover:shadow-glow hover:translate-y-[-4px]" : "opacity-60 cursor-not-allowed"
                } flex flex-col`}
              >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 
                              group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 sm:p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 
                                  transition-colors duration-300">
                    <service.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${service.available ? "bg-success/20" : "bg-muted/20"} ${service.statusColor}`}>
                    {service.status}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
                  {service.title}
                </h3>
                
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                  {service.description}
                </p>

                <div className="mt-auto pt-2">
                  {service.available ? (
                    <Button
                      onClick={() => handleExplore(service)}
                      className="w-full group/button bg-primary/10 text-primary hover:bg-primary 
                                 hover:text-primary-foreground transition-all duration-300"
                    >
                      Explore Service
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/button:translate-x-1 transition-transform" />
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-muted text-muted-foreground"
                      variant="secondary"
                      disabled
                      aria-disabled
                    >
                      Coming Soon
                    </Button>
                  )}
                </div>
              </div>
              </Card>
            </FadeInOnScroll>
          ))}
        </div>

        {/* Second row: remaining active services centered */}
        {secondRowServices.length > 0 && (
          <div className="mt-6 sm:mt-8 flex justify-center gap-4 sm:gap-6 lg:gap-8 flex-wrap">
            {secondRowServices.map((service, idx) => (
              <FadeInOnScroll key={service.title} delay={(firstRowServices.length + idx) * 100}>
                <Card 
                  className={`h-full min-h-[230px] sm:min-h-[250px] p-4 sm:p-5 lg:p-6 bg-card border-border transition-all duration-300 group overflow-hidden relative w-full max-w-[480px] sm:w-[360px] flex flex-col ${
                    service.available ? "hover:border-primary/30 hover:shadow-glow hover:translate-y-[-4px]" : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 
                                  group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 sm:p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 
                                      transition-colors duration-300">
                        <service.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${service.available ? "bg-success/20" : "bg-muted/20"} ${service.statusColor}`}>
                        {service.status}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
                      {service.title}
                    </h3>
                    
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                      {service.description}
                    </p>

                    <div className="mt-auto pt-2">
                      {service.available ? (
                        <Button
                          onClick={() => handleExplore(service)}
                          className="w-full group/button bg-primary/10 text-primary hover:bg-primary 
                                     hover:text-primary-foreground transition-all duration-300"
                        >
                          Explore Service
                          <ArrowRight className="w-4 h-4 ml-2 group-hover/button:translate-x-1 transition-transform" />
                        </Button>
                      ) : (
                        <Button 
                          className="w-full bg-muted text-muted-foreground"
                          variant="secondary"
                          disabled
                          aria-disabled
                        >
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </FadeInOnScroll>
            ))}
          </div>
        )}

        {/* Second row: coming soon services centered */}
        {comingSoonServices.length > 0 && (
          <div className="mt-6 sm:mt-8 flex justify-center gap-4 sm:gap-6 lg:gap-8 flex-wrap">
            {comingSoonServices.map((service, idx) => (
              <FadeInOnScroll key={service.title} delay={(primaryServices.length + idx) * 100}>
                <Card className="h-full min-h-[230px] sm:min-h-[250px] p-4 sm:p-5 lg:p-6 bg-card border-border opacity-60 cursor-not-allowed group overflow-hidden relative w-full max-w-[480px] sm:w-[360px] flex flex-col">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 rounded-2xl bg-primary/10">
                        <service.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full bg-muted/20 ${service.statusColor}`}>{service.status}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">{service.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">{service.description}</p>
                    <div className="mt-auto pt-2">
                      <Button className="w-full bg-muted text-muted-foreground" variant="secondary" disabled aria-disabled>
                        Coming Soon
                      </Button>
                    </div>
                  </div>
                </Card>
              </FadeInOnScroll>
            ))}
          </div>
        )}

        

      </div>
    </section>
  );
};

export default ServicesOverview;