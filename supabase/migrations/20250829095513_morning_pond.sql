/*
  # Create canvases table for saving mind maps

  1. New Tables
    - `canvases`
      - `id` (uuid, primary key)
      - `title` (text)
      - `subject` (text, optional)
      - `data` (jsonb) - stores nodes and edges
      - `user_id` (uuid, references auth.users)
      - `tags` (text array, optional)
      - `pinned` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `canvases` table
    - Add policies for authenticated users to manage their own canvases
*/

CREATE TABLE IF NOT EXISTS canvases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text,
  data jsonb NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tags text[] DEFAULT '{}',
  pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE canvases ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own canvases
CREATE POLICY "Users can read own canvases"
  ON canvases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own canvases
CREATE POLICY "Users can insert own canvases"
  ON canvases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own canvases
CREATE POLICY "Users can update own canvases"
  ON canvases
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own canvases
CREATE POLICY "Users can delete own canvases"
  ON canvases
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_canvases_user_id ON canvases(user_id);
CREATE INDEX IF NOT EXISTS idx_canvases_updated_at ON canvases(updated_at DESC);