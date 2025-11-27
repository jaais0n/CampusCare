import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { User as AuthUser } from "@supabase/supabase-js";
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Building2, 
  IdCard, 
  Camera, 
  Save, 
  Loader2,
  Edit3,
  LogOut,
  ZoomIn,
  RotateCw,
  Check,
  X
} from "lucide-react";
import { BackBar } from "@/components/BackBar";

interface UserProfile {
  id?: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  roll_number: string;
  course: string;
  department: string;
  avatar_url?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
    phone: "",
    roll_number: "",
    course: "",
    department: "",
    avatar_url: "",
  });

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setUser(session.user);
      await fetchProfile(session.user);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth", { replace: true });
      } else {
        setUser(session.user);
        fetchProfile(session.user);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchProfile = async (authUser: AuthUser) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from("profiles") as any)
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error);
      }

      const metadata = authUser.user_metadata || {};
      const profileData = data as any;
      
      setProfile({
        id: profileData?.id,
        user_id: authUser.id,
        full_name: profileData?.full_name || metadata.full_name || "",
        email: profileData?.email || authUser.email || "",
        phone: profileData?.phone || metadata.phone || "",
        roll_number: profileData?.roll_number || metadata.roll_number || "",
        course: profileData?.course || metadata.course || "",
        department: profileData?.department || metadata.department || "",
        avatar_url: profileData?.avatar_url || metadata.avatar_url || "",
      });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setPreviewImage(img);
        setSelectedFile(file);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setShowCropDialog(true);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  const drawPreview = useCallback(() => {
    if (!previewImage || !previewCanvasRef.current) return;
    
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 250;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, size, size);

    const imgAspect = previewImage.width / previewImage.height;
    let drawWidth, drawHeight;
    
    if (imgAspect > 1) {
      drawHeight = size * zoom;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = size * zoom;
      drawHeight = drawWidth / imgAspect;
    }

    const x = (size - drawWidth) / 2 + position.x;
    const y = (size - drawHeight) / 2 + position.y;

    ctx.drawImage(previewImage, x, y, drawWidth, drawHeight);

    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    ctx.stroke();
  }, [previewImage, zoom, position]);

  useEffect(() => {
    if (showCropDialog) {
      drawPreview();
    }
  }, [showCropDialog, drawPreview]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    const maxPan = 100 * zoom;
    setPosition({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    const maxPan = 100 * zoom;
    setPosition({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY))
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetCrop = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const applyCropAndUpload = async () => {
    if (!previewImage || !user) return;

    setUploading(true);
    setShowCropDialog(false);

    try {
      const oldAvatarUrl = profile.avatar_url;
      if (oldAvatarUrl && oldAvatarUrl.includes('supabase') && oldAvatarUrl.includes('/avatars/')) {
        try {
          const urlParts = oldAvatarUrl.split('/avatars/');
          if (urlParts.length > 1) {
            const oldFilePath = `avatars/${urlParts[1].split('?')[0]}`;
            await supabase.storage.from('avatars').remove([oldFilePath]);
          }
        } catch (deleteError) {
          console.log('Could not delete old avatar:', deleteError);
        }
      }

      toast({
        title: "Processing image...",
        description: "Please wait",
      });

      const outputSize = 300;
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      const imgAspect = previewImage.width / previewImage.height;
      let drawWidth, drawHeight;
      
      if (imgAspect > 1) {
        drawHeight = outputSize * zoom;
        drawWidth = drawHeight * imgAspect;
      } else {
        drawWidth = outputSize * zoom;
        drawHeight = drawWidth / imgAspect;
      }

      const scale = outputSize / 250;
      const x = (outputSize - drawWidth) / 2 + (position.x * scale);
      const y = (outputSize - drawHeight) / 2 + (position.y * scale);

      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(previewImage, x, y, drawWidth, drawHeight);

      const blob = await new Promise<Blob>((resolve, reject) => {
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            (b) => {
              if (!b) {
                reject(new Error('Failed to create blob'));
                return;
              }
              const sizeKB = b.size / 1024;
              console.log(`Compressed to ${sizeKB.toFixed(1)}KB at quality ${quality.toFixed(2)}`);
              if (sizeKB > 80 && quality > 0.1) {
                quality -= 0.1;
                tryCompress();
              } else {
                resolve(b);
              }
            },
            'image/jpeg',
            quality
          );
        };
        tryCompress();
      });

      const base64Promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const newAvatarUrl = await base64Promise;

      const { data: updateData } = await (supabase
        .from("profiles") as any)
        .update({
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select();

      if (!updateData || updateData.length === 0) {
        await (supabase
          .from("profiles") as any)
          .update({
            avatar_url: newAvatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select();
      }

      await supabase.auth.updateUser({
        data: { avatar_url: newAvatarUrl }
      });

      setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      setPreviewImage(null);
      setSelectedFile(null);

      toast({
        title: "Profile photo updated!",
        description: "Your new photo has been saved successfully",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const cancelCrop = () => {
    setShowCropDialog(false);
    setPreviewImage(null);
    setSelectedFile(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error: updateError } = await (supabase
        .from("profiles") as any)
        .update({
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          roll_number: profile.roll_number,
          course: profile.course,
          department: profile.department,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        const { error: insertError } = await (supabase
          .from("profiles") as any)
          .insert({
            id: user.id,
            user_id: user.id,
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            roll_number: profile.roll_number,
            course: profile.course,
            department: profile.department,
            avatar_url: profile.avatar_url,
            updated_at: new Date().toISOString(),
          });
        if (insertError) throw insertError;
      }

      await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          phone: profile.phone,
          roll_number: profile.roll_number,
          course: profile.course,
          department: profile.department,
          avatar_url: profile.avatar_url,
        }
      });

      setIsEditing(false);
      toast({
        title: "Profile saved!",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-10">
        <BackBar label="Back" to="/" desktopOnly />
        
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-6">
          {/* Avatar with upload option */}
          <div className="relative mb-4">
            <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-lg">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Camera button overlay */}
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground uppercase">
            {profile.full_name || "Student"}
          </h1>
          <p className="text-muted-foreground">{profile.email}</p>
          {profile.roll_number && (
            <span className="mt-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium">
              {profile.roll_number}
            </span>
          )}
        </div>

        {/* Profile Card */}
        <Card className="bg-card border-border mb-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Profile Details</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  value={profile.full_name}
                  onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="bg-background"
                />
              ) : (
                <p className="text-foreground font-medium uppercase">{profile.full_name || "Not set"}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <p className="text-foreground font-medium">{profile.email || "Not set"}</p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              {isEditing ? (
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                  className="bg-background"
                />
              ) : (
                <p className="text-foreground font-medium">{profile.phone || "Not set"}</p>
              )}
            </div>

            {/* Roll Number */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <IdCard className="h-4 w-4" />
                Roll Number
              </Label>
              {isEditing ? (
                <Input
                  value={profile.roll_number}
                  onChange={(e) => setProfile(p => ({ ...p, roll_number: e.target.value }))}
                  placeholder="Enter your roll number"
                  className="bg-background"
                />
              ) : (
                <p className="text-foreground font-medium">{profile.roll_number || "Not set"}</p>
              )}
            </div>

            {/* Course */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                Course
              </Label>
              {isEditing ? (
                <Input
                  value={profile.course}
                  onChange={(e) => setProfile(p => ({ ...p, course: e.target.value }))}
                  placeholder="Enter your course"
                  className="bg-background"
                />
              ) : (
                <p className="text-foreground font-medium">{profile.course || "Not set"}</p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Department
              </Label>
              {isEditing ? (
                <Input
                  value={profile.department}
                  onChange={(e) => setProfile(p => ({ ...p, department: e.target.value }))}
                  placeholder="Enter your department"
                  className="bg-background"
                />
              ) : (
                <p className="text-foreground font-medium">{profile.department || "Not set"}</p>
              )}
            </div>

            {/* Save Button */}
            {isEditing && (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-primary mt-4"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>

      {/* Image Crop/Adjust Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ZoomIn className="h-5 w-5 text-primary" />
              Adjust Photo
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Preview Canvas */}
            <div className="relative">
              <canvas
                ref={previewCanvasRef}
                width={250}
                height={250}
                className="rounded-full cursor-move touch-none"
                style={{ background: '#1a1a1a' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Drag to reposition
              </p>
            </div>

            {/* Zoom Slider */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ZoomIn className="h-4 w-4" />
                  Zoom
                </Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetCrop}
              className="gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={cancelCrop}
              className="flex-1 sm:flex-none gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={applyCropAndUpload}
              disabled={uploading}
              className="flex-1 sm:flex-none gap-2 bg-gradient-primary"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Apply & Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
