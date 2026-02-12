/*
  # Fix Security and Performance Issues

  ## Summary
  This migration resolves multiple security and performance issues identified by the Supabase linter.

  ## Issues Fixed

  ### 1. Unindexed Foreign Key (Performance)
  **Problem**: Table `notification_log` has a foreign key `notification_log_user_id_fkey` without a covering index.
  **Impact**: Suboptimal query performance when filtering or joining on user_id.
  **Fix**: Add index on `notification_log(user_id)` to improve query performance and prevent table locks.

  ### 2. Auth RLS Initialization (Performance) - 3 Tables
  **Problem**: Stripe tables (`stripe_customers`, `stripe_subscriptions`, `stripe_orders`) have RLS policies that re-evaluate `auth.uid()` for each row.
  **Impact**: Suboptimal query performance at scale - function is called once per row instead of once per query.
  **Fix**: Replace `auth.uid()` with `(select auth.uid())` in all RLS policies to evaluate once per query.

  ### 3. Unused Index (Resource Optimization)
  **Problem**: Index `notification_log_recipient_id_idx` exists but is not being used by queries.
  **Impact**: Wastes storage space and slows down INSERT/UPDATE/DELETE operations.
  **Fix**: Drop the unused index to optimize resource usage.

  ### 4. Security Definer View (Security)
  **Problem**: View `stripe_user_subscriptions` is defined with SECURITY DEFINER instead of SECURITY INVOKER.
  **Impact**: View executes with the privileges of the view creator, not the current user.
  **Fix**: Recreate view with `security_invoker = true` to execute with current user privileges.

  ## Changes

  1. **Add Index**: `notification_log_user_id_idx` for foreign key performance
  2. **Drop Index**: `notification_log_recipient_id_idx` (unused)
  3. **Update RLS Policies**: Optimize auth.uid() calls in stripe_customers, stripe_subscriptions, stripe_orders
  4. **Recreate View**: stripe_user_subscriptions with security_invoker = true
*/

-- 1. Add index for notification_log.user_id foreign key
CREATE INDEX IF NOT EXISTS notification_log_user_id_idx 
  ON notification_log(user_id);

-- 2. Drop unused index on notification_log.recipient_id
DROP INDEX IF EXISTS notification_log_recipient_id_idx;

-- 3. Fix RLS policies for stripe_customers
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;

CREATE POLICY "Users can view their own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) AND deleted_at IS NULL);

-- 4. Fix RLS policies for stripe_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;

CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id
      FROM stripe_customers
      WHERE user_id = (select auth.uid()) AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- 5. Fix RLS policies for stripe_orders
DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;

CREATE POLICY "Users can view their own order data"
  ON stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id
      FROM stripe_customers
      WHERE user_id = (select auth.uid()) AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- 6. Fix stripe_user_subscriptions view to use security_invoker
DROP VIEW IF EXISTS stripe_user_subscriptions;

CREATE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
  ss.customer_id,
  ss.subscription_id,
  ss.price_id,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.payment_method_brand,
  ss.payment_method_last4,
  ss.status as subscription_status,
  sc.user_id
FROM stripe_subscriptions ss
LEFT JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
WHERE sc.deleted_at IS NULL AND ss.deleted_at IS NULL;

GRANT SELECT ON stripe_user_subscriptions TO authenticated;
