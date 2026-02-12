/*
  # Create gift_ideas table

  1. New Tables
    - `gift_ideas`
      - `id` (uuid, primary key)
      - `recipient_id` (uuid, foreign key to recipients)
      - `title` (text)
      - `estimated_cost` (numeric)
      - `purchased` (boolean, default false)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Indexes
    - Index on recipient_id for fast queries
    - Index on purchased for filtering

  3. Security
    - Enable RLS on `gift_ideas` table
    - Add policies ensuring users can only access gift ideas for their recipients
*/

CREATE TABLE IF NOT EXISTS gift_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  title text NOT NULL,
  estimated_cost numeric(10,2) DEFAULT 0,
  purchased boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gift_ideas_recipient_id_idx ON gift_ideas(recipient_id);
CREATE INDEX IF NOT EXISTS gift_ideas_purchased_idx ON gift_ideas(purchased);

ALTER TABLE gift_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read gift ideas for own recipients"
  ON gift_ideas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipients
      WHERE recipients.id = gift_ideas.recipient_id
      AND recipients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create gift ideas for own recipients"
  ON gift_ideas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipients
      WHERE recipients.id = recipient_id
      AND recipients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update gift ideas for own recipients"
  ON gift_ideas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipients
      WHERE recipients.id = gift_ideas.recipient_id
      AND recipients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipients
      WHERE recipients.id = recipient_id
      AND recipients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete gift ideas for own recipients"
  ON gift_ideas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipients
      WHERE recipients.id = gift_ideas.recipient_id
      AND recipients.user_id = auth.uid()
    )
  );
