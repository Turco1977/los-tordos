-- Notification System SQL
-- Run this in the Supabase SQL editor

-- 1. Dedup column for deadline notifications (Level 3)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_deadline_notif DATE DEFAULT NULL;

-- 2. Notification preferences table (Level 4)
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  daily_summary BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  email_task_assign BOOLEAN DEFAULT true,
  email_deadline BOOLEAN DEFAULT true,
  email_comment BOOLEAN DEFAULT false,
  remind_days_before INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write their own preferences
CREATE POLICY notif_prefs_all ON notification_preferences FOR ALL USING (true);
