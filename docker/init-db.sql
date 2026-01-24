-- RAFIT Database Initialization
-- This script runs once when the PostgreSQL container is first created

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a function to set the current tenant context for RLS
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_uuid::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get the current tenant context
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a function to clear the tenant context
CREATE OR REPLACE FUNCTION clear_tenant_context()
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit log trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  audit_row JSONB;
  excluded_cols TEXT[] = ARRAY['updated_at'];
  col TEXT;
  old_val JSONB;
  new_val JSONB;
BEGIN
  -- Build audit data
  IF TG_OP = 'DELETE' THEN
    audit_row = to_jsonb(OLD);
  ELSIF TG_OP = 'INSERT' THEN
    audit_row = to_jsonb(NEW);
  ELSE
    -- UPDATE - only capture changed values
    old_val = '{}'::JSONB;
    new_val = '{}'::JSONB;
    FOR col IN SELECT column_name FROM information_schema.columns
               WHERE table_name = TG_TABLE_NAME AND table_schema = TG_TABLE_SCHEMA
    LOOP
      IF col = ANY(excluded_cols) THEN
        CONTINUE;
      END IF;
      IF to_jsonb(OLD) ->> col IS DISTINCT FROM to_jsonb(NEW) ->> col THEN
        old_val = old_val || jsonb_build_object(col, to_jsonb(OLD) -> col);
        new_val = new_val || jsonb_build_object(col, to_jsonb(NEW) -> col);
      END IF;
    END LOOP;
    audit_row = jsonb_build_object('old', old_val, 'new', new_val);
  END IF;

  INSERT INTO audit_logs (
    tenant_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    get_current_tenant_id(),
    TG_OP,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN (OLD).id
      ELSE (NEW).id
    END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'INSERT') THEN to_jsonb(NEW) ELSE NULL END,
    NOW()
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION set_tenant_context(UUID) TO rafit;
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO rafit;
GRANT EXECUTE ON FUNCTION clear_tenant_context() TO rafit;

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'RAFIT database initialized successfully';
END $$;
