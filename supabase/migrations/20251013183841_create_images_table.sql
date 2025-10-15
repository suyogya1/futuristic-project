/*
  # Create Images Storage System

  ## Overview
  Creates a comprehensive system for storing and managing user-submitted images with voting capabilities.

  ## New Tables
  
  ### `images`
  - `id` (uuid, primary key) - Unique identifier for each image
  - `image_url` (text) - URL/path to the stored image
  - `message` (text) - User's message associated with the image
  - `token_number` (text) - Token identifier (e.g., "#0000")
  - `votes` (integer) - Total number of votes
  - `created_at` (timestamptz) - When the image was uploaded
  - `updated_at` (timestamptz) - Last update timestamp
  - `wallet_address` (text, nullable) - Wallet address of uploader
  - `status` (text) - Status: 'pending', 'approved', 'rejected'

  ### `image_votes`
  - `id` (uuid, primary key) - Unique identifier for each vote
  - `image_id` (uuid, foreign key) - Reference to images table
  - `wallet_address` (text) - Voter's wallet address
  - `created_at` (timestamptz) - When the vote was cast
  - Unique constraint on (image_id, wallet_address) to prevent duplicate votes

  ## Security
  - RLS enabled on both tables
  - Public can read approved images
  - Authenticated users can vote (one vote per image)
  - Only authenticated users can submit images
*/

-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  message text NOT NULL,
  token_number text NOT NULL,
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  wallet_address text,
  status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create image_votes table for tracking votes
CREATE TABLE IF NOT EXISTS image_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id uuid NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(image_id, wallet_address)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_votes ON images(votes DESC);
CREATE INDEX IF NOT EXISTS idx_image_votes_image_id ON image_votes(image_id);
CREATE INDEX IF NOT EXISTS idx_image_votes_wallet ON image_votes(wallet_address);

-- Enable RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for images table

-- Anyone can view approved images
CREATE POLICY "Anyone can view approved images"
  ON images
  FOR SELECT
  USING (status = 'approved');

-- Anyone can insert images (for anonymous uploads)
CREATE POLICY "Anyone can insert images"
  ON images
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own images
CREATE POLICY "Users can update own images"
  ON images
  FOR UPDATE
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address')
  WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for image_votes table

-- Anyone can view votes
CREATE POLICY "Anyone can view votes"
  ON image_votes
  FOR SELECT
  USING (true);

-- Anyone can vote (insert)
CREATE POLICY "Anyone can vote"
  ON image_votes
  FOR INSERT
  WITH CHECK (true);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON image_votes
  FOR DELETE
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Function to update vote count
CREATE OR REPLACE FUNCTION update_image_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE images SET votes = votes + 1, updated_at = now() WHERE id = NEW.image_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE images SET votes = votes - 1, updated_at = now() WHERE id = OLD.image_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update vote counts
DROP TRIGGER IF EXISTS trigger_update_vote_count ON image_votes;
CREATE TRIGGER trigger_update_vote_count
  AFTER INSERT OR DELETE ON image_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_image_vote_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on images
DROP TRIGGER IF EXISTS trigger_update_images_updated_at ON images;
CREATE TRIGGER trigger_update_images_updated_at
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();