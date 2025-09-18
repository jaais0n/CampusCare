import { 
  Accessibility, 
  Pill, 
  Calendar, 
  MessageCircle, 
  Dumbbell, 
  Brain,
  ArrowRight,
  Clock,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ServicesOverview = () => {
  const services = [
    {
      icon: Accessibility,
      title: "Wheelchair & Accessibility",
      description: "Book wheelchairs and disability assistance with real-time availability tracking",
      features: ["Real-time booking", "Usage tracking", "Maintenance logs"],
      status: "Available Now",
      statusColor: "text-success"
    },
    {
      icon: Pill,
      title: "Medicine Ordering",
      description: "Browse and order medicines with campus delivery service",
      features: ["Online pharmacy", "Prescription tracking", "Campus delivery"],
      status: "Available Now",
      statusColor: "text-success"
    },
    {
      icon: Calendar,
      title: "Doctor Appointments",
      description: "Schedule appointments with campus healthcare professionals",
      features: ["Multiple specializations", "Flexible scheduling", "Appointment history"],
      status: "Available Now",
      statusColor: "text-success"
    },
    {
      icon: MessageCircle,
      title: "Counseling Services",
      description: "Professional counseling with anonymous booking options",
      features: ["Anonymous sessions", "Multiple categories", "Online & in-person"],
      status: "Available Now",
      statusColor: "text-success"
    },
    {
      icon: Brain,
      title: "Wellness Tips & Timer",
      description: "Guided wellness activities with built-in timer and reminders",
      features: ["6 wellness categories", "Custom timers", "Daily reminders"],
      status: "Available Now",
      statusColor: "text-success"
    },
    {
      icon: Dumbbell,
      title: "Fitness Programs",
      description: "Join yoga, meditation, and fitness classes with expert trainers",
      features: ["Group classes", "Personal training", "Progress tracking"],
      status: "Available Now", 
      statusColor: "text-success"
    }
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Complete Wellness
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Ecosystem</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Seven integrated modules designed to support every aspect of campus wellness, 
            from emergency response to daily health maintenance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index}
              className="p-6 bg-card border-border hover:border-primary/30 transition-all duration-300 
                         hover:shadow-glow hover:translate-y-[-4px] group overflow-hidden relative"
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 
                              group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 
                                  transition-colors duration-300">
                    <service.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full bg-success/20 ${service.statusColor}`}>
                    {service.status}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3">
                  {service.title}
                </h3>
                
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {service.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full group/button bg-primary/10 text-primary hover:bg-primary 
                             hover:text-primary-foreground transition-all duration-300"
                >
                  Explore Service
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/button:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Access Section */}
        <div className="mt-20 bg-card rounded-3xl p-8 border border-border">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Quick Access Dashboard</h3>
            <p className="text-muted-foreground">
              Role-based dashboards for students, faculty, and administrators
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-2xl bg-background/50">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Student Dashboard</h4>
              <p className="text-sm text-muted-foreground">Quick booking, health records, wellness tracking</p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-background/50">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Faculty Dashboard</h4>
              <p className="text-sm text-muted-foreground">Service access, department insights, staff wellness</p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-background/50">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Admin Dashboard</h4>
              <p className="text-sm text-muted-foreground">Full management, analytics, system monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesOverview;