
-- Create canvases table to store user mind maps
CREATE TABLE IF NOT EXISTS public.canvases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.canvases ENABLE ROW LEVEL SECURITY;

-- Create policies for canvases
CREATE POLICY "Users can view their own canvases" ON public.canvases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own canvases" ON public.canvases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own canvases" ON public.canvases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own canvases" ON public.canvases
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_canvases_updated_at
  BEFORE UPDATE ON public.canvases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
