/*
  # Create stripe_user_subscriptions view

  1. New View
    - `stripe_user_subscriptions`: Joins stripe_subscriptions with stripe_customers to show user subscription data
  
  2. Security
    - Enables authenticated users to query their subscription data through the view
*/

DROP VIEW IF EXISTS stripe_user_subscriptions;

CREATE VIEW stripe_user_subscriptions AS
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
LEFT JOIN stripe_customers sc ON ss.customer_id = sc.customer_id;