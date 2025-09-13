-- Create user searches table to track identification attempts
CREATE TABLE IF NOT EXISTS public.user_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Image data
  original_image_url TEXT,
  processed_image_url TEXT,
  
  -- Extracted attributes from AI
  detected_shape TEXT,
  detected_color TEXT,
  detected_front_imprint TEXT,
  detected_back_imprint TEXT,
  detected_size_mm DECIMAL,
  
  -- User corrections/confirmations
  user_confirmed_shape TEXT,
  user_confirmed_color TEXT,
  user_confirmed_front_imprint TEXT,
  user_confirmed_back_imprint TEXT,
  
  -- Search results
  matched_pill_ids UUID[],
  confidence_score DECIMAL,
  
  -- Session tracking (optional - for anonymous users)
  session_id TEXT,
  user_agent TEXT
);

-- Create indexes for analytics and search optimization
CREATE INDEX IF NOT EXISTS user_searches_created_at_idx ON public.user_searches(created_at);
CREATE INDEX IF NOT EXISTS user_searches_session_idx ON public.user_searches(session_id);
CREATE INDEX IF NOT EXISTS user_searches_matched_pills_idx ON public.user_searches USING GIN(matched_pill_ids);
