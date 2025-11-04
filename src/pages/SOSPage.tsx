import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, MapPin, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase, tableExists } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import LiveLocationMap from '@/components/LiveLocationMap';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { User as AuthUser } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


const EmergencyContact = ({ name, number, icon: Icon }: { name: string; number: string; icon: React.ElementType }) => (
  <a 
    href={`tel:${number}`}
    className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:bg-accent transition-colors"
  >
    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
      <Icon className="h-5 w-5 text-red-600 dark:text-red-400" />
    </div>
    <div className="flex-1">
      <p className="font-medium text-foreground">{name}</p>
      <p className="text-sm text-muted-foreground">{number}</p>
    </div>
    <Phone className="h-5 w-5 text-primary" />
  </a>
);


const SOSPage = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]); // Replace 'any' with actual type
  const { toast } = useToast();
  const navigate = useNavigate();
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const [showWarningPopup, setShowWarningPopup] = useState(false);

  const [isPlayingSound, setIsPlayingSound] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Supabase Session:', session); // Add this line
      setUser(session?.user || null);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Get address from coordinates using reverse geocoding
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
            const data = await response.json();
            
            const address = data.display_name || `${data.address?.road || ''}, ${data.address?.suburb || ''}, ${data.address?.city || ''}`.trim();
            
            setLocation({
              latitude,
              longitude,
              address: address || 'Location details not available'
            });
          } catch (error) {
            console.error("Error getting address:", error);
            setLocation({
              latitude,
              longitude,
              address: 'Address details unavailable'
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Could not access your location. Please enable location services.");
          toast({
            title: "Location Error",
            description: "Could not access your location. Please enable location services.",
            variant: "destructive",
          });
        }
      );
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);





  const sendEmergencyAlert = async () => {
    setIsSendingAlert(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated.");
      }

      const alertData = {
        user_id: user.id,
        user_name: user.user_metadata.full_name || user.email || 'Anonymous',
        user_type: user.user_metadata.role || 'unknown',
        status: 'active',
        location: location ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` : 'Location not available',
        additional_info: {
            ...(location ? { latitude: location.latitude, longitude: location.longitude, address: location.address } : {}),
          email: user.email,
          // Removed profile-specific fields
        },
      };

      const tableAvailable = await tableExists('emergency_alerts');
      if (!tableAvailable) {
        throw new Error('Emergency system is not properly configured. Please contact support.');
      }

      console.log("Attempting to insert alert data:", alertData);
      const { error } = await supabase.from('emergency_alerts').insert([alertData]);
      if (error) {
        console.error("Error inserting alert data:", error);
        throw error;
      }
      console.log("Alert data inserted successfully.");

      setIsPlayingSound(true); // Start playing sound after alert is sent

      // window.open('tel:112', '_blank');
      toast({ title: "Emergency Alert Sent!", description: "Help is on the way. Stay calm." });

    } catch (error: any) {
      console.error("Error sending alert:", error);
      toast({
        title: "Error Sending Alert",
        description: error.message || "Please try again or call emergency services directly.",
        variant: "destructive",
      });
    } finally {
      setIsSendingAlert(false);
      setShowWarningPopup(false); // Close popup after sending alert
    }
  };

  const handleSendAlertClick = () => {
    setShowWarningPopup(true);
  };

  useEffect(() => {
    if (alertAudioRef.current) {
      if (isPlayingSound) {
        console.log("Attempting to play audio...");
        alertAudioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
        });
      } else {
        console.log("Pausing audio...");
        alertAudioRef.current.pause();
        alertAudioRef.current.currentTime = 0;
      }
    }
  }, [isPlayingSound]);

  return (
    <div className={`min-h-screen bg-background flex flex-col items-center justify-center p-4 text-foreground ${isSendingAlert ? 'animate-alert-flash' : ''} ${showWarningPopup ? 'filter blur-sm' : ''}`}>
      {/* Hidden audio element for better browser compatibility */}
      <audio
        ref={alertAudioRef}
        src="/Alertsound.mp3"
        preload="auto"
        onEnded={() => setIsPlayingSound(false)} // Stop playing sound when it ends
        style={{ display: 'none' }}
      />
      
      
      <div className="text-center mb-8">
        <AlertTriangle
          size={64}
          className={`mx-auto mb-4 ${isSendingAlert ? 'text-foreground' : 'text-red-600 dark:text-red-400'} filter animate-[pulse_1.6s_ease-in-out_infinite] ${isSendingAlert ? 'drop-shadow-[0_0_24px_rgba(0,0,0,0.9)] scale-105' : 'drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]'}`}
        />
        <h1 className="text-4xl font-bold text-foreground">Emergency SOS</h1>
      </div>

      <div className="bg-card p-8 rounded-lg shadow-xl w-full max-w-md text-center border border-border">
        {user ? (
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
            <span className="font-semibold">Name:</span> {user.user_metadata.full_name?.toUpperCase() || 'N/A'}
          </p>
          {user.user_metadata.roll_number && (
            <p className="text-lg text-muted-foreground">
              <span className="font-semibold">Roll Number:</span> {user.user_metadata.roll_number}
            </p>
          )}
          <p className="text-lg text-muted-foreground">
            <span className="font-semibold">Email:</span> {user.email}
          </p>
        </div>
      ) : (
        <p className="text-lg text-muted-foreground">Loading user details...</p>
      )}

      {locationError && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center text-red-600 dark:text-red-400">
            <MapPin size={16} className="mr-2" />
            <span>Location Error: {locationError}</span>
          </div>
          <button 
            onClick={getCurrentLocation}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading state */}
      {!location && !locationError && (
        <div className="mt-6 w-full max-w-md">
          <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p className="text-muted-foreground">Getting your location...</p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Live Location Map */}
      {location && (
        <div className="mt-6 w-full max-w-md">
          <LiveLocationMap 
            location={location}
            isActive={isSendingAlert}
          />
        </div>
      )}

      <p className="text-sm text-center">
        Press the button below to alert campus security and emergency
        services
      </p>



      <Button
        onClick={handleSendAlertClick}
        disabled={isSendingAlert}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg text-xl transition duration-300 ease-in-out transform hover:scale-105 mt-4"
      >
          {isSendingAlert ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Sending Alert...
            </span>
          ) : (
            "Send Emergency Alert"
          )}
        </Button>
      </div>

      <Dialog open={showWarningPopup} onOpenChange={setShowWarningPopup}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Emergency Alert</DialogTitle>
            <DialogDescription>
              This button is for EMERGENCIES ONLY. Misuse will result in a ₹5000 fine.
              Are you sure you want to send an emergency alert?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarningPopup(false)}>Cancel</Button>
            <Button variant="destructive" onClick={sendEmergencyAlert}>Confirm Alert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SOSPage;





