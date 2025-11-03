import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Activity, Calendar, Clock, MapPin, Plus, Settings, Edit, Trash2 } from "lucide-react";
import { BackBar } from "@/components/BackBar";
import type { User as AuthUser } from "@supabase/supabase-js";

interface WheelchairBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose?: string;
  status: string;
  special_requirements?: string;
  admin_notes?: string;
}

const Wheelchairs = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bookings, setBookings] = useState<WheelchairBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [availableCount, setAvailableCount] = useState(20); // Counter-based availability
  const [editingBooking, setEditingBooking] = useState<WheelchairBooking | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    bookingDate: new Date().toISOString().split('T')[0],
    selectedTime: "",
    purpose: "",
    specialRequirements: "",
  });

  const timeSlots = ["09:00", "10:00", "11:30", "12:00", "13:40", "14:40", "15:40"];
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchBookings();
        calculateAvailability();
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchBookings();
      calculateAvailability();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('wheelchair_bookings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'wheelchair_bookings' },
        () => {
          fetchBookings();
          calculateAvailability();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const calculateAvailability = async () => {
    try {
      // Count active bookings (pending, confirmed, in-use)
      const { data, error } = await supabase
        .from('wheelchair_bookings')
        .select('id')
        .in('status', ['pending', 'confirmed']);

      if (error) {
        console.error('Error calculating availability:', error);
        setAvailableCount(20); // Default to 20 if error
      } else {
        const activeBookings = data?.length || 0;
        const available = Math.max(0, 20 - activeBookings); // Never go below 0
        setAvailableCount(available);
      }
    } catch (err) {
      console.error('Unexpected error calculating availability:', err);
      setAvailableCount(20); // Default to 20 if error
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('wheelchair_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: "Error",
          description: "Failed to fetch your bookings",
          variant: "destructive",
        });
        setBookings([]);
      } else {
        setBookings(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching bookings:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setBookings([]);
    }
  };

  const bookWheelchair = async () => {
    if (!user) return;

    if (availableCount <= 0) {
      toast({
        title: "No Wheelchairs Available",
        description: "Sorry, there are no wheelchairs available for booking at this time.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.selectedTime || !formData.purpose) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create booking without wheelchair_id (counter-based system)
      // Handle single time slots (e.g., "10:00") by creating 1-hour duration
      const startTime = formData.selectedTime;
      const [hours, minutes] = startTime.split(':');
      const endHour = (parseInt(hours) + 1).toString().padStart(2, '0');
      const endTime = `${endHour}:${minutes}`;
      
      // Get student name and email from user session
      const studentName = user.user_metadata?.full_name || 
                          user.user_metadata?.name ||
                          user.email?.split('@')[0] || 
                          'Student User';
      const studentEmail = user.email || 'student@university.edu';
      
      console.log('📝 Creating booking with student info:', studentName, studentEmail);
      
      const { data, error } = await supabase
        .from('wheelchair_bookings')
        .insert({
          user_id: user.id,
          wheelchair_id: null, // Optional for counter-based system
          booking_date: formData.bookingDate,
          start_time: startTime,
          end_time: endTime,
          purpose: formData.purpose,
          special_requirements: formData.specialRequirements,
          status: 'pending',
          student_name: studentName,
          student_email: studentEmail,
        });

      if (error) {
        console.error('Error booking wheelchair:', error);
        toast({
          title: "Booking Failed",
          description: "There was an error processing your booking. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Booking Successful",
          description: "Your wheelchair booking has been submitted and is pending approval.",
        });
        setIsOpen(false);
        setFormData({
          bookingDate: new Date().toISOString().split('T')[0],
          selectedTime: "",
          purpose: "",
          specialRequirements: "",
        });
        fetchBookings();
        calculateAvailability(); // Refresh availability count
      }
    } catch (err) {
      console.error('Unexpected error during booking:', err);
      toast({
        title: "Booking Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const editBooking = (booking: WheelchairBooking) => {
    setEditingBooking(booking);
    setFormData({
      bookingDate: booking.booking_date,
      selectedTime: booking.start_time,
      purpose: booking.purpose || "",
      specialRequirements: booking.special_requirements || "",
    });
    setIsEditOpen(true);
  };

  const updateBooking = async () => {
    if (!editingBooking || !user) return;
    
    setLoading(true);
    const [hours, minutes] = formData.selectedTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours + 1, minutes);
    const endTime = endDate.toTimeString().slice(0, 5);

    const { error } = await supabase
      .from('wheelchair_bookings')
      .update({
        booking_date: formData.bookingDate,
        start_time: formData.selectedTime,
        end_time: endTime,
        purpose: formData.purpose || undefined,
        special_requirements: formData.specialRequirements || undefined,
      })
      .eq('id', editingBooking.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update booking', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Booking updated successfully!' });
      setIsEditOpen(false);
      setEditingBooking(null);
      resetForm();
      fetchBookings();
    }
    setLoading(false);
  };

  const deleteBooking = async (bookingId: string) => {
    try {
      // Delete the booking
      const { error: deleteError } = await supabase
        .from('wheelchair_bookings')
        .delete()
        .eq('id', bookingId);

      if (deleteError) {
        console.error('Error deleting booking:', deleteError);
        toast({ 
          title: 'Error', 
          description: 'Failed to delete booking', 
          variant: 'destructive' 
        });
        return;
      }

      toast({ 
        title: 'Success', 
        description: 'Booking deleted successfully! Wheelchair availability updated.' 
      });
      
      fetchBookings();
      calculateAvailability(); // Refresh availability count
    } catch (err) {
      console.error('Unexpected error deleting booking:', err);
      toast({ 
        title: 'Error', 
        description: 'An unexpected error occurred while deleting the booking', 
        variant: 'destructive' 
      });
    }
  };

  const resetForm = () => {
    setFormData({
      bookingDate: new Date().toISOString().split('T')[0],
      selectedTime: "",
      purpose: "",
      specialRequirements: "",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "confirmed": return "text-green-600 bg-green-100";
      case "in-use": return "text-blue-600 bg-blue-100";
      case "returned": return "text-gray-600 bg-gray-100";
      case "cancelled": return "text-red-600 bg-red-100";
      default: return "text-gray-500 bg-gray-50";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent": return "text-green-600";
      case "good": return "text-blue-600";
      case "fair": return "text-yellow-600";
      case "poor": return "text-red-600";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <BackBar label="Back" to="/" />
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Wheelchair Booking</h1>
            <p className="text-muted-foreground">Reserve wheelchairs for mobility assistance</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {availableCount} Available Wheelchairs
              </div>
            </div>
          </div>
          <Button onClick={() => setIsOpen(true)} className="gap-2 bg-gradient-primary" disabled={availableCount <= 0}>
            <Plus className="w-4 h-4" />
            Book Wheelchair
          </Button>
        </div>

        {/* Booking Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Book Wheelchair
                </DialogTitle>
                <p className="text-sm text-muted-foreground">Please fill out the form to book a wheelchair.</p>
              </DialogHeader>
              <form className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="date">Booking Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.bookingDate}
                    onChange={(e) => handleFormChange('bookingDate', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Select Time Slot</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((time) => (
                      <label key={time} className={`w-full flex items-center justify-center rounded-md border px-2 py-2 cursor-pointer ${formData.selectedTime === time ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground border-muted'}`}>
                        <input
                          type="radio"
                          name="timeSlot"
                          value={time}
                          checked={formData.selectedTime === time}
                          onChange={() => handleFormChange('selectedTime', time)}
                          required
                          className="sr-only"
                        />
                        {time}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => handleFormChange('purpose', e.target.value)}
                    placeholder="e.g., Medical appointment, Campus mobility"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Special Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={formData.specialRequirements}
                    onChange={(e) => handleFormChange('specialRequirements', e.target.value)}
                    placeholder="Any special needs or requirements..."
                  />
                </div>

                <Button type="button" onClick={bookWheelchair} disabled={loading} className="w-full bg-gradient-primary">
                  {loading ? "Submitting..." : "Submit Booking"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

        {/* Edit Booking Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Edit Booking
              </DialogTitle>
              <p className="text-sm text-muted-foreground">Update your wheelchair booking details.</p>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Booking Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.bookingDate}
                  onChange={(e) => handleFormChange('bookingDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Select Time Slot</Label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <label key={time} className={`w-full flex items-center justify-center rounded-md border px-2 py-2 cursor-pointer ${formData.selectedTime === time ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground border-muted'}`}>
                      <input
                        type="radio"
                        name="editTimeSlot"
                        value={time}
                        checked={formData.selectedTime === time}
                        onChange={() => handleFormChange('selectedTime', time)}
                        required
                        className="sr-only"
                      />
                      {time}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-purpose">Purpose</Label>
                <Input
                  id="edit-purpose"
                  value={formData.purpose}
                  onChange={(e) => handleFormChange('purpose', e.target.value)}
                  placeholder="e.g., Medical appointment, Campus mobility"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-requirements">Special Requirements</Label>
                <Textarea
                  id="edit-requirements"
                  value={formData.specialRequirements}
                  onChange={(e) => handleFormChange('specialRequirements', e.target.value)}
                  placeholder="Any special needs or requirements..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="button" onClick={updateBooking} disabled={loading} className="flex-1 bg-gradient-primary">
                  {loading ? "Updating..." : "Update Booking"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>



        {/* My Bookings */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">My Bookings</h2>
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Standard Manual Wheelchair</h3>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">Invacare</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                            <span>•</span>
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>{booking.start_time} - {booking.end_time}</span>
                          </div>
                          {booking.purpose && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <strong>Purpose:</strong> {booking.purpose}
                            </p>
                          )}
                          {booking.special_requirements && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <strong>Special Requirements:</strong> {booking.special_requirements}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => editBooking(booking)}>
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteBooking(booking.id)}>
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Bookings Yet</h3>
                <p className="text-muted-foreground mb-4">Book your first wheelchair!</p>
                <Button onClick={() => setIsOpen(true)} className="bg-gradient-primary">
                  Book Wheelchair
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wheelchairs;
