import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  timezone: string;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Recipient = {
  id: string;
  user_id: string;
  name: string;
  birthday: string;
  relationship: 'Family' | 'Friend' | 'Colleague' | 'Other';
  tags: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type GiftIdea = {
  id: string;
  recipient_id: string;
  title: string;
  estimated_cost: number;
  purchased: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type NotificationLog = {
  id: string;
  user_id: string;
  recipient_id: string;
  notification_type: '14days' | '7days' | '1day';
  sent_date: string;
  created_at: string;
};
