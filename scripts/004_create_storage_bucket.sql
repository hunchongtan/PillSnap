-- Create storage bucket for pill images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pill-images', 'pill-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for pill images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'pill-images');

CREATE POLICY "Authenticated users can upload pill images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'pill-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own pill images" ON storage.objects 
FOR UPDATE USING (bucket_id = 'pill-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own pill images" ON storage.objects 
FOR DELETE USING (bucket_id = 'pill-images' AND auth.role() = 'authenticated');
