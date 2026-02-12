/*
  # Create recipients table

  1. New Tables
    - `recipients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, 2-50 characters)
      - `birthday` (date)
      - `relationship` (text: Family, Friend, Colleague, Other)
      - `tags` (text, comma-separated)
      - `notes` (text, max 500 characters)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Indexes
    - Index on user_id for fast queries
    - Index on birthday for sorting/filtering

  3. Security
    - Enable RLS on `recipients` table
    - Add policies for users to read/create/update/delete their own recipients
*/

CREATE TABLE IF NOT EXISTS recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birthday date NOT NULL,
  relationship text NOT NULL CHECK (relationship IN ('Family', 'Friend', 'Colleague', 'Other')),
  tags text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recipients_user_id_idx ON recipients(user_id);
CREATE INDEX IF NOT EXISTS recipients_birthday_idx ON recipients(birthday);

ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recipients"
  ON recipients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create recipients"
  ON recipients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipients"
  ON recipients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipients"
  ON recipients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
