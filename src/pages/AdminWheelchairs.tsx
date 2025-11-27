import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Activity, Calendar, Clock, User, MapPin, Settings, Edit, Trash2 } from "lucide-react";
import { BackBar } from "@/components/BackBar";
import { useNotificationSound } from "@/hooks/use-notification-sound";

interface Wheelchair {
  id: string;
  model: string;
  brand: string;
  wheelchair_type: string;
  location: string;
  condition: string;
  last_maintenance: string;
  status: string;
}

interface WheelchairBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose?: string;
  status: string;
  special_requirements?: string;
  admin_notes?: string;
  user_id: string;
  wheelchair_id?: string | null;
  wheelchairs?: Wheelchair | null;
  profiles?: {
    full_name?: string;
    email?: string;
  } | null;
  [key: string]: any; // Allow additional properties from database
}

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
type UIStatus = 'approved' | 'in-use' | 'returned' | 'rejected';

const AdminWheelchairs = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<WheelchairBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const { toast } = useToast();
  const { playNotification } = useNotificationSound();
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email?.toLowerCase();
        const role = (session?.user?.user_metadata as any)?.role as string | undefined;
        const isAdmin = (role || "").toLowerCase() === "admin" || email === "admin@university.edu";
        
        if (isAdmin) {
          setAuthorized(true);
          fetchBookings();
          
          // Realtime subscription for wheelchair bookings
          const subscription = supabase
            .channel('admin_wheelchair_channel')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'wheelchair_bookings' },
              (payload) => {
                // Skip notification on initial load
                if (initialLoadRef.current) return;
                
                if (payload.eventType === 'INSERT') {
                  playNotification();
                  toast({
                    title: "New Wheelchair Booking!",
                    description: "A new wheelchair has been requested",
                  });
                } else if (payload.eventType === 'UPDATE') {
                  playNotification();
                  toast({
                    title: "Booking Updated",
                    description: "A wheelchair booking has been modified",
                  });
                }
                fetchBookings(); // Refresh the list
              }
            )
            .subscribe();

          // Mark initial load complete after first load
          setTimeout(() => { initialLoadRef.current = false; }, 2000);

          return () => {
            supabase.removeChannel(subscription);
          };
        } else {
          navigate("/auth", { replace: true });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate("/auth", { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  const statusMapping = {
    // UI status -> DB status
    'approved': 'confirmed',
    'in-use': 'confirmed', 
    'returned': 'completed',
    'rejected': 'cancelled'
  } as const;

  const reverseStatusMapping = {
    // DB status -> UI status
    'pending': 'pending',
    'confirmed': 'approved',
    'completed': 'returned',
    'cancelled': 'rejected'
  } as const;

  const statusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in-use': return 'bg-blue-100 text-blue-800';
      case 'returned': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      console.log('🔍 Admin fetching wheelchair bookings...');
      
      // Check current user session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('👤 Current session:', session?.user?.email, session?.user?.user_metadata?.role);
      
      // Get bookings with student info columns
      const { data: simpleData, error: simpleError } = await supabase
        .from('wheelchair_bookings')
        .select('*, student_name, student_email')
        .order('created_at', { ascending: false });
        
      if (simpleError) {
        console.error('❌ Error fetching simple bookings:', simpleError);
        toast({
          title: "Error",
          description: `Failed to fetch wheelchair bookings: ${simpleError.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Fetched bookings:', simpleData?.length || 0, 'records');
      
      if (simpleData && simpleData.length > 0) {
        // Use the stored student name and email from the database (like counseling admin)
        const enhancedBookings = simpleData.map((booking: any) => {
          console.log('🔍 Processing booking:', booking.id);
          console.log('📋 Stored student data:', booking.student_name, booking.student_email);
          
          // Use the student name and email that was stored during booking
          const studentName = booking.student_name || 'Unknown Student';
          const studentEmail = booking.student_email || 'student@university.edu';
          
          console.log('✅ Using stored student data:', studentName, studentEmail);
          
          return {
            ...booking,
            profiles: {
              full_name: studentName,
              email: studentEmail
            }
          };
        });
        
        console.log('✅ Enhanced bookings with user data:', enhancedBookings.length);
        setBookings(enhancedBookings as unknown as WheelchairBooking[]);
      } else {
        console.log('📝 No bookings found');
        setBookings([]);
      }
    } catch (err) {
      console.error('💥 Unexpected error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newUIStatus: UIStatus, adminNotes?: string) => {
    setUpdating(bookingId);
    
    // Map UI status to DB status
    let dbStatus: BookingStatus;
    switch (newUIStatus) {
      case 'approved':
        dbStatus = 'confirmed';
        break;
      case 'in-use':
        dbStatus = 'confirmed';
        break;
      case 'returned':
        dbStatus = 'completed';
        break;
      case 'rejected':
        dbStatus = 'cancelled';
        break;
      default:
        dbStatus = 'pending';
    }
    
    try {
      // Update booking status (no individual wheelchair updates in counter-based system)
      const { error: updateError } = await supabase
        .from('wheelchair_bookings')
        .update({ 
          status: dbStatus,
          admin_notes: adminNotes || null
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Error updating booking:', updateError);
        toast({
          title: "Error",
          description: "Failed to update booking status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Booking status updated to ${newUIStatus}`,
      });
      fetchBookings();
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    setUpdating(bookingId);
    
    try {
      const { error } = await supabase
        .from('wheelchair_bookings')
        .delete()
        .eq('id', bookingId);

      if (error) {
        console.error('Error deleting booking:', error);
        toast({
          title: "Error",
          description: "Failed to delete booking",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Booking deleted successfully",
        });
        fetchBookings();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  if (!authorized) {
    return <div>Checking authorization...</div>;
  }

  if (loading) {
    return <div>Loading wheelchair bookings...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <BackBar label="Back to Admin" to="/admin" desktopOnly />
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Wheelchair Management</h1>
          <p className="text-muted-foreground">Manage wheelchair bookings and availability</p>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const uiStatus = reverseStatusMapping[booking.status as keyof typeof reverseStatusMapping] || booking.status;
              
              return (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                            <h3 className="font-medium">Standard Manual Wheelchair</h3>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${statusClass(uiStatus)}`}>
                              {uiStatus}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">Invacare</p>
                          
                          {/* User Info */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">{booking.profiles?.full_name || 'Unknown User'}</span>
                            <span>•</span>
                            <span>{booking.profiles?.email || 'No email'}</span>
                          </div>
                          
                          {/* Date and Time */}
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                            <span>•</span>
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>{booking.start_time} - {booking.end_time}</span>
                          </div>
                          
                          {/* Purpose */}
                          {booking.purpose && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <strong>Purpose:</strong> {booking.purpose}
                            </p>
                          )}
                          
                          {/* Special Requirements */}
                          {booking.special_requirements && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <strong>Special Requirements:</strong> {booking.special_requirements}
                            </p>
                          )}
                          
                          {/* Admin Notes */}
                          {booking.admin_notes && (
                            <div className="bg-blue-50 p-2 rounded mt-2">
                              <p className="text-sm text-blue-800">
                                <strong>Admin Notes:</strong> {booking.admin_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Admin Actions */}
                      <div className="flex flex-col gap-2 mt-4 md:mt-0 md:ml-4">
                        <div className="min-w-[140px]">
                          <Select 
                            value={uiStatus} 
                            onValueChange={(value: UIStatus) => updateBookingStatus(booking.id, value)}
                            disabled={updating === booking.id}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="in-use">In Use</SelectItem>
                              <SelectItem value="returned">Returned</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteBooking(booking.id)}
                          disabled={updating === booking.id}
                          className="h-8 text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Bookings Found</h3>
              <p className="text-muted-foreground">No wheelchair bookings to manage at this time.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminWheelchairs;
