/**
 * Idempotent schema bootstrap.
 *
 * The RBAC system is fully database driven, so the portal needs its tables to
 * exist before it can answer a single permission question. Running plain
 * `CREATE TABLE IF NOT EXISTS` DDL keeps that deterministic across both the
 * embedded PGlite database used for local/preview runs and a real PostgreSQL
 * server (`DATABASE_URL`).
 */
export const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  module text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS permissions_key_unique ON permissions (key);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  level integer NOT NULL DEFAULT 10,
  is_system boolean NOT NULL DEFAULT false,
  is_assignable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS roles_key_unique ON roles (key);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  password_hash text,
  status text NOT NULL DEFAULT 'invited',
  avatar_url text,
  last_login_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  effect text NOT NULL DEFAULT 'allow',
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, permission_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  user_agent text NOT NULL DEFAULT '',
  ip_address text NOT NULL DEFAULT '',
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_unique ON sessions (token_hash);

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email text NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS invitations_token_hash_unique ON invitations (token_hash);

CREATE TABLE IF NOT EXISTS nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  label text NOT NULL,
  href text NOT NULL,
  icon text NOT NULL DEFAULT 'Circle',
  "group" text NOT NULL DEFAULT 'General',
  permission_key text,
  hide_if_permission_key text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS nav_items_key_unique ON nav_items (key);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text NOT NULL DEFAULT 'system',
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  metadata jsonb,
  ip_address text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text NOT NULL DEFAULT 'system',
  action text NOT NULL,
  description text NOT NULL DEFAULT '',
  path text NOT NULL DEFAULT '',
  metadata jsonb,
  ip_address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs (created_at);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb,
  scope text NOT NULL DEFAULT 'company',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;
