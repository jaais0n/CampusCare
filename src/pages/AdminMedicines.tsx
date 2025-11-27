import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Pill, Package, Plus, Edit, Trash2, User, Calendar, Clock, ShoppingCart, Search } from "lucide-react";
import { BackBar } from "@/components/BackBar";
import { Loader, SkeletonCard } from "@/components/ui/loader";
import { useNotificationSound } from "@/hooks/use-notification-sound";

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  brand: string;
  category: string;
  dosage: string;
  price: number;
  stock_quantity: number;
  min_stock_level: number;
  description: string;
  requires_prescription: boolean;
  manufacturer: string;
  expiry_date: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface MedicineOrder {
  id: string;
  order_number: string;
  user_id: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  delivery_instructions: string;
  admin_notes: string;
  ordered_at: string;
  approved_at: string;
  delivered_at: string;
  student_name?: string;
  student_email?: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    medicines: Medicine;
  }[];
}

const CATEGORIES = [
  "pain_relief",
  "vitamins",
  "antibiotics",
  "first_aid",
  "cold_flu",
  "digestive",
  "skin_care",
  "prescription",
  "supplements",
  "other"
];

const AdminMedicines = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const { toast } = useToast();
  const { playNotification } = useNotificationSound();
  const initialLoadRef = useRef(true);

  // Form state for new medicine
  const [formData, setFormData] = useState({
    name: "",
    generic_name: "",
    brand: "",
    category: "other",
    dosage: "",
    price: "",
    stock_quantity: "",
    min_stock_level: "10",
    description: "",
    requires_prescription: false,
    manufacturer: "",
    expiry_date: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email?.toLowerCase();
        const role = (session?.user?.user_metadata as any)?.role as string | undefined;
        const isAdmin = (role || "").toLowerCase() === "admin" || email === "admin@university.edu";

        if (isAdmin || session) {
          setAuthorized(true);
          await Promise.all([fetchMedicines(), fetchOrders()]);
          
          // Realtime subscription for medicine orders
          const subscription = supabase
            .channel('admin_medicines_channel')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'medicine_orders' },
              (payload) => {
                // Skip notification on initial load
                if (initialLoadRef.current) return;
                
                if (payload.eventType === 'INSERT') {
                  playNotification();
                  toast({
                    title: "New Medicine Order!",
                    description: "A new medicine order has been placed",
                  });
                } else if (payload.eventType === 'UPDATE') {
                  playNotification();
                  toast({
                    title: "Order Updated",
                    description: "A medicine order has been modified",
                  });
                }
                fetchOrders(); // Refresh orders list
              }
            )
            .subscribe();

          // Mark initial load complete after first load
          setTimeout(() => { initialLoadRef.current = false; }, 2000);

          // Cleanup subscription
          return () => {
            supabase.removeChannel(subscription);
          };
        } else {
          navigate("/auth", { replace: true });
        }
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/auth", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching medicines:", error);
        toast({ title: "Error", description: "Failed to fetch medicines", variant: "destructive" });
      } else {
        setMedicines(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("medicine_orders")
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            medicines (*)
          )
        `)
        .order("ordered_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
      } else {
        // Fetch user details for each order
        const ordersWithUsers = await Promise.all(
          (data || []).map(async (order: any) => {
            // Try to get profile info
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", order.user_id)
              .single();

            return {
              ...order,
              student_name: profile?.full_name || "Unknown Student",
              student_email: profile?.email || "student@university.edu",
            };
          })
        );
        setOrders(ordersWithUsers);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      generic_name: "",
      brand: "",
      category: "other",
      dosage: "",
      price: "",
      stock_quantity: "",
      min_stock_level: "10",
      description: "",
      requires_prescription: false,
      manufacturer: "",
      expiry_date: "",
    });
  };

  const addMedicine = async () => {
    if (!formData.name || !formData.price || !formData.stock_quantity || !formData.category) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setUpdating("add");
    try {
      const { error } = await supabase.from("medicines").insert({
        name: formData.name,
        generic_name: formData.generic_name || null,
        brand: formData.brand || null,
        category: formData.category,
        dosage: formData.dosage || null,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        min_stock_level: parseInt(formData.min_stock_level) || 10,
        description: formData.description || null,
        requires_prescription: formData.requires_prescription,
        manufacturer: formData.manufacturer || null,
        expiry_date: formData.expiry_date || null,
      });

      if (error) {
        console.error("Error adding medicine:", error);
        toast({ title: "Error", description: error.message || "Failed to add medicine", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Medicine added successfully" });
        setIsAddOpen(false);
        resetForm();
        fetchMedicines();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const openEditDialog = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      generic_name: medicine.generic_name || "",
      brand: medicine.brand || "",
      category: medicine.category,
      dosage: medicine.dosage || "",
      price: medicine.price.toString(),
      stock_quantity: medicine.stock_quantity.toString(),
      min_stock_level: (medicine.min_stock_level || 10).toString(),
      description: medicine.description || "",
      requires_prescription: medicine.requires_prescription,
      manufacturer: medicine.manufacturer || "",
      expiry_date: medicine.expiry_date || "",
    });
    setIsEditOpen(true);
  };

  const updateMedicine = async () => {
    if (!editingMedicine) return;

    setUpdating(editingMedicine.id);
    try {
      const { error } = await supabase
        .from("medicines")
        .update({
          name: formData.name,
          generic_name: formData.generic_name || null,
          brand: formData.brand || null,
          category: formData.category,
          dosage: formData.dosage || null,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity),
          min_stock_level: parseInt(formData.min_stock_level) || 10,
          description: formData.description || null,
          requires_prescription: formData.requires_prescription,
          manufacturer: formData.manufacturer || null,
          expiry_date: formData.expiry_date || null,
        })
        .eq("id", editingMedicine.id);

      if (error) {
        console.error("Error updating medicine:", error);
        toast({ title: "Error", description: "Failed to update medicine", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Medicine updated successfully" });
        setIsEditOpen(false);
        setEditingMedicine(null);
        resetForm();
        fetchMedicines();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const deleteMedicine = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;

    setUpdating(id);
    try {
      const { error } = await supabase.from("medicines").delete().eq("id", id);

      if (error) {
        console.error("Error deleting medicine:", error);
        toast({ title: "Error", description: "Failed to delete medicine", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Medicine deleted successfully" });
        fetchMedicines();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === "approved") {
        updateData.approved_at = new Date().toISOString();
      } else if (newStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("medicine_orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) {
        console.error("Error updating order:", error);
        toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
      } else {
        toast({ title: "Success", description: `Order status updated to ${newStatus}` });
        fetchOrders();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    setUpdating(orderId);
    try {
      const { error } = await supabase.from("medicine_orders").delete().eq("id", orderId);

      if (error) {
        console.error("Error deleting order:", error);
        toast({ title: "Error", description: "Failed to delete order", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Order deleted successfully" });
        fetchOrders();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredMedicines = medicines.filter((med) =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (med.brand && med.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
    med.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockMedicines = medicines.filter((med) => med.stock_quantity <= (med.min_stock_level || 10));

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Checking authorization..." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading medicines..." />
      </div>
    );
  }

  const MedicineForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleFormChange("name", e.target.value)}
            placeholder="Medicine name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="generic_name">Generic Name</Label>
          <Input
            id="generic_name"
            value={formData.generic_name}
            onChange={(e) => handleFormChange("generic_name", e.target.value)}
            placeholder="Generic name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => handleFormChange("brand", e.target.value)}
            placeholder="Brand name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(v) => handleFormChange("category", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleFormChange("price", e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Stock Quantity *</Label>
          <Input
            id="stock_quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => handleFormChange("stock_quantity", e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dosage">Dosage</Label>
          <Input
            id="dosage"
            value={formData.dosage}
            onChange={(e) => handleFormChange("dosage", e.target.value)}
            placeholder="e.g., 500mg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_stock_level">Min Stock Level</Label>
          <Input
            id="min_stock_level"
            type="number"
            value={formData.min_stock_level}
            onChange={(e) => handleFormChange("min_stock_level", e.target.value)}
            placeholder="10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={(e) => handleFormChange("manufacturer", e.target.value)}
            placeholder="Manufacturer name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiry_date">Expiry Date</Label>
          <Input
            id="expiry_date"
            type="date"
            value={formData.expiry_date}
            onChange={(e) => handleFormChange("expiry_date", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleFormChange("description", e.target.value)}
          placeholder="Medicine description..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="requires_prescription"
          checked={formData.requires_prescription}
          onChange={(e) => handleFormChange("requires_prescription", e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor="requires_prescription">Requires Prescription</Label>
      </div>

      <Button
        onClick={isEdit ? updateMedicine : addMedicine}
        disabled={updating !== null}
        className="w-full bg-gradient-primary"
      >
        {updating ? "Saving..." : isEdit ? "Update Medicine" : "Add Medicine"}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <BackBar label="Back to Admin" to="/admin" desktopOnly />

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medicine Management</h1>
            <p className="text-muted-foreground">Manage pharmacy inventory and orders</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Medicine</DialogTitle>
              </DialogHeader>
              <MedicineForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Low Stock Alert */}
        {lowStockMedicines.length > 0 && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <Package className="w-5 h-5" />
                <span className="font-medium">
                  {lowStockMedicines.length} medicine(s) are low on stock!
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                {lowStockMedicines.map((m) => m.name).join(", ")}
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory">
              <Pill className="w-4 h-4 mr-2" />
              Inventory ({medicines.length})
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Orders ({orders.length})
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <div className="relative w-full sm:w-auto sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredMedicines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMedicines.map((medicine) => (
                  <Card key={medicine.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Pill className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">{medicine.name}</h3>
                            {medicine.brand && (
                              <p className="text-xs text-muted-foreground">{medicine.brand}</p>
                            )}
                          </div>
                        </div>
                        {medicine.requires_prescription && (
                          <Badge variant="outline" className="text-xs">Rx</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <p className="font-medium text-primary">₹{medicine.price}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stock:</span>
                          <p className={`font-medium ${medicine.stock_quantity <= (medicine.min_stock_level || 10) ? "text-red-600" : "text-green-600"}`}>
                            {medicine.stock_quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground mb-3">
                        <span className="capitalize">{medicine.category.replace("_", " ")}</span>
                        {medicine.dosage && <span> • {medicine.dosage}</span>}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(medicine)}
                          disabled={updating === medicine.id}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMedicine(medicine.id)}
                          disabled={updating === medicine.id}
                          className="flex-1"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Pill className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Medicines Found</h3>
                  <p className="text-muted-foreground">Add your first medicine to get started</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            <h3 className="font-medium">{order.order_number}</h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <User className="h-4 w-4" />
                            <span>{order.student_name || "Unknown Student"}</span>
                            <span>•</span>
                            <span>{order.student_email || "student@university.edu"}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(order.ordered_at).toLocaleString()}</span>
                          </div>

                          <div className="bg-muted/50 rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium mb-2">Order Items:</p>
                            <div className="space-y-1">
                              {order.order_items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{item.medicines?.name || "Unknown"} × {item.quantity}</span>
                                  <span>₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t mt-2 pt-2">
                              <div className="flex justify-between font-medium">
                                <span>Total:</span>
                                <span className="text-primary">₹{order.total_amount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-sm">
                            <p className="text-muted-foreground">
                              <strong>Delivery Address:</strong> {order.delivery_address}
                            </p>
                            {order.delivery_instructions && (
                              <p className="text-muted-foreground mt-1">
                                <strong>Instructions:</strong> {order.delivery_instructions}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[140px]">
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                            disabled={updating === order.id}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteOrder(order.id)}
                            disabled={updating === order.id}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
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
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Orders Found</h3>
                  <p className="text-muted-foreground">Orders will appear here when students place them</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Medicine Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Medicine</DialogTitle>
            </DialogHeader>
            <MedicineForm isEdit />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminMedicines;
