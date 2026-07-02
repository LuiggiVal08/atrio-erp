-- Enable reports module for all existing tenants
UPDATE tenants
SET enabled_modules = array_append(enabled_modules, 'reports')
WHERE NOT ('reports' = ANY(enabled_modules));
