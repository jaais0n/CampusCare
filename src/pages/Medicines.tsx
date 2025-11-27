import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pill, Plus, Minus, ShoppingCart, Search, Package, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BackBar } from "@/components/BackBar";
import { Loader, SkeletonCard } from "@/components/ui/loader";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  brand: string;
  category: string;
  dosage: string;
  price: number;
  stock_quantity: number;
  description: string;
  requires_prescription: boolean;
  manufacturer: string;
  expiry_date: string;
}

interface CartItem {
  id: string;
  medicine_id: string;
  quantity: number;
  medicines: Medicine;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  ordered_at: string;
  delivery_address: string;
  order_items: {
    quantity: number;
    unit_price: number;
    medicines: Medicine;
  }[];
}

const Medicines = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    email: string;
    roll_number: string | null;
    course: string | null;
    department: string | null;
    phone: string | null;
  } | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(true);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  const { toast } = useToast();

  // Fetch user profile (same approach as Header.tsx)
  const fetchUserProfile = async (userId: string, userEmail: string, userMetadata: any) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, roll_number, course, department, phone")
        .eq("id", userId);
      
      if (!error && data) {
        const profile = Array.isArray(data) ? data[0] : data;
        let name = profile?.full_name || "";
        
        // Fallback: check user_metadata, then email prefix
        if (!name) {
          const metaName = userMetadata?.full_name as string | undefined;
          const fallbackFromMeta = (metaName && metaName.trim()) ? metaName.trim() : null;
          const fallbackFromEmail = userEmail ? userEmail.split("@")[0] : null;
          name = fallbackFromMeta || fallbackFromEmail || "";
        }
        
        setUserProfile({
          full_name: name,
          email: profile?.email || userEmail || '',
          roll_number: profile?.roll_number || null,
          course: profile?.course || null,
          department: profile?.department || null,
          phone: profile?.phone || null
        });
      } else {
        // Fallback from user metadata/email
        const metaName = userMetadata?.full_name as string | undefined;
        setUserProfile({
          full_name: metaName || userEmail?.split('@')[0] || '',
          email: userEmail || '',
          roll_number: null,
          course: null,
          department: null,
          phone: null
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    let ordersSubscription: ReturnType<typeof supabase.channel> | null = null;
    let medicinesSubscription: ReturnType<typeof supabase.channel> | null = null;

    const checkSessionAndFetchData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate("/auth", { state: { message: "You must be logged in to access the pharmacy." } });
        return;
      }

      setUser(session.user);
      fetchUserProfile(session.user.id, session.user.email || '', session.user.user_metadata);
      fetchMedicines();
      fetchCartItems(session.user);
      fetchOrders(session.user);

      // Subscribe to order status changes for this user
      ordersSubscription = supabase
        .channel('user-orders-changes')
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'medicine_orders', filter: `user_id=eq.${session.user.id}` },
          (payload) => {
            const updatedOrder = payload.new as Order;
            setOrders(prev => prev.map(order => 
              order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
            ));
            
            // Show toast notification for status changes
            const statusMessages: Record<string, string> = {
              'approved': '✅ Your order has been approved!',
              'processing': '📦 Your order is being prepared',
              'ready': '🎉 Your order is ready for pickup!',
              'delivered': '✅ Your order has been delivered',
              'cancelled': '❌ Your order was cancelled'
            };
            
            if (statusMessages[updatedOrder.status]) {
              toast({
                title: "Order Update",
                description: statusMessages[updatedOrder.status],
              });
            }
          }
        )
        .subscribe();

      // Subscribe to medicine stock changes (for real-time availability)
      medicinesSubscription = supabase
        .channel('medicines-stock-changes')
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'medicines' },
          (payload) => {
            const updatedMedicine = payload.new as Medicine;
            setMedicines(prev => prev.map(med => 
              med.id === updatedMedicine.id ? updatedMedicine : med
            ));
          }
        )
        .subscribe();
    };

    checkSessionAndFetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth", { state: { message: "Your session has expired. Please log in again." } });
      } else {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (ordersSubscription) supabase.removeChannel(ordersSubscription);
      if (medicinesSubscription) supabase.removeChannel(medicinesSubscription);
    };
  }, [navigate]);

  const fetchMedicines = async () => {
    setIsLoadingMedicines(true);
    try {
      const { data, error } = await supabase.from("medicines").select("*").order("name");
      if (error) {
        toast({ title: "Error", description: "Failed to fetch medicines", variant: "destructive" });
      } else {
        setMedicines(data || []);
      }
    } catch (err) {
      console.error("Error fetching medicines:", err);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsLoadingMedicines(false);
    }
  };

  const fetchCartItems = async (currentUser: SupabaseUser) => {
    if (!currentUser) return;
    setIsLoadingCart(true);
    try {
      const { data, error } = await supabase.from("cart_items").select(`*, medicines (*)`).eq("user_id", currentUser.id);
      if (error) {
        toast({ title: "Error", description: "Failed to fetch cart items", variant: "destructive" });
      } else {
        setCartItems(data || []);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setIsLoadingCart(false);
    }
  };

  const fetchOrders = async (currentUser: SupabaseUser) => {
    if (!currentUser) return;
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase.from("medicine_orders").select(`*, order_items (quantity, unit_price, medicines (*))`).eq("user_id", currentUser.id).order("ordered_at", { ascending: false });
      if (error) {
        toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const addToCart = async (medicine: Medicine) => {
    if (!user) return;
    
    // Check if stock is available
    if (medicine.stock_quantity <= 0) {
      toast({ title: "Out of Stock", description: `${medicine.name} is currently out of stock`, variant: "destructive" });
      return;
    }
    
    const existingItem = cartItems.find(item => item.medicine_id === medicine.id);
    
    // Check if adding more would exceed stock
    if (existingItem && existingItem.quantity >= medicine.stock_quantity) {
      toast({ title: "Stock Limit", description: `Only ${medicine.stock_quantity} units available`, variant: "destructive" });
      return;
    }
    
    if (existingItem) {
      const { error } = await supabase.from("cart_items").update({ quantity: existingItem.quantity + 1 }).eq("id", existingItem.id);
      if (error) {
        toast({ title: "Error", description: "Failed to update cart", variant: "destructive" });
      } else {
        fetchCartItems(user);
        toast({ title: "Cart Updated", description: `${medicine.name} quantity increased` });
      }
    } else {
      const { error } = await supabase.from("cart_items").insert({ user_id: user.id, medicine_id: medicine.id, quantity: 1 });
      if (error) {
        toast({ title: "Error", description: "Failed to add to cart", variant: "destructive" });
      } else {
        fetchCartItems(user);
        toast({ title: "Added to Cart", description: `${medicine.name} added to your cart` });
      }
    }
  };

  const updateCartQuantity = async (itemId: string, newQuantity: number) => {
    if (!user) return;
    if (newQuantity <= 0) {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) {
        toast({ title: "Error", description: "Failed to remove item", variant: "destructive" });
      } else {
        fetchCartItems(user);
      }
    } else {
      const { error } = await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", itemId);
      if (error) {
        toast({ title: "Error", description: "Failed to update quantity", variant: "destructive" });
      } else {
        fetchCartItems(user);
      }
    }
  };

  const checkout = async () => {
    if (!user || cartItems.length === 0) return;
    
    setLoading(true);
    
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (item.medicines.price * item.quantity), 
      0
    );
    
    const orderNumber = `ORD-${Date.now()}`;
    
    const { data: order, error: orderError } = await supabase
      .from("medicine_orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        total_amount: totalAmount,
        delivery_address: deliveryAddress,
        delivery_instructions: deliveryInstructions,
        status: "pending",
      })
      .select()
      .single();
    
    if (orderError) {
      toast({ title: "Order Failed", description: orderError.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      medicine_id: item.medicine_id,
      quantity: item.quantity,
      unit_price: item.medicines.price,
      total_price: item.medicines.price * item.quantity,
    }));
    
    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    
    if (itemsError) {
      toast({ title: "Order Failed", description: itemsError.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    
    // Update stock quantity for each medicine
    for (const item of cartItems) {
      const newStock = item.medicines.stock_quantity - item.quantity;
      await supabase
        .from("medicines")
        .update({ stock_quantity: Math.max(0, newStock) })
        .eq("id", item.medicine_id);
    }
    
    const { error: clearError } = await supabase.from("cart_items").delete().eq("user_id", user.id);
    
    if (clearError) {
      console.error("Failed to clear cart:", clearError);
    }
    
    toast({ title: "Order Placed!", description: `Order ${orderNumber} has been placed successfully.` });
    
    setIsCartOpen(false);
    setDeliveryAddress("");
    setDeliveryInstructions("");
    fetchCartItems(user);
    fetchOrders(user);
    fetchMedicines(); // Refresh medicines to show updated stock
    setLoading(false);
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.medicines.price * item.quantity,
    0
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-warning bg-warning/10";
      case "approved":
        return "text-primary bg-primary/10";
      case "delivered":
        return "text-success bg-success/10";
      case "cancelled":
        return "text-destructive bg-destructive/10";
      default:
        return "text-muted-foreground bg-muted/10";
    }
  };

  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (med.brand && med.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
    med.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <BackBar label="Back" to="/" desktopOnly />
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pharmacy</h1>
            <p className="text-muted-foreground">Order medicines from the campus pharmacy</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isOrdersOpen} onOpenChange={setIsOrdersOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Package className="w-4 h-4 mr-2" />
                  My Orders
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>My Orders</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">You have no past orders.</p>
                  ) : orders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{order.order_number}</CardTitle>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Ordered on {new Date(order.ordered_at).toLocaleDateString()}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {order.order_items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span>{item.medicines.name} × {item.quantity}</span>
                              <span>₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-semibold">
                            <span>Total: ₹{order.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:shadow-glow relative">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                  {cartItems.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Shopping Cart</DialogTitle>
                </DialogHeader>
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.medicines.name}</h4>
                          <p className="text-sm text-muted-foreground">₹{item.medicines.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4">
                      <div className="flex justify-between font-semibold mb-4">
                        <span>Total: ₹{cartTotal.toFixed(2)}</span>
                      </div>
                      
                      {/* Student Details Section */}
                      <div className="bg-muted/50 rounded-lg p-3 mb-4">
                        <h4 className="font-medium text-sm mb-2">Student Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name:</span>
                            <p className="font-medium uppercase">{userProfile?.full_name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Roll No:</span>
                            <p className="font-medium uppercase">{userProfile?.roll_number || user?.email?.split('@')[0] || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <p className="font-medium truncate">{userProfile?.email || user?.email || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Course:</span>
                            <p className="font-medium uppercase">{userProfile?.course || 'N/A'}</p>
                          </div>
                          {userProfile?.department && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Department:</span>
                              <p className="font-medium uppercase">{userProfile.department}</p>
                            </div>
                          )}
                          {userProfile?.phone && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Phone:</span>
                              <p className="font-medium">{userProfile.phone}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">Delivery Address / Room Number</Label>
                          <Textarea id="address" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Enter room number or delivery location..." required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                          <Textarea id="instructions" value={deliveryInstructions} onChange={(e) => setDeliveryInstructions(e.target.value)} placeholder="Any special instructions..." />
                        </div>
                        <Button onClick={checkout} disabled={loading || !deliveryAddress} className="w-full bg-gradient-primary">
                          {loading ? "Processing..." : "Place Order"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative w-full sm:w-auto sm:max-w-xs mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input type="text" placeholder="Search medicines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingMedicines ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            filteredMedicines.map((medicine) => (
            <Card key={medicine.id} className="border-primary/20 hover:shadow-glow transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Pill className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{medicine.name}</CardTitle>
                      {medicine.generic_name && (
                        <p className="text-sm text-muted-foreground">Generic: {medicine.generic_name}</p>
                      )}
                    </div>
                  </div>
                  {medicine.requires_prescription && (
                    <Badge variant="outline" className="text-xs">Prescription</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Brand:</span>
                    <p className="font-medium">{medicine.brand || "Generic"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{medicine.category}</p>
                  </div>
                </div>

                {medicine.dosage && (
                  <div>
                    <span className="text-muted-foreground text-sm">Dosage:</span>
                    <p className="font-medium">{medicine.dosage}</p>
                  </div>
                )}

                {medicine.description && (
                  <p className="text-sm text-muted-foreground">{medicine.description}</p>
                )}

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-primary">₹{medicine.price}</p>
                    <p className="text-xs text-muted-foreground">Stock: {medicine.stock_quantity}</p>
                  </div>
                  <Button onClick={() => addToCart(medicine)} disabled={medicine.stock_quantity === 0} className="bg-gradient-primary hover:shadow-glow">
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>

                {medicine.expiry_date && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Expires: {new Date(medicine.expiry_date).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
          )}
        </div>
        {!isLoadingMedicines && filteredMedicines.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Medicines Found</h3>
              <p className="text-muted-foreground">Try searching with different keywords</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Medicines;