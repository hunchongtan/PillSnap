-- Create storage bucket for pill images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pill-images', 'pill-images', true)
ON CONFLICT (id) DO NOTHING;

-- Reset and set up storage policies for pill images
DO $$
BEGIN
	-- Drop older policy names if they exist
	IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access') THEN
		EXECUTE 'DROP POLICY "Public Access" ON storage.objects';
	END IF;
	IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload pill images') THEN
		EXECUTE 'DROP POLICY "Authenticated users can upload pill images" ON storage.objects';
	END IF;
	IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own pill images') THEN
		EXECUTE 'DROP POLICY "Users can update their own pill images" ON storage.objects';
	END IF;
	IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own pill images') THEN
		EXECUTE 'DROP POLICY "Users can delete their own pill images" ON storage.objects';
	END IF;

	-- Drop our new names if re-running
	IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read pill images') THEN
		EXECUTE 'DROP POLICY "Public read pill images" ON storage.objects';
	END IF;
	IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public upload to contributions') THEN
		EXECUTE 'DROP POLICY "Public upload to contributions" ON storage.objects';
	END IF;
	IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Auth update contributions') THEN
		EXECUTE 'DROP POLICY "Auth update contributions" ON storage.objects';
	END IF;
	IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Auth delete contributions') THEN
		EXECUTE 'DROP POLICY "Auth delete contributions" ON storage.objects';
	END IF;
END $$;

-- Public read access to images in this bucket
CREATE POLICY "Public read pill images" ON storage.objects
FOR SELECT USING (bucket_id = 'pill-images');

-- Allow anonymous and authenticated clients to upload into contributions/ prefix
-- This is safe for public contributions; filenames are timestamped to avoid collisions
CREATE POLICY "Public upload to contributions" ON storage.objects
FOR INSERT WITH CHECK (
	bucket_id = 'pill-images'
	AND (auth.role() = 'anon' OR auth.role() = 'authenticated')
	AND name LIKE 'contributions/%'
);

-- Allow authenticated clients to update/delete only within contributions/ prefix
CREATE POLICY "Auth update contributions" ON storage.objects
FOR UPDATE USING (
	bucket_id = 'pill-images' AND auth.role() = 'authenticated' AND name LIKE 'contributions/%'
);

CREATE POLICY "Auth delete contributions" ON storage.objects
FOR DELETE USING (
	bucket_id = 'pill-images' AND auth.role() = 'authenticated' AND name LIKE 'contributions/%'
);
