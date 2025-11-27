import { useState, useRef, useEffect, useCallback } from 'react';

interface ChatMessage {
  role: 'user' | 'bot';
  message: string;
}

// Gemini API key - In production, use environment variable
const GEMINI_API_KEY = 'AIzaSyB1Xc6RKHwKs9HJXW5Ek8wKqB6v9s3cBnY';

const SYSTEM_PROMPT = `You are CampusCare AI Assistant, a helpful, friendly, and highly knowledgeable assistant for CampusCare+, a campus wellness platform.

YOUR CAPABILITIES:
1. **General Knowledge**: Answer ANY question - science, math, history, geography, coding, writing, explanations, problem-solving, current events, etc.
2. **Campus Services** (when relevant):
   - Emergency SOS: Red SOS button, Campus Security: +1 (555) 123-4567
   - Medical Appointments: Health Services section for booking
   - Counseling: Mental health and emotional support services
   - Pharmacy: Online medicine ordering for campus pickup
   - Wheelchair/Accessibility: Book mobility assistance
   - Wellness Programs: Yoga, meditation, fitness, workshops
   - Hours: Mon-Fri 8AM-6PM, Sat 9AM-2PM, Emergency 24/7
3. **Coding Help**: Write code, debug, explain programming concepts in any language
4. **Academic Help**: Math problems, science questions, essay writing tips, study advice
5. **Creative Writing**: Stories, poems, ideas, brainstorming

GUIDELINES:
- Be conversational, friendly, and use emojis when appropriate 😊
- Keep responses concise (under 200 words) unless detailed explanation is needed
- For emergencies, always prioritize safety and provide emergency contacts
- If asked about something you're unsure of, be honest about limitations
- Support multiple languages if the user writes in another language

You are a powerful AI that can help with ANYTHING, not just campus services!`;

export const useChatbot = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { 
      role: 'bot', 
      message: "Hi there! 👋 I'm CampusCare AI Assistant powered by Gemini. I can help you with:\n\n• 🏥 Campus health services\n• 💻 Coding & tech questions\n• 📚 Study & homework help\n• 🌍 General knowledge\n• ✍️ Writing assistance\n\nAsk me anything!" 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Call Gemini API
  const callGeminiAPI = async (userMessage: string, history: ChatMessage[]): Promise<string> => {
    // Build conversation history
    const conversationHistory = history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: SYSTEM_PROMPT }]
            },
            {
              role: 'model',
              parts: [{ text: 'Understood! I am CampusCare AI Assistant, ready to help with anything - campus services, coding, academics, general knowledge, and more! How can I assist you today?' }]
            },
            ...conversationHistory,
            {
              role: 'user',
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', errorData);
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    
    if (data.candidates && data.candidates[0]?.finishReason === 'SAFETY') {
      return "I apologize, but I can't respond to that particular request. Let me know if there's something else I can help you with! 😊";
    }
    
    throw new Error('Invalid response format');
  };

  // Fallback responses
  const getFallbackResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('emergency') || msg.includes('sos')) {
      return "🚨 For emergencies, use the SOS button or call Campus Security: +1 (555) 123-4567. For life-threatening emergencies, call 911 immediately.";
    }
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return "Hello! 😊 I'm currently experiencing some connectivity issues, but I can still help with basic questions about campus services. What do you need?";
    }
    if (msg.includes('appointment') || msg.includes('doctor')) {
      return "📅 Book medical appointments in the Health Services section. Available Mon-Fri 8AM-6PM.";
    }
    if (msg.includes('counseling') || msg.includes('mental health')) {
      return "💚 Counseling services are available in the Counseling section. Your mental health matters!";
    }
    
    return "I'm having trouble connecting right now. For urgent matters:\n• Campus Security: +1 (555) 123-4567\n• Health Center: +1 (555) 911-0000\n\nPlease try again in a moment!";
  };

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setError(null);
    
    // Add user message
    const userMessage: ChatMessage = { role: 'user', message: message.trim() };
    setChatHistory(prev => [...prev, userMessage]);
    
    setIsTyping(true);

    try {
      const response = await callGeminiAPI(message, chatHistory);
      setChatHistory(prev => [...prev, { role: 'bot', message: response }]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallback = getFallbackResponse(message);
      setChatHistory(prev => [...prev, { role: 'bot', message: fallback }]);
      setError('Connection issue - using offline mode');
    } finally {
      setIsTyping(false);
    }
  }, [chatHistory]);

  const clearChat = useCallback(() => {
    setChatHistory([
      { 
        role: 'bot', 
        message: "Chat cleared! 🔄 How can I help you today?" 
      }
    ]);
    setError(null);
  }, []);

  return {
    chatHistory,
    isTyping,
    error,
    sendMessage,
    clearChat,
    chatEndRef
  };
};
