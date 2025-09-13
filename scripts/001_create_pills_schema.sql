-- Create pills table with comprehensive attributes
CREATE TABLE IF NOT EXISTS public.pills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic identification
  name TEXT,
  generic_name TEXT,
  brand_name TEXT,
  ndc_number TEXT,
  
  -- Physical attributes
  shape TEXT,
  color TEXT,
  size_mm DECIMAL,
  thickness_mm DECIMAL,
  
  -- Markings and imprints
  front_imprint TEXT,
  back_imprint TEXT,
  
  -- Classification
  drug_class TEXT,
  schedule TEXT,
  
  -- Additional attributes
  coating TEXT,
  scoring TEXT,
  manufacturer TEXT,
  
  -- Search optimization
  search_vector TSVECTOR
);

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS pills_search_idx ON public.pills USING GIN(search_vector);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS pills_shape_idx ON public.pills(shape);
CREATE INDEX IF NOT EXISTS pills_color_idx ON public.pills(color);
CREATE INDEX IF NOT EXISTS pills_front_imprint_idx ON public.pills(front_imprint);
CREATE INDEX IF NOT EXISTS pills_back_imprint_idx ON public.pills(back_imprint);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_pills_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.generic_name, '') || ' ' ||
    COALESCE(NEW.brand_name, '') || ' ' ||
    COALESCE(NEW.front_imprint, '') || ' ' ||
    COALESCE(NEW.back_imprint, '') || ' ' ||
    COALESCE(NEW.shape, '') || ' ' ||
    COALESCE(NEW.color, '') || ' ' ||
    COALESCE(NEW.drug_class, '') || ' ' ||
    COALESCE(NEW.manufacturer, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
DROP TRIGGER IF EXISTS pills_search_vector_trigger ON public.pills;
CREATE TRIGGER pills_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.pills
  FOR EACH ROW EXECUTE FUNCTION update_pills_search_vector();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pills_updated_at_trigger ON public.pills;
CREATE TRIGGER pills_updated_at_trigger
  BEFORE UPDATE ON public.pills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
