CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE recurrence AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ONDAY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE priority AS ENUM ('VHIGH', 'HIGH', 'MEDIUM', 'LOW', 'VLOW');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE weekday AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE history_status AS ENUM ('DONE', 'MISSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  recurrence recurrence NOT NULL,
  days weekday[],
  day_of_month SMALLINT CHECK (day_of_month IS NULL OR day_of_month BETWEEN 1 AND 31),
  early_completable BOOLEAN NOT NULL DEFAULT false,
  /** ONDAY = todo à échéance (deadline) */
  deadline DATE,
  deadline_updated_at TIMESTAMPTZ,
  priority priority NOT NULL DEFAULT 'MEDIUM',
  color TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE todos ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS deadline_updated_at TIMESTAMPTZ;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS shared BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS share_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS todos_share_token_uidx ON todos(share_token) WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS todos_user_id_idx ON todos(user_id);
CREATE INDEX IF NOT EXISTS todos_user_active_idx ON todos(user_id) WHERE archived = false;

DO $$ BEGIN
  CREATE TYPE todo_member_role AS ENUM ('OWNER', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS todo_members (
  todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role todo_member_role NOT NULL DEFAULT 'MEMBER',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (todo_id, user_id)
);

CREATE INDEX IF NOT EXISTS todo_members_user_id_idx ON todo_members(user_id);

-- Backfill: chaque todo existante a son propriétaire comme OWNER
INSERT INTO todo_members (todo_id, user_id, role, joined_at)
SELECT id, user_id, 'OWNER', created_at FROM todos
ON CONFLICT (todo_id, user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS history_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status history_status NOT NULL,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (todo_id, date)
);

ALTER TABLE history_entries ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS history_user_date_idx ON history_entries(user_id, date);
CREATE INDEX IF NOT EXISTS history_todo_id_idx ON history_entries(todo_id);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS user_badge_flags (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  has_traveled BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_time TIME NOT NULL DEFAULT '18:00',
  days weekday[] NOT NULL DEFAULT ARRAY['MON','TUE','WED','THU','FRI','SAT','SUN']::weekday[],
  only_if_incomplete BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  last_sent_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS app_messages (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_messages_user_created_idx ON app_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS app_messages_user_unread_idx ON app_messages(user_id) WHERE read_at IS NULL;
