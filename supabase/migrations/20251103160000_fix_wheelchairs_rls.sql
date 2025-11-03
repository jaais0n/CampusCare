-- Allow authenticated users to view wheelchairs

CREATE POLICY "Allow authenticated users to view wheelchairs"
ON public.wheelchairs FOR SELECT
TO authenticated
USING (true);
