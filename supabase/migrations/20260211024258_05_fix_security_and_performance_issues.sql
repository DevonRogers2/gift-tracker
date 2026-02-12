/*
  # Fix Security and Performance Issues

  ## Issues Resolved

  1. **RLS Policy Performance**: Replace direct `auth.uid()` calls with `(select auth.uid())` to prevent re-evaluation for each row
     - Affects: profiles, recipients, gift_ideas tables (9 policies total)
     - Impact: Significant performance improvement at scale
  
  2. **Missing Foreign Key Index**: Add index on `notification_log.recipient_id` foreign key
     - Improves query performance and prevents table locks during deletes
  
  3. **RLS on Public Table**: Enable RLS on `notification_log` table
     - Current: Table is public with no RLS protection
     - Fix: Enable RLS and add restrictive policy
  
  4. **Unused Indexes**: Remove indexes that are not being used
     - `recipients_birthday_idx`: Removed (not used)
     - `gift_ideas_purchased_idx`: Removed (not used)
     - `notification_log_user_recipient_type_date_idx`: Removed (covered by new index)
  
  ## Changes Made
  
  - Drop and recreate all RLS policies with optimized `auth.uid()` calls
  - Add covering index for `notification_log.recipient_id` foreign key
  - Enable RLS on `notification_log` table
  - Add restrictive policy for `notification_log`
  - Drop unused indexes
*/

BEGIN;

-- Fix profiles table policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Fix recipients table policies
DROP POLICY IF EXISTS "Users can read own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can create recipients" ON recipients;
DROP POLICY IF EXISTS "Users can update own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can delete own recipients" ON recipients;

CREATE POLICY "Users can read own recipients"
  ON recipients FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create recipients"
  ON recipients FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own recipients"
  ON recipients FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own recipients"
  ON recipients FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Drop unused index
DROP INDEX IF EXISTS recipients_birthday_idx;

-- Fix gift_ideas table policies
DROP POLICY IF EXISTS "Users can read gift ideas for own recipients" ON gift_ideas;
DROP POLICY IF EXISTS "Users can create gift ideas for own recipients" ON gift_ideas;
DROP POLICY IF EXISTS "Users can update gift ideas for own recipients" ON gift_ideas;
DROP POLICY IF EXISTS "Users can delete gift ideas for own recipients" ON gift_ideas;

CREATE POLICY "Users can read gift ideas for own recipients"
  ON gift_ideas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipients
      WHERE recipients.id = gift_ideas.recipient_id
      AND recipients.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create gift ideas for own recipients"
  ON gift_ideas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipients
      WHERE recipients.id = recipient_id
      AND recipients.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update gift ideas for own recipients"
  ON gift_ideas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipients
      WHERE recipients.id = gift_ideas.recipient_id
      AND recipients.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipients
      WHERE recipients.id = recipient_id
      AND recipients.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete gift ideas for own recipients"
  ON gift_ideas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipients
      WHERE recipients.id = gift_ideas.recipient_id
      AND recipients.user_id = (select auth.uid())
    )
  );

-- Drop unused index
DROP INDEX IF EXISTS gift_ideas_purchased_idx;

-- Fix notification_log table: Enable RLS and add index for foreign key
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Add covering index for recipient_id foreign key
CREATE INDEX IF NOT EXISTS notification_log_recipient_id_idx 
  ON notification_log(recipient_id);

-- Drop old unused composite index
DROP INDEX IF EXISTS notification_log_user_recipient_type_date_idx;

-- Add restrictive RLS policy for notification_log
CREATE POLICY "Users can read own notification log"
  ON notification_log FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create notification log entries"
  ON notification_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

COMMIT;