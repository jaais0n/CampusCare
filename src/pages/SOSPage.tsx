import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Phone, MapPin, Clock, AlertCircle, Shield, HeartPulse } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    // @ts-ignore
    const { data, error } = await supabase.rpc('table_exists', { table_name: tableName });
    if (error) {
      console.warn(`RPC 'table_exists' not found. Falling back to a direct query.`, error.message);
      // Fallback for when the RPC function doesn't exist
      // @ts-ignore
      const { data: tableData, error: tableError } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public').eq('table_name', tableName);
      if (tableError) {
        console.error('Fallback check failed:', tableError);
        return false; // Cannot determine, assume false
      }
      return (tableData?.length ?? 0) > 0;
    }
    return data === true;
  } catch (err) {
    console.error('Exception when checking if table exists:', err);
    return false;
  }
}

export default function SOSPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [userProfile, setUserProfile] = useState<{full_name?: string; roll_number?: string} | null>(null);

  useEffect(() => {
    // Check if user is authenticated and fetch profile
    const checkAuthAndFetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch user profile only if a session exists
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, roll_number')
            .eq('id', session.user.id)
            .single();
            
          if (!error && profile) {
            setUserProfile({
              full_name: profile.full_name || session.user.email?.split('@')[0] || 'User',
              roll_number: profile.roll_number || ''
            });
          } else {
            setUserProfile({
              full_name: session.user.email?.split('@')[0] || 'User',
              roll_number: ''
            });
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          setUserProfile({
            full_name: session.user.email?.split('@')[0] || 'User',
            roll_number: ''
          });
        }
      }
    };
    
    checkAuthAndFetchProfile();
    getCurrentLocation();
  }, [navigate, toast]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Could not access your location. Please enable location services.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const handleEmergencyAlert = async () => {
    setIsSendingAlert(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const alertData = {
        user_id: user?.id ?? null,
        user_name: userProfile?.full_name ?? 'Anonymous User',
        user_type: user ? 'student' : 'anonymous',
        status: 'active',
        location: location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : 'Location not available',
        additional_info: JSON.stringify({
          email: user?.email ?? 'N/A',
          roll_number: userProfile?.roll_number ?? 'N/A',
          note: user ? 'Alert from a registered user.' : 'Alert from an anonymous user.'
        })
      };

      const tableAvailable = await checkTableExists('emergency_alerts');
      if (!tableAvailable) {
        throw new Error('Emergency system is not properly configured. Please contact support.');
      }

      // @ts-ignore
      const { error } = await supabase.from('emergency_alerts').insert([alertData]);
      if (error) throw error;

      window.open('tel:112', '_blank');
      toast({ title: "Emergency Alert Sent!", description: "Help is on the way. Stay calm." });

    } catch (error: any) {
      console.error("Error sending alert:", error);
      toast({
        title: "Error Sending Alert",
        description: error.message || "Please try again or call emergency services directly.",
        variant: "destructive"
      });
    } finally {
      setIsSendingAlert(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Emergency Alert Section */}
      <div className="bg-gradient-to-b from-red-600 to-red-700 text-white py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Emergency SOS</h1>
          {userProfile && (
            <div className="bg-white/10 rounded-lg p-3 mb-4 text-left">
              <div className="flex items-center gap-2 text-sm mb-1">
                <span className="font-medium">Name:</span>
                <span>{userProfile.full_name}</span>
              </div>
              {userProfile.roll_number && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Roll No:</span>
                  <span>{userProfile.roll_number}</span>
                </div>
              )}
            </div>
          )}
          <p className="text-red-100 mb-6">
            Press the button below to alert campus security and emergency services
          </p>
          
          <Button
            onClick={handleEmergencyAlert}
            disabled={isSendingAlert}
            className={`w-full max-w-xs h-16 text-lg font-bold bg-white text-red-600 hover:bg-red-50 transition-all ${
              isSendingAlert ? 'opacity-70' : 'hover:scale-105'
            }`}
          >
            {isSendingAlert ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                Sending Alert...
              </div>
            ) : (
              'SEND EMERGENCY ALERT'
            )}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Emergency Contacts */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-red-600" />
            Emergency Contacts
          </h2>
          <div className="space-y-3">
            <EmergencyContact 
              name="Campus Security" 
              number="+911234567890" 
              icon={Shield} 
            />
            <EmergencyContact 
              name="Medical Emergency" 
              number="+911234567891" 
              icon={HeartPulse} 
            />
            <EmergencyContact 
              name="Local Police" 
              number="100" 
              icon={AlertCircle} 
            />
          </div>
        </div>

        {/* Location Status */}
        <Card className="p-4 mb-8">
          <div className="flex items-start gap-3">
            <MapPin className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
              location ? 'text-green-500' : 'text-yellow-500'
            }`} />
            <div>
              <h3 className="font-medium mb-1">
                {location ? 'Your location is being shared' : 'Location access needed'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {location 
                  ? `Approximate location: ${location.lat?.toFixed(4) || 'N/A'}, ${location.lng?.toFixed(4) || 'N/A'}`
                  : 'Enable location services to share your location with emergency contacts.'
                }
              </p>
            </div>
          </div>
        </Card>

        {/* Emergency Instructions */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            In Case of Emergency
          </h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-foreground font-medium">1.</span>
              Stay calm and press the emergency button above
            </li>
            <li className="flex gap-2">
              <span className="text-foreground font-medium">2.</span>
              Provide your name and location to the operator
            </li>
            <li className="flex gap-2">
              <span className="text-foreground font-medium">3.</span>
              Follow the instructions provided by emergency services
            </li>
            <li className="flex gap-2">
              <span className="text-foreground font-medium">4.</span>
              Stay on the line until help arrives
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
