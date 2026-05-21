CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, slug)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer',
  status TEXT NOT NULL DEFAULT 'active',
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  company TEXT DEFAULT 'Intern',
  department TEXT DEFAULT 'Allgemein',
  last_login_at TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT DEFAULT 'Allgemein',
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  company TEXT DEFAULT 'Intern',
  department TEXT DEFAULT 'Allgemein',
  assigned_to TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT DEFAULT 'Allgemein',
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  company TEXT DEFAULT 'Intern',
  department TEXT DEFAULT 'Allgemein',
  assigned_to TEXT DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  content TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Allgemein',
  author TEXT DEFAULT 'Unbekannt',
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_opened (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id BIGINT REFERENCES news_posts(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(news_id, user_email)
);

CREATE TABLE IF NOT EXISTS wiki_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  company TEXT DEFAULT 'Intern',
  category TEXT DEFAULT 'Allgemein',
  department TEXT DEFAULT 'Allgemein',
  author TEXT DEFAULT 'Unbekannt',
  tags TEXT[] NOT NULL DEFAULT '{}',
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wiki_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wiki_slug TEXT NOT NULL,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  company TEXT DEFAULT 'Intern',
  category TEXT DEFAULT 'Allgemein',
  department TEXT DEFAULT 'Allgemein',
  tags TEXT[] NOT NULL DEFAULT '{}',
  content TEXT DEFAULT '',
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  author TEXT DEFAULT 'Unbekannt',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'application/octet-stream',
  size INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  uploaded_by TEXT DEFAULT 'Unbekannt',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  entity_type TEXT DEFAULT '',
  entity_id TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  user_email TEXT DEFAULT '',
  user_label TEXT DEFAULT '',
  company_id UUID,
  department_id UUID,
  company TEXT DEFAULT 'Intern',
  department TEXT DEFAULT 'Allgemein',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  app_name TEXT NOT NULL DEFAULT 'Intranet',
  company_name TEXT NOT NULL DEFAULT 'Intern',
  app_version TEXT NOT NULL DEFAULT '0.1.0',
  theme TEXT NOT NULL DEFAULT 'modern',
  dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
  accent_color TEXT NOT NULL DEFAULT 'zinc',
  sidebar_position TEXT NOT NULL DEFAULT 'left',
  show_version BOOLEAN NOT NULL DEFAULT TRUE,
  compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
  show_demo_hints BOOLEAN NOT NULL DEFAULT TRUE,
  enable_ticket_templates BOOLEAN NOT NULL DEFAULT TRUE,
  enable_ticket_comments BOOLEAN NOT NULL DEFAULT TRUE,
  enable_activity_log BOOLEAN NOT NULL DEFAULT TRUE,
  default_user_role TEXT NOT NULL DEFAULT 'viewer',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);

INSERT INTO app_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO companies (
  name,
  slug,
  description,
  status
)
VALUES (
  'Intern',
  'intern',
  'Interne Standardfirma',
  'active'
)
ON CONFLICT (slug) DO NOTHING;