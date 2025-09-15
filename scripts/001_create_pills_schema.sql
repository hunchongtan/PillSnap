-- MVP pills schema
DROP TABLE IF EXISTS public.pills CASCADE;
CREATE TABLE public.pills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identification
  name TEXT,
  brand_name TEXT,
  manufacturer TEXT,

  -- Physical attributes
  imprint TEXT,
  shape TEXT,
  color TEXT,
  size_mm DECIMAL,
  scoring TEXT,

  -- Images
  image_url TEXT,
  back_image_url TEXT,

  -- Search optimization
  search_vector TSVECTOR
);

-- Indexes
CREATE INDEX IF NOT EXISTS pills_search_idx ON public.pills USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS pills_shape_idx ON public.pills(shape);
CREATE INDEX IF NOT EXISTS pills_color_idx ON public.pills(color);
CREATE INDEX IF NOT EXISTS pills_imprint_idx ON public.pills(imprint);

-- Search vector maintenance
CREATE OR REPLACE FUNCTION update_pills_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.brand_name, '') || ' ' ||
    COALESCE(NEW.manufacturer, '') || ' ' ||
    COALESCE(NEW.imprint, '') || ' ' ||
    COALESCE(NEW.shape, '') || ' ' ||
    COALESCE(NEW.color, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pills_search_vector_trigger ON public.pills;
CREATE TRIGGER pills_search_vector_trigger
BEFORE INSERT OR UPDATE ON public.pills
FOR EACH ROW EXECUTE FUNCTION update_pills_search_vector();

-- Timestamp maintenance
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
