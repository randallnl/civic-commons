ALTER TABLE d1_district_mapping
ADD COLUMN is_floterial_district INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS d1_floterial_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  floterial_label TEXT NOT NULL,
  floterial_county TEXT NOT NULL,
  floterial_county_code INTEGER NOT NULL,
  floterial_district INTEGER NOT NULL,
  component_sldl_code INTEGER NOT NULL,
  component_county TEXT NOT NULL,
  component_county_code INTEGER NOT NULL,
  component_district INTEGER NOT NULL,
  component_label TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(floterial_label, component_sldl_code)
);

CREATE INDEX IF NOT EXISTS idx_d1_floterial_components_component
ON d1_floterial_components(component_county_code, component_district);

CREATE INDEX IF NOT EXISTS idx_d1_floterial_components_floterial
ON d1_floterial_components(floterial_county_code, floterial_district);
