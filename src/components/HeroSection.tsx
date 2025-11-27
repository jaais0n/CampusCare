import { ArrowRight, Heart, Shield, Users, Stethoscope, Sparkles, Activity, Phone, Clock, Star, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Typewriter } from "./Typewriter";

const FadeInOnScroll: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
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
      { root: null, rootMargin: "0px", threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        } ${className}`}
    >
      {children}
    </div>
  );
};

const FloatingElement: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
  return (
    <div
      className={`animate-float ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const HealthIllustration = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="200" cy="200" r="180" fill="url(#gradient1)" opacity="0.1" />
    <circle cx="200" cy="200" r="140" fill="url(#gradient1)" opacity="0.15" />
    <circle cx="200" cy="200" r="100" fill="url(#gradient1)" opacity="0.2" />

    <rect x="175" y="120" width="50" height="160" rx="10" fill="url(#gradient2)" />
    <rect x="120" y="175" width="160" height="50" rx="10" fill="url(#gradient2)" />

    <path
      d="M60 200 L100 200 L120 160 L140 240 L160 180 L180 220 L200 200 L340 200"
      stroke="#14b8a6"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
      className="animate-pulse"
    />

    <circle cx="80" cy="120" r="8" fill="#14b8a6" opacity="0.6" />
    <circle cx="320" cy="280" r="12" fill="#f97316" opacity="0.6" />
    <circle cx="300" cy="100" r="6" fill="#22c55e" opacity="0.6" />
    <circle cx="100" cy="300" r="10" fill="#eab308" opacity="0.6" />

    <circle cx="280" cy="140" r="25" stroke="#14b8a6" strokeWidth="4" fill="none" />
    <path d="M280 165 Q280 200 240 220" stroke="#14b8a6" strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx="240" cy="220" r="8" fill="#14b8a6" />

    <defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14b8a6" />
        <stop offset="100%" stopColor="#0d9488" />
      </linearGradient>
      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14b8a6" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
    </defs>
  </svg>
);

const WellnessIllustration = () => (
  <svg viewBox="0 0 300 300" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="150" cy="60" r="25" fill="#14b8a6" opacity="0.8" />
    <path
      d="M150 85 L150 160 M150 120 L100 100 M150 120 L200 100 M150 160 L100 220 M150 160 L200 220"
      stroke="#14b8a6"
      strokeWidth="8"
      strokeLinecap="round"
    />

    <ellipse cx="150" cy="250" rx="80" ry="20" fill="#14b8a6" opacity="0.2" />

    <path d="M60 80 L65 90 L75 85 L65 95 L60 105 L55 95 L45 85 L55 90 Z" fill="#f97316" opacity="0.7" />
    <path d="M240 120 L243 127 L250 125 L243 130 L240 137 L237 130 L230 125 L237 127 Z" fill="#22c55e" opacity="0.7" />
    <path d="M80 200 L82 205 L87 204 L82 207 L80 212 L78 207 L73 204 L78 205 Z" fill="#eab308" opacity="0.7" />

    <circle cx="150" cy="130" r="90" stroke="#14b8a6" strokeWidth="2" strokeDasharray="10 5" opacity="0.3" />
    <circle cx="150" cy="130" r="110" stroke="#14b8a6" strokeWidth="1" strokeDasharray="5 10" opacity="0.2" />
  </svg>
);

const EmergencyIllustration = () => (
  <svg viewBox="0 0 300 300" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="150" cy="150" r="100" fill="#ef4444" opacity="0.1" className="animate-ping" style={{ animationDuration: '2s' }} />
    <circle cx="150" cy="150" r="80" fill="#ef4444" opacity="0.2" />
    <circle cx="150" cy="150" r="60" fill="#ef4444" opacity="0.3" />

    <path
      d="M150 70 L200 90 L200 150 Q200 200 150 230 Q100 200 100 150 L100 90 Z"
      fill="url(#shieldGrad)"
      stroke="#ef4444"
      strokeWidth="3"
    />

    <rect x="140" y="100" width="20" height="80" rx="4" fill="white" />
    <rect x="110" y="130" width="80" height="20" rx="4" fill="white" />

    <path d="M220 100 Q240 120 220 140" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
    <path d="M235 90 Q265 120 235 150" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />

    <path d="M80 100 Q60 120 80 140" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
    <path d="M65 90 Q35 120 65 150" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />

    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
    </defs>
  </svg>
);

const HeroSection = () => {
  const { toast } = useToast();
  const [startWellness, setStartWellness] = useState(false);
  const [startMadeSimple, setStartMadeSimple] = useState(false);

  const features = [
    {
      icon: Shield,
      title: "Emergency SOS",
      description: "Instant emergency alerts and campus security notification",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20 hover:border-red-500/40"
    },
    {
      icon: Stethoscope,
      title: "Health Services",
      description: "Book appointments, order medicines, and access medical care",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20 hover:border-primary/40"
    },
    {
      icon: Heart,
      title: "Wellness Programs",
      description: "Yoga, meditation, counseling, and fitness programs",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20 hover:border-green-500/40"
    },
    {
      icon: Users,
      title: "Accessibility Support",
      description: "Wheelchair booking and disability assistance services",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20 hover:border-amber-500/40"
    }
  ];

  const scrollToServices = () => {
    const el = document.getElementById("services");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 pt-16 pb-8 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <FadeInOnScroll>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">Your Campus Health Partner</span>
                </div>
              </FadeInOnScroll>

              <FadeInOnScroll delay={100}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight min-h-[3.5em] sm:min-h-[3em]">
                  <Typewriter
                    text="Campus"
                    speed={70}
                    cursor={false}
                    onComplete={() => setStartWellness(true)}
                  />
                  {startWellness && (
                    <Typewriter
                      text=" Wellness"
                      speed={70}
                      className="bg-gradient-to-r from-primary via-teal-400 to-emerald-400 bg-clip-text text-transparent"
                      cursor={false}
                      onComplete={() => setStartMadeSimple(true)}
                    />
                  )}
                  <br />
                  {startMadeSimple && (
                    <Typewriter
                      text="Made Simple"
                      speed={70}
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                      cursor={true}
                    />
                  )}
                </h1>
              </FadeInOnScroll>

              <FadeInOnScroll delay={200}>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Comprehensive health and wellness platform connecting students and faculty
                  to emergency services, medical care, counseling, and fitness programs.
                </p>
              </FadeInOnScroll>

              <FadeInOnScroll delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                  <Button variant="hero" size="xl" className="group w-full sm:w-auto" type="button" onClick={scrollToServices}>
                    Get Started Today
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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

              <FadeInOnScroll delay={400}>
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>24/7 Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Secure & Private</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Instant Access</span>
                  </div>
                </div>
              </FadeInOnScroll>
            </div>

            <FadeInOnScroll delay={200} className="hidden lg:block">
              <div className="relative">
                <FloatingElement delay={0}>
                  <div className="w-full max-w-md mx-auto">
                    <HealthIllustration />
                  </div>
                </FloatingElement>

                <FloatingElement delay={500} className="absolute -left-8 top-1/4">
                  <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Activity className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Health Score</p>
                        <p className="text-sm font-semibold text-foreground">Excellent</p>
                      </div>
                    </div>
                  </div>
                </FloatingElement>

                <FloatingElement delay={800} className="absolute -right-4 top-1/3">
                  <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">SOS Ready</p>
                        <p className="text-sm font-semibold text-foreground">One Tap</p>
                      </div>
                    </div>
                  </div>
                </FloatingElement>

                <FloatingElement delay={1100} className="absolute left-1/4 -bottom-4">
                  <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Response Time</p>
                        <p className="text-sm font-semibold text-foreground">&lt; 5 mins</p>
                      </div>
                    </div>
                  </div>
                </FloatingElement>
              </div>
            </FadeInOnScroll>
          </div>

          <div className="mt-16 lg:mt-24">
            <FadeInOnScroll>
              <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">
                Everything You Need for
                <span className="text-primary"> Campus Wellness</span>
              </h2>
            </FadeInOnScroll>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {features.map((feature, index) => (
                <FadeInOnScroll key={index} delay={index * 100}>
                  <Card
                    className={`p-6 bg-card/50 backdrop-blur-sm border ${feature.borderColor}
                               transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:translate-y-[-4px] group cursor-pointer`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-4 rounded-2xl ${feature.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
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
                </FadeInOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gradient-to-b from-background to-card/50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <FadeInOnScroll>
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4">
              Trusted by
              <span className="text-primary"> Campus Community</span>
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join thousands of students and faculty who rely on CampusCare+ for their health and wellness needs.
            </p>
          </FadeInOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <FadeInOnScroll delay={0}>
              <div className="text-center p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Emergency Support</div>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll delay={100}>
              <div className="text-center p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 mx-auto mb-4 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-green-500 mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Students Served</div>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll delay={200}>
              <div className="text-center p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-blue-500 mb-2">50+</div>
                <div className="text-sm text-muted-foreground">Health Professionals</div>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll delay={300}>
              <div className="text-center p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 mx-auto mb-4 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-500" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-amber-500 mb-2">95%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;