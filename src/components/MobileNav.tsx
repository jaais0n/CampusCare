import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, User, AlertTriangle, LogIn, MessageCircle, X, Send, Bot, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useEffect, useState, useRef, useCallback } from "react";
import { User as AuthUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";

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
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'bot'; message: string }[]>([
    { role: 'bot', message: "Hi there! 👋 I'm CampusCare AI Assistant powered by Google Gemini.\n\nI can help you with:\n• 🏥 Campus health & wellness\n• 💻 Coding & tech questions\n• 📚 Study & homework help\n• 🌍 General knowledge\n• ✍️ Writing & creative tasks\n\nAsk me anything!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [sosPosition, setSosPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const sosRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && typeof window !== 'undefined') {
      const savedPosition = localStorage.getItem('sosButtonPosition');
      if (savedPosition) {
        setSosPosition(JSON.parse(savedPosition));
      } else {
        setSosPosition({
          x: window.innerWidth - 80,
          y: window.innerHeight - 180
        });
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({
      x: clientX - sosPosition.x,
      y: clientY - sosPosition.y
    });
  }, [sosPosition]);

  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const newX = Math.max(20, Math.min(window.innerWidth - 80, clientX - dragStart.x));
    const newY = Math.max(20, Math.min(window.innerHeight - 100, clientY - dragStart.y));
    
    if (Math.abs(newX - sosPosition.x) > 5 || Math.abs(newY - sosPosition.y) > 5) {
      setHasDragged(true);
    }
    
    setSosPosition({ x: newX, y: newY });
  }, [isDragging, dragStart, sosPosition]);

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem('sosButtonPosition', JSON.stringify(sosPosition));
    }
  }, [isDragging, sosPosition]);

  const handleSOSClick = useCallback(() => {
    if (!hasDragged) {
      navigate("/sos", { replace: true });
    }
    setTimeout(() => setHasDragged(false), 100);
  }, [hasDragged, navigate]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const systemPrompt = `You are CampusCare AI Assistant, a helpful, friendly, and highly knowledgeable AI assistant for CampusCare+, a campus wellness platform.

YOUR CAPABILITIES - You can help with ANYTHING:
1. **General Knowledge**: Science, math, history, geography, current events, trivia
2. **Coding & Tech**: Write code in any language, debug, explain concepts, help with projects
3. **Academic Help**: Homework, essays, study tips, exam preparation, explanations
4. **Creative Writing**: Stories, poems, ideas, brainstorming
5. **Campus Services** (when relevant):
   - Emergency SOS: Red button, Campus Security: +1 (555) 123-4567
   - Medical: Health Services for appointments
   - Counseling: Mental health support
   - Pharmacy: Order medicines
   - Wheelchair: Accessibility services
   - Wellness: Yoga, meditation, fitness
   - Hours: Mon-Fri 8AM-6PM, Sat 9AM-2PM

GUIDELINES:
- Be conversational and friendly, use emojis appropriately 😊
- Keep responses concise but helpful (under 200 words unless needed)
- For emergencies, prioritize safety
- Be honest about limitations
- Support any language the user writes in

You're a powerful AI - help with ANYTHING the user asks!`;

  const getAIResponse = async (userMessage: string): Promise<string> => {
    const API_KEY = 'AIzaSyCZn9Xcxtma_gfEm0iQjmAsQdbHFNK3Hd8';
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ 
                  text: `You are CampusCare AI Assistant, a helpful and friendly AI. Answer this question concisely and helpfully: ${userMessage}` 
                }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            }
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error:', response.status, errorText);
        throw new Error(`API failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      
      if (data.error) {
        console.error('API Error in response:', data.error);
        throw new Error(data.error.message || 'API error');
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('AI Response Error:', error);
      return getFallbackResponse(userMessage);
    }
  };

  const getFallbackResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('emergency') || msg.includes('sos') || msg.includes('help me')) {
      return "🚨 For emergencies, use the SOS button or call Campus Security: +1 (555) 123-4567. For life-threatening emergencies, call 911.";
    }
    if (msg.includes('appointment') || msg.includes('doctor')) {
      return "📅 Book medical appointments in the Health Services section. We have doctors available Mon-Fri 8AM-6PM.";
    }
    if (msg.includes('counseling') || msg.includes('mental') || msg.includes('stress') || msg.includes('anxious')) {
      return "💚 Counseling services are available. Visit the Counseling section to book a confidential session. You're not alone!";
    }
    if (msg.includes('medicine') || msg.includes('pharmacy')) {
      return "💊 Order medicines through our Pharmacy section for campus pickup.";
    }
    if (msg.includes('wheelchair') || msg.includes('accessibility')) {
      return "♿ Book wheelchair services in the Accessibility section.";
    }
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return "Hello! 😊 I'm here to help with anything you need. What can I assist you with?";
    }
    
    return "I'm here to help! I can assist with health services, appointments, counseling, general questions, coding help, and more. What would you like to know?";
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    const userMsg = chatMessage;
    setChatMessage("");
    
    setChatHistory(prev => [...prev, { role: 'user', message: userMsg }]);
    
    setIsTyping(true);
    
    try {
      const response = await getAIResponse(userMsg);
      setChatHistory(prev => [...prev, { role: 'bot', message: response }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'bot', message: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
      {isChatOpen && (
        <div className="fixed bottom-36 right-4 z-50 w-80 sm:w-96 md:w-[450px] lg:w-[500px] animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-teal-500 p-4 md:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-white/30">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-white/20 text-white">
                    <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-white text-sm md:text-base">CampusCare AI</h3>
                  <p className="text-xs md:text-sm text-white/80 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Powered by Gemini
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setChatHistory([{ role: 'bot', message: "Chat cleared! 🔄 How can I help you?" }])}
                  className="text-white/60 hover:text-white transition-colors p-1"
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
            </div>
            
            <div className="h-72 md:h-96 lg:h-[450px] overflow-y-auto p-4 md:p-5 space-y-4 bg-background/50">
              {chatHistory.map((chat, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "flex gap-2 md:gap-3",
                    chat.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {chat.role === 'bot' && (
                    <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        <Bot className="h-4 w-4 md:h-5 md:w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div 
                    className={cn(
                      "max-w-[75%] px-4 py-2 md:px-5 md:py-3 rounded-2xl text-sm md:text-base whitespace-pre-line",
                      chat.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-br-sm" 
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    {chat.message}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-2 md:gap-3 justify-start">
                  <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      <Bot className="h-4 w-4 md:h-5 md:w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-3 md:p-4 border-t border-border bg-card">
              <div className="flex gap-2 md:gap-3">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-background border-border md:text-base md:py-5"
                />
                <Button 
                  size="icon" 
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className="bg-primary hover:bg-primary/90 shrink-0 md:h-11 md:w-11"
                >
                  <Send className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {location.pathname !== "/sos" && !location.pathname.startsWith("/admin") && isInitialized && (
        <div 
          ref={sosRef}
          className={cn(
            "fixed z-50 touch-none select-none",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{
            left: sosPosition.x,
            top: sosPosition.y,
            transition: isDragging ? 'none' : 'all 0.1s ease-out'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onClick={handleSOSClick}
        >
          <div className="block">
            <div className="relative">
              <div className="absolute -inset-1 bg-red-500/30 rounded-full animate-ping-slow" />
              <div className="absolute -inset-2 bg-red-500/20 rounded-full animate-ping-slow animation-delay-1000" />
              
              <Button 
                variant="destructive" 
                size="lg" 
                className="relative rounded-full h-14 w-14 p-0 shadow-xl hover:scale-105 transform transition-transform duration-200"
              >
                <div className="flex flex-col items-center">
                  <AlertTriangle className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-bold tracking-wider">SOS</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}

      {location.pathname !== "/sos" && !location.pathname.startsWith("/admin") && (
        <div className="fixed bottom-20 right-4 z-50">
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)} 
            className="relative group"
          >
            <div className={cn(
              "h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
              isChatOpen 
                ? "bg-primary/20 border-2 border-primary" 
                : "bg-gradient-to-br from-primary to-teal-500 hover:scale-105"
            )}>
              {isChatOpen ? (
                <X className="h-5 w-5 text-primary" />
              ) : (
                <MessageCircle className="h-5 w-5 text-white" />
              )}
            </div>
            {!isChatOpen && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse"></span>
            )}
          </button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 sm:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path, { replace: true })}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full",
                "text-muted-foreground hover:text-foreground transition-colors",
                location.pathname === item.path && "text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </button>
          ))}
          

        </div>
      </nav>
    </>
  );
};

export default MobileNav;
