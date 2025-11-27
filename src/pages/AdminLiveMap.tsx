import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LiveLocationMap from '@/components/LiveLocationMap';
import { BackBar } from '@/components/BackBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SOSAlert {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  created_at: string;
  resolved: boolean;
  profiles: { full_name: string | null; roll_number: string | null } | null;
}

const AdminLiveMap: React.FC = () => {
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select(`
          *,
          profiles ( full_name, roll_number )
        `)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching SOS alerts:', error);
      } else {
        setSosAlerts(data as SOSAlert[]);
      }
      setLoading(false);
    };

    fetchAlerts();

    const channel = supabase
      .channel('emergency-alerts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_alerts' },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <BackBar to="/admin" desktopOnly />
        <h1 className="text-3xl font-bold mb-6">Emergency Monitoring</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading alerts...</p>
              ) : sosAlerts.length > 0 ? (
                <ul className="space-y-4">
                  {sosAlerts.map((alert) => (
                    <li key={alert.id} className="p-3 bg-card-foreground/5 rounded-lg">
                      <p className="font-semibold">{alert.profiles?.full_name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">Roll: {alert.profiles?.roll_number || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No active alerts.</p>
              )}
            </CardContent>
          </Card>
          <div className="h-96 lg:h-full w-full rounded-lg overflow-hidden">
            <LiveLocationMap sosAlerts={sosAlerts} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLiveMap;
