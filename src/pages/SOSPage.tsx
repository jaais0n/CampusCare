import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { AuthUser } from '@/types/auth';
import { Tables } from '@/types/supabase';

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]); // Replace 'any' with actual type
  const { toast } = useToast();
  const navigate = useNavigate();

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
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
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

  const handleSendAlert = async () => {
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
          email: user.email,
          // Removed profile-specific fields
        },
      };

      const tableAvailable = await checkTableExists('emergency_alerts');
      if (!tableAvailable) {
        throw new Error('Emergency system is not properly configured. Please contact support.');
      }

      const { error } = await supabase.from('emergency_alerts').insert([alertData]);
      if (error) throw error;

      window.open('tel:112', '_blank');
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
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-gray-800 dark:text-white ${isSendingAlert ? 'animate-alert-flash' : ''}`}>
      <div className="text-center mb-8">
        <AlertTriangle
          size={64}
          className={`mx-auto mb-4 ${isSendingAlert ? 'text-black' : 'text-red-600 dark:text-red-400'} filter animate-[pulse_1.6s_ease-in-out_infinite] ${isSendingAlert ? 'drop-shadow-[0_0_24px_rgba(0,0,0,0.9)] scale-105' : 'drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]'}`}
        />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Emergency SOS</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center border border-gray-200 dark:border-gray-700">
        {user ? (
          <div className="space-y-4">
            <p className="text-lg text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Name:</span> {user.user_metadata.full_name?.toUpperCase() || 'N/A'}
          </p>
          {user.user_metadata.roll_number && (
            <p className="text-lg text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Roll Number:</span> {user.user_metadata.roll_number}
            </p>
          )}
          <p className="text-lg text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Email:</span> {user.email}
          </p>
        </div>
      ) : (
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading user details...</p>
      )}

      {locationError && (
        <p className="text-red-500 mt-4">Location Error: {locationError}</p>
      )}

      {location && (
        <p className="text-base mt-4 flex items-center justify-center text-gray-600 dark:text-gray-400">
          <MapPin size={18} className="mr-2" />
          Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </p>
      )}

      <p className="text-base mt-6 mb-4 text-gray-600 dark:text-gray-400">
        Press the button below to alert campus security and emergency services
      </p>

      <Button
        onClick={handleSendAlert}
        disabled={isSendingAlert}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg text-xl transition duration-300 ease-in-out transform hover:scale-105"
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
    </div>
  );
}
