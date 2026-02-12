/*
  # Add INSERT policy for profiles table

  1. Issue
    - Signup flow tries to insert a new profile row for new users
    - Missing INSERT policy causes "new row violates row-level security policy" error
  
  2. Fix
    - Add INSERT policy allowing users to create their own profile
*/

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));