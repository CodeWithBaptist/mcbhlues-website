-- Properties table from before the September 2026 name/title split.
-- Deliberately independent of the current DDL so schema regressions are caught.
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'sale',
  status text NOT NULL DEFAULT 'available',
  price integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  beds integer NOT NULL DEFAULT 0,
  baths integer NOT NULL DEFAULT 0,
  sqft integer NOT NULL DEFAULT 0,
  year_built integer,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  latitude text NOT NULL DEFAULT '',
  longitude text NOT NULL DEFAULT '',
  google_maps_url text NOT NULL DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX properties_slug_unique ON properties (slug);
