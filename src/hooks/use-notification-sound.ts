import { useRef, useCallback, useEffect } from 'react';

// Notification sound hook for admin pages
export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Create a simple notification beep using Web Audio API
  const playNotification = useCallback(() => {
    try {
      // Create audio context if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create oscillator for beep sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Configure sound - pleasant notification beep
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      oscillator.type = 'sine';
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      
      // Play
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);

      // Second beep
      const oscillator2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      
      oscillator2.frequency.setValueAtTime(1100, ctx.currentTime + 0.15); // Higher note
      oscillator2.type = 'sine';
      
      gainNode2.gain.setValueAtTime(0, ctx.currentTime + 0.15);
      gainNode2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.16);
      gainNode2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.25);
      gainNode2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.45);
      
      oscillator2.start(ctx.currentTime + 0.15);
      oscillator2.stop(ctx.currentTime + 0.45);
      
    } catch (error) {
      console.log('Notification sound error:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { playNotification };
};
