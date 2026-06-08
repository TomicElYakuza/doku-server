-- Entfernt alte "Allgemein"-Defaults und alte Bestandswerte aus PostgreSQL.
-- Robust: überspringt Tabellen/Spalten, die in deiner DB nicht existieren.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'department'
  ) THEN
    ALTER TABLE tickets ALTER COLUMN department DROP DEFAULT;
    UPDATE tickets SET department = '' WHERE department = 'Allgemein';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'category'
  ) THEN
    ALTER TABLE tickets ALTER COLUMN category DROP DEFAULT;
    UPDATE tickets SET category = '' WHERE category = 'Allgemein';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_templates' AND column_name = 'department'
  ) THEN
    ALTER TABLE ticket_templates ALTER COLUMN department DROP DEFAULT;
    UPDATE ticket_templates SET department = '' WHERE department = 'Allgemein';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wiki_pages' AND column_name = 'department'
  ) THEN
    ALTER TABLE wiki_pages ALTER COLUMN department DROP DEFAULT;
    UPDATE wiki_pages SET department = '' WHERE department = 'Allgemein';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wiki_pages' AND column_name = 'category'
  ) THEN
    ALTER TABLE wiki_pages ALTER COLUMN category DROP DEFAULT;
    UPDATE wiki_pages SET category = '' WHERE category = 'Allgemein';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news_posts' AND column_name = 'category'
  ) THEN
    ALTER TABLE news_posts ALTER COLUMN category DROP DEFAULT;
    UPDATE news_posts SET category = '' WHERE category = 'Allgemein';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'department'
  ) THEN
    ALTER TABLE activities ALTER COLUMN department DROP DEFAULT;
    UPDATE activities SET department = '' WHERE department = 'Allgemein';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'department'
  ) THEN
    ALTER TABLE admin_users ALTER COLUMN department DROP DEFAULT;
    UPDATE admin_users SET department = '' WHERE department = 'Allgemein';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'files' AND column_name = 'department'
  ) THEN
    ALTER TABLE files ALTER COLUMN department DROP DEFAULT;
    UPDATE files SET department = '' WHERE department = 'Allgemein';
  END IF;
END $$;