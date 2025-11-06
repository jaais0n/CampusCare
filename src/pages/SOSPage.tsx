import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, MapPin, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  const [geoPermission, setGeoPermission] = useState<PermissionState | null>(null); // 'granted' | 'denied' | 'prompt'
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
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    }
  };

  // Check geolocation permission status (when available)
  useEffect(() => {
    const checkPerm = async () => {
      try {
        // Some browsers do not support Permissions API
        const anyNav: any = navigator as any;
        if (anyNav?.permissions?.query) {
          const status: PermissionStatus = await anyNav.permissions.query({ name: 'geolocation' as PermissionName });
          setGeoPermission(status.state);
          status.onchange = () => setGeoPermission(status.state);
        }
      } catch {
        // Ignore – fall back to explicit button action
      }
    };
    checkPerm();
  }, []);

  // If permission is already granted, attempt to fetch automatically
  useEffect(() => {
    if (geoPermission === 'granted' && !location) {
      getCurrentLocation();
    }
  }, [geoPermission, location]);





  const sendEmergencyAlert = async () => {
    setIsSendingAlert(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated.");
      }

      // Try to fetch profile for better identity info
      let prof: { full_name?: string | null; roll_number?: string | null } = {};
      try {
        const { data: p } = await (supabase.from as any)('profiles')
          .select('full_name, roll_number')
          .eq('id', user.id)
          .single();
        prof = p || {};
      } catch {}

      const userRoll = (user.user_metadata as any)?.roll_number || null;
      const alertData = {
        user_id: user.id,
        user_name: prof.full_name || user.user_metadata.full_name || user.email || 'Anonymous',
        student_name: prof.full_name || null,
        student_roll: prof.roll_number || userRoll || null,
        user_type: user.user_metadata.role || 'unknown',
        status: 'active',
        location: location ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` : 'Location not available',
        additional_info: {
            ...(location ? { latitude: location.latitude, longitude: location.longitude, address: location.address } : {}),
          email: user.email,
          full_name: prof.full_name || user.user_metadata.full_name || null,
          roll_number: prof.roll_number || userRoll || null,
          // Removed profile-specific fields
        },
      };

      console.log("Attempting to insert alert data:", alertData);
      // Cast to any to avoid strict generated types blocking dynamic tables
      const { error } = await (supabase.from as any)('emergency_alerts').insert([alertData]);
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
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-red-950/10 dark:to-background flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse">
              <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Emergency SOS</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Your safety is our priority</p>
        </div>

        {/* Emergency Contacts */}
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Emergency Contacts</h2>
          <div className="space-y-2">
            {emergencyContacts.map((contact) => (
              <EmergencyContact
                key={contact.id}
                name={contact.name}
                number={contact.phone}
                icon={Phone}
              />
            ))}
          </div>
        </div>

        {user ? (
          <div className="space-y-3 sm:space-y-4">
            <p className="text-sm sm:text-base text-muted-foreground">
              <span className="font-semibold">Name:</span> {user.user_metadata.full_name?.toUpperCase() || 'N/A'}
            </p>
            {user.user_metadata.roll_number && (
              <p className="text-sm sm:text-base text-muted-foreground">
                <span className="font-semibold">Roll Number:</span> {user.user_metadata.roll_number}
              </p>
            )}
            <p className="text-sm sm:text-base text-muted-foreground break-all">
              <span className="font-semibold">Email:</span> {user.email}
            </p>
          </div>
        ) : (
          <p className="text-sm sm:text-base text-muted-foreground">Loading user details...</p>
        )}

        {locationError && (
          <div className="p-3 sm:p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-start text-red-600 dark:text-red-400">
              <MapPin size={16} className="mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm sm:text-base break-words">Location Error: {locationError}</span>
            </div>
            <button 
              onClick={getCurrentLocation}
              className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading state */}
        {!location && !locationError && (
          <div className="w-full">
            <div className="w-full h-48 sm:h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm text-muted-foreground">Getting your location...</p>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Live Location Map */}
        {location && (
          <div className="w-full">
            <LiveLocationMap 
              location={location}
              isActive={isSendingAlert}
            />
          </div>
        )}

        {/* Location CTA / Guidance for Mobile */}
        {!location && !locationError && (
          <div className="w-full">
            <div className="p-3 sm:p-4 rounded-lg border border-border bg-card">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base text-foreground mb-1">Enable your location</p>
                  {geoPermission === 'denied' ? (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                      Location permission is blocked by your browser. Go to your browser's Site Settings and allow
                      Location for this site, then return here and tap the button below.
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                      Tap the button to allow access to your current location. On iPhone (Safari) and Android (Chrome),
                      the permission prompt only appears after you interact with the page.
                    </p>
                  )}
                  <Button onClick={getCurrentLocation} variant="secondary" className="w-full text-sm sm:text-base">
                    Turn On Location
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {location && (
          <Card className="p-3 sm:p-4 bg-card border-border">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">Current Location</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{location.address}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </Card>
        )}

        <p className="text-xs sm:text-sm text-center px-2">
          Press the button below to alert campus security and emergency services
        </p>

        <Button
          onClick={handleSendAlertClick}
          disabled={isSendingAlert}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 sm:py-4 px-4 rounded-lg text-lg sm:text-xl transition duration-300 ease-in-out transform hover:scale-105"
        >
          {isSendingAlert ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
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





