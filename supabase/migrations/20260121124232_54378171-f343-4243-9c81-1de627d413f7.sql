-- Create storage bucket for instructor avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('instructor-avatars', 'instructor-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view instructor avatars (public bucket)
CREATE POLICY "Anyone can view instructor avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'instructor-avatars');

-- Allow admins to upload instructor avatars
CREATE POLICY "Admins can upload instructor avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'instructor-avatars' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update instructor avatars
CREATE POLICY "Admins can update instructor avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'instructor-avatars' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete instructor avatars
CREATE POLICY "Admins can delete instructor avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'instructor-avatars' 
  AND public.has_role(auth.uid(), 'admin')
);