/*
  # Add INSERT policies for Stripe tables

  1. Issue
    - The stripe-checkout edge function cannot insert records into stripe_customers and stripe_subscriptions
    - Missing INSERT policies cause RLS violations when users attempt to purchase
  
  2. Fix
    - Add INSERT policy for stripe_customers allowing service role to create customer records
    - Add UPDATE policy for stripe_subscriptions allowing service role to update subscription records
    - Add INSERT policy for stripe_subscriptions allowing service role to create subscription records
    - Add INSERT policy for stripe_orders allowing service role to create order records
*/

CREATE POLICY "Service role can insert customers"
  ON stripe_customers FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert subscriptions"
  ON stripe_subscriptions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update subscriptions"
  ON stripe_subscriptions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can insert orders"
  ON stripe_orders FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update orders"
  ON stripe_orders FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);