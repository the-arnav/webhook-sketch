/*
  # Canvas Management System

  1. New Tables
    - `canvases`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `subject` (text, optional)
      - `data` (jsonb) - stores complete canvas state with nodes and edges
      - `user_id` (uuid, references auth.users)
      - `tags` (text array, optional)
      - `pinned` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `canvases` table
    - Add policies for authenticated users to manage their own canvases
    - Users can only access their own canvas data

  3. Indexes
    - Performance indexes for user_id and updated_at
    - Search index for title and subject
*/

-- Create canvases table
CREATE TABLE IF NOT EXISTS canvases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text,
  data jsonb NOT NULL DEFAULT '{"nodes": [], "edges": []}',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tags text[] DEFAULT '{}',
  pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE canvases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own canvases"
  ON canvases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own canvases"
  ON canvases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own canvases"
  ON canvases
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own canvases"
  ON canvases
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_canvases_user_id ON canvases(user_id);
CREATE INDEX IF NOT EXISTS idx_canvases_updated_at ON canvases(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvases_pinned ON canvases(pinned) WHERE pinned = true;

-- Search index for title and subject
CREATE INDEX IF NOT EXISTS idx_canvases_search ON canvases USING gin(to_tsvector('english', title || ' ' || COALESCE(subject, '')));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_canvases_updated_at ON canvases;
CREATE TRIGGER update_canvases_updated_at
  BEFORE UPDATE ON canvases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();