/*
  # Create notification_log table

  1. New Tables
    - `notification_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `recipient_id` (uuid, foreign key to recipients)
      - `notification_type` (text: '14days', '7days', '1day')
      - `sent_date` (date)
      - `created_at` (timestamp)

  2. Indexes
    - Composite index on user_id, recipient_id, notification_type, sent_date for efficient queries

  3. Purpose
    - Track sent notifications to prevent duplicate emails
    - Allow users to see when notifications were sent for each birthday
*/

CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('14days', '7days', '1day')),
  sent_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_log_user_recipient_type_date_idx 
  ON notification_log(user_id, recipient_id, notification_type, sent_date);
