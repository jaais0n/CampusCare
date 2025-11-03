-- Create user roles enum (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('student', 'faculty', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'suspended');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_status') THEN
        CREATE TYPE public.alert_status AS ENUM ('active', 'resolved', 'false_alarm');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('pending', 'approved', 'rejected', 'delivered');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'counseling_mode') THEN
        CREATE TYPE public.counseling_mode AS ENUM ('in_person', 'online');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'counseling_category') THEN
        CREATE TYPE public.counseling_category AS ENUM ('stress', 'career', 'personal', 'academic', 'relationships', 'other');
    END IF;
END$$;

-- Profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  status user_status NOT NULL DEFAULT 'active',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  -- Student specific fields
  roll_number TEXT,
  course TEXT,
  department TEXT,
  year_of_study INTEGER,
  -- Faculty specific fields
  faculty_id TEXT,
  cabin_number TEXT,
  designation TEXT,
  -- Common fields
  date_of_birth DATE,
  address TEXT,
  emergency_contact TEXT,
  medical_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wheelchairs inventory
CREATE TABLE public.wheelchairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wheelchair_type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available', -- available, booked, maintenance, out_of_order
  condition TEXT DEFAULT 'good', -- excellent, good, fair, needs_repair
  purchase_date DATE,
  last_maintenance DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wheelchair bookings
CREATE TABLE public.wheelchair_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wheelchair_id UUID NOT NULL REFERENCES public.wheelchairs(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  pickup_location TEXT,
  return_location TEXT,
  special_requirements TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wheelchair maintenance logs
CREATE TABLE public.wheelchair_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wheelchair_id UUID NOT NULL REFERENCES public.wheelchairs(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL, -- routine, repair, replacement
  description TEXT NOT NULL,
  cost DECIMAL(10,2),
  performed_by TEXT NOT NULL,
  maintenance_date DATE NOT NULL,
  next_maintenance_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SOS alerts
CREATE TABLE public.sos_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status alert_status NOT NULL DEFAULT 'active',
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'high', -- low, medium, high, critical
  response_team TEXT,
  response_time TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Medicines inventory
CREATE TABLE public.medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  brand TEXT,
  category TEXT NOT NULL, -- pain_relief, vitamins, prescription, first_aid, etc.
  description TEXT,
  dosage TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  expiry_date DATE,
  requires_prescription BOOLEAN DEFAULT false,
  image_url TEXT,
  manufacturer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User shopping carts
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, medicine_id)
);

-- Medicine orders
CREATE TABLE public.medicine_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  total_amount DECIMAL(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  delivery_address TEXT NOT NULL,
  delivery_instructions TEXT,
  prescription_image_url TEXT,
  admin_notes TEXT,
  ordered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Order items
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.medicine_orders(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- Doctors
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT,
  experience_years INTEGER,
  consultation_fee DECIMAL(10,2),
  available_days TEXT[], -- ['monday', 'tuesday', etc.]
  available_start_time TIME,
  available_end_time TIME,
  room_number TEXT,
  phone TEXT,
  email TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Doctor appointments
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  issue_description TEXT NOT NULL,
  symptoms TEXT,
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  consultation_notes TEXT,
  prescription TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Counselors
CREATE TABLE public.counselors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT[],
  qualification TEXT,
  experience_years INTEGER,
  available_days TEXT[],
  available_modes counseling_mode[],
  available_start_time TIME,
  available_end_time TIME,
  room_number TEXT,
  phone TEXT,
  email TEXT,
  image_url TEXT,
  session_duration INTEGER DEFAULT 60, -- minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Counseling bookings
CREATE TABLE public.counseling_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- nullable for anonymous bookings
  counselor_id UUID NOT NULL REFERENCES public.counselors(id) ON DELETE CASCADE,
  category counseling_category NOT NULL,
  mode counseling_mode NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  anonymous_contact TEXT, -- for anonymous bookings
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  alternative_dates DATE[],
  alternative_times TIME[],
  issue_description TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  confirmed_date DATE,
  confirmed_time TIME,
  meeting_link TEXT, -- for online sessions
  session_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Counseling feedback
CREATE TABLE public.counseling_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.counseling_bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wellness programs (fitness, yoga, meditation classes)
CREATE TABLE public.wellness_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- yoga, gym, meditation, fitness
  description TEXT,
  instructor_name TEXT NOT NULL,
  instructor_qualification TEXT,
  duration_minutes INTEGER NOT NULL,
  max_capacity INTEGER NOT NULL,
  current_enrollment INTEGER DEFAULT 0,
  schedule_days TEXT[], -- ['monday', 'wednesday', 'friday']
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  equipment_required TEXT,
  difficulty_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  price DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Program bookings/enrollments
CREATE TABLE public.program_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.wellness_programs(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status booking_status NOT NULL DEFAULT 'confirmed',
  payment_status TEXT DEFAULT 'pending', -- pending, paid, refunded
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheelchairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheelchair_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheelchair_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Wheelchair policies
CREATE POLICY "Everyone can view available wheelchairs" ON public.wheelchairs FOR SELECT USING (true);
CREATE POLICY "Admins can manage wheelchairs" ON public.wheelchairs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Wheelchair booking policies
CREATE POLICY "Users can view their own bookings" ON public.wheelchair_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookings" ON public.wheelchair_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.wheelchair_bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wheelchair bookings" ON public.wheelchair_bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all wheelchair bookings" ON public.wheelchair_bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- SOS alerts policies
CREATE POLICY "Users can create SOS alerts" ON public.sos_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own alerts" ON public.sos_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all SOS alerts" ON public.sos_alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update SOS alerts" ON public.sos_alerts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Medicine policies
CREATE POLICY "Everyone can view medicines" ON public.medicines FOR SELECT USING (true);
CREATE POLICY "Admins can manage medicines" ON public.medicines FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Cart policies
CREATE POLICY "Users can manage their own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- Order policies
CREATE POLICY "Users can view their own orders" ON public.medicine_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.medicine_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.medicine_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update orders" ON public.medicine_orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.medicine_orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert order items for their orders" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.medicine_orders WHERE id = order_id AND user_id = auth.uid())
);

-- Doctor policies
CREATE POLICY "Everyone can view active doctors" ON public.doctors FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage doctors" ON public.doctors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Appointment policies
CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all appointments" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update appointments" ON public.appointments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Counselor policies  
CREATE POLICY "Everyone can view active counselors" ON public.counselors FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage counselors" ON public.counselors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Counseling booking policies
CREATE POLICY "Users can view their own counseling bookings" ON public.counseling_bookings FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can create counseling bookings" ON public.counseling_bookings FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their own counseling bookings" ON public.counseling_bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all counseling bookings" ON public.counseling_bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update counseling bookings" ON public.counseling_bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Counseling feedback policies
CREATE POLICY "Users can create feedback for their bookings" ON public.counseling_feedback FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.counseling_bookings WHERE id = booking_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all feedback" ON public.counseling_feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Wellness program policies
CREATE POLICY "Everyone can view active programs" ON public.wellness_programs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage programs" ON public.wellness_programs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Program booking policies
CREATE POLICY "Users can view their own program bookings" ON public.program_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own program bookings" ON public.program_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own program bookings" ON public.program_bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all program bookings" ON public.program_bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wheelchairs_updated_at BEFORE UPDATE ON public.wheelchairs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wheelchair_bookings_updated_at BEFORE UPDATE ON public.wheelchair_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON public.medicines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medicine_orders_updated_at BEFORE UPDATE ON public.medicine_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_counselors_updated_at BEFORE UPDATE ON public.counselors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_counseling_bookings_updated_at BEFORE UPDATE ON public.counseling_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wellness_programs_updated_at BEFORE UPDATE ON public.wellness_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();