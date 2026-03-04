-- Create storage bucket for course thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view course thumbnails (public bucket)
CREATE POLICY "Anyone can view course thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- Allow admins to upload course thumbnails
CREATE POLICY "Admins can upload course thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-thumbnails' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update course thumbnails
CREATE POLICY "Admins can update course thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-thumbnails' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete course thumbnails
CREATE POLICY "Admins can delete course thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-thumbnails' 
  AND public.has_role(auth.uid(), 'admin')
);