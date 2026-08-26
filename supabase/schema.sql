-- ============================================================
-- Odd Kiosk — Supabase Schema
-- Run this in your Supabase project's SQL editor.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ------------------------------------------------------------
-- 1. EMPLOYEES
--    Company staff who can be visited. Populate this table
--    with your organization's directory.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    TEXT NOT NULL,
  title        TEXT,
  department   TEXT,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_active_name
  ON employees (active, full_name);


-- ------------------------------------------------------------
-- 2. VISITOR LOG
--    One row per visit. Kiosk inserts on sign-in;
--    time_out is filled on sign-out (or by the 5 PM cron).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visitor_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Visitor details (entered at kiosk)
  visitor_name        TEXT NOT NULL,
  visitor_title       TEXT,
  visitor_email       TEXT,
  visitor_company     TEXT NOT NULL,
  reason_for_visit    TEXT NOT NULL,

  -- Who they're visiting
  host_employee_id    UUID REFERENCES employees(id) ON DELETE SET NULL,
  host_employee_name  TEXT NOT NULL,

  -- Timing (date separate from time_in for easy date filtering)
  visit_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  time_in             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_out            TIMESTAMPTZ,

  -- Verification & audit
  id_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  auto_signed_out     BOOLEAN NOT NULL DEFAULT FALSE,

  -- Signature stored as a base64 PNG data URL
  signature           TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- For databases created before visitor_email existed
ALTER TABLE visitor_log ADD COLUMN IF NOT EXISTS visitor_email TEXT;

CREATE INDEX IF NOT EXISTS idx_visitor_log_visit_date
  ON visitor_log (visit_date);

CREATE INDEX IF NOT EXISTS idx_visitor_log_active
  ON visitor_log (visit_date, time_out)
  WHERE time_out IS NULL;


-- ------------------------------------------------------------
-- 3. ROW-LEVEL SECURITY
-- ------------------------------------------------------------

ALTER TABLE employees   ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_log ENABLE ROW LEVEL SECURITY;

-- Employees: anyone can read (kiosk search needs active ones; admin dashboard
-- needs inactive ones too to render the "Inactive" list)
DROP POLICY IF EXISTS "Public read active employees" ON employees;
CREATE POLICY "Public read employees"
  ON employees FOR SELECT
  USING (TRUE);

-- Employees: admin dashboard can add/edit/deactivate/delete
-- (trust boundary is the PIN-gated /admin route, same as visitor_log below)
CREATE POLICY "Public insert employees"
  ON employees FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Public update employees"
  ON employees FOR UPDATE
  USING (TRUE);

CREATE POLICY "Public delete employees"
  ON employees FOR DELETE
  USING (TRUE);

-- Visitor log: anyone can insert (kiosk sign-in)
CREATE POLICY "Public insert visitor log"
  ON visitor_log FOR INSERT
  WITH CHECK (TRUE);

-- Visitor log: anyone can read (kiosk sign-out search + admin view)
CREATE POLICY "Public read visitor log"
  ON visitor_log FOR SELECT
  USING (TRUE);

-- Visitor log: anyone can update (sign-out + ID verification from admin)
CREATE POLICY "Public update visitor log"
  ON visitor_log FOR UPDATE
  USING (TRUE);

-- NOTE: The scheduled Netlify function uses the service role key,
-- which bypasses RLS entirely, so no special policy is needed for it.


-- ------------------------------------------------------------
-- 4. SAMPLE DATA — delete or replace before going to production
-- ------------------------------------------------------------
INSERT INTO employees (full_name, title, department) VALUES
  ('Alice Johnson',   'Chief Executive Officer',   'Executive'),
  ('Bob Martinez',    'VP of Sales',               'Sales'),
  ('Carol Williams',  'Director of Engineering',   'Engineering'),
  ('David Kim',       'HR Manager',                'Human Resources'),
  ('Emma Davis',      'Office Manager',            'Operations'),
  ('Frank Thompson',  'Senior Accountant',         'Finance'),
  ('Grace Lee',       'Marketing Manager',         'Marketing'),
  ('Henry Wilson',    'IT Manager',                'Information Technology'),
  ('Isabella Moore',  'Legal Counsel',             'Legal'),
  ('James Taylor',    'Sales Representative',      'Sales')
ON CONFLICT DO NOTHING;
