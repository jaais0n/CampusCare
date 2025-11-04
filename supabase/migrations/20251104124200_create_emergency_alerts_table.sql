-- Create emergency_alerts table
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    location TEXT,
    additional_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for users based on user_id" 
ON public.emergency_alerts 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users"
ON public.emergency_alerts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_id ON public.emergency_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON public.emergency_alerts(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.emergency_alerts IS 'Stores emergency alerts from users';
COMMENT ON COLUMN public.emergency_alerts.status IS 'Status of the alert: active, resolved, cancelled';
COMMENT ON COLUMN public.emergency_alerts.location IS 'Location data or Google Maps URL';
COMMENT ON COLUMN public.emergency_alerts.additional_info IS 'Additional JSON data about the emergency';
