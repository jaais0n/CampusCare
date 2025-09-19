import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Activity, Plus, Calendar, Clock, MapPin, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Header from "@/components/Header";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface WheelchairData {
  id: string;
  wheelchair_type: string;
  brand: string;
  model: string;
  location: string;
  status: string;
  condition: string;
  last_maintenance: string;
}

interface WheelchairBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  pickup_location: string;
  return_location: string;
  special_requirements: string;
  status: string;
  admin_notes: string;
  wheelchairs: WheelchairData;
}

const Wheelchairs = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [wheelchairs, setWheelchairs] = useState<WheelchairData[]>([]);
  const [bookings, setBookings] = useState<WheelchairBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Form states
  const [selectedWheelchair, setSelectedWheelchair] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    fetchWheelchairs();
    if (user) fetchBookings();

    return () => subscription.unsubscribe();
  }, [user]);

  const fetchWheelchairs = async () => {
    const { data, error } = await supabase
      .from("wheelchairs")
      .select("*")
      .eq("status", "available")
      .order("wheelchair_type");
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch wheelchairs",
        variant: "destructive",
      });
    } else {
      setWheelchairs(data || []);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("wheelchair_bookings")
      .select(`
        *,
        wheelchairs (
          id,
          wheelchair_type,
          brand,
          model,
          location,
          status,
          condition,
          last_maintenance
        )
      `)
      .eq("user_id", user.id)
      .order("booking_date", { ascending: false });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } else {
      setBookings(data || []);
    }
  };

  const bookWheelchair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    const { error } = await supabase
      .from("wheelchair_bookings")
      .insert({
        user_id: user.id,
        wheelchair_id: selectedWheelchair,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        purpose: purpose,
        pickup_location: pickupLocation,
        return_location: returnLocation,
        special_requirements: specialRequirements,
        status: "pending",
      });

    if (error) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Booking Submitted!",
        description: "Your wheelchair booking request has been submitted for approval.",
      });
      setIsOpen(false);
      resetForm();
      fetchBookings();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedWheelchair("");
    setBookingDate("");
    setStartTime("");
    setEndTime("");
    setPurpose("");
    setPickupLocation("");
    setReturnLocation("");
    setSpecialRequirements("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-warning bg-warning/10";
      case "confirmed": return "text-success bg-success/10";
      case "completed": return "text-primary bg-primary/10";
      case "cancelled": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-muted/10";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent": return "text-success";
      case "good": return "text-primary";
      case "fair": return "text-warning";
      case "poor": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Wheelchair Booking</h1>
            <p className="text-muted-foreground">Reserve wheelchairs for mobility assistance</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:shadow-glow">
                <Plus className="w-4 h-4 mr-2" />
                Book Wheelchair
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Book Wheelchair
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={bookWheelchair} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Wheelchair</Label>
                  <Select value={selectedWheelchair} onValueChange={setSelectedWheelchair} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a wheelchair" />
                    </SelectTrigger>
                    <SelectContent>
                      {wheelchairs.map((wheelchair) => (
                        <SelectItem key={wheelchair.id} value={wheelchair.id}>
                          {wheelchair.wheelchair_type} - {wheelchair.brand} {wheelchair.model}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({wheelchair.location})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Booking Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g., Medical appointment, Campus mobility"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickup">Pickup Location</Label>
                    <Input
                      id="pickup"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder="Where to collect"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="return">Return Location</Label>
                    <Input
                      id="return"
                      value={returnLocation}
                      onChange={(e) => setReturnLocation(e.target.value)}
                      placeholder="Where to return"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Special Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    placeholder="Any special needs or requirements..."
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">
                  {loading ? "Submitting..." : "Submit Booking"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Available Wheelchairs */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Available Wheelchairs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wheelchairs.map((wheelchair) => (
              <Card key={wheelchair.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Wheelchair className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{wheelchair.wheelchair_type}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {wheelchair.brand} {wheelchair.model}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{wheelchair.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Settings className="w-4 h-4 text-primary" />
                      <span className={getConditionColor(wheelchair.condition)}>
                        {wheelchair.condition} condition
                      </span>
                    </div>
                    {wheelchair.last_maintenance && (
                      <p className="text-xs text-muted-foreground">
                        Last serviced: {new Date(wheelchair.last_maintenance).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* My Bookings */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">My Bookings</h2>
          <div className="grid gap-6">
            {bookings.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Wheelchair className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Bookings Yet</h3>
                  <p className="text-muted-foreground mb-4">Book your first wheelchair</p>
                  <Button onClick={() => setIsOpen(true)} className="bg-gradient-primary">
                    Book Wheelchair
                  </Button>
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id} className="border-primary/20">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Wheelchair className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {booking.wheelchairs.wheelchair_type}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {booking.wheelchairs.brand} {booking.wheelchairs.model}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{booking.start_time} - {booking.end_time}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Purpose</h4>
                      <p className="text-sm text-muted-foreground">{booking.purpose}</p>
                    </div>

                    {(booking.pickup_location || booking.return_location) && (
                      <div className="grid grid-cols-2 gap-4">
                        {booking.pickup_location && (
                          <div>
                            <h4 className="font-medium text-foreground mb-1">Pickup</h4>
                            <p className="text-sm text-muted-foreground">{booking.pickup_location}</p>
                          </div>
                        )}
                        {booking.return_location && (
                          <div>
                            <h4 className="font-medium text-foreground mb-1">Return</h4>
                            <p className="text-sm text-muted-foreground">{booking.return_location}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {booking.special_requirements && (
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Special Requirements</h4>
                        <p className="text-sm text-muted-foreground">{booking.special_requirements}</p>
                      </div>
                    )}

                    {booking.admin_notes && (
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <h4 className="font-medium text-primary mb-1">Admin Notes</h4>
                        <p className="text-sm text-primary-foreground">{booking.admin_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Wheelchairs;