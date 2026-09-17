-- =============================================================================
-- Rollback    : 001_rollback_schema.sql
-- Database    : vehicle_service_db
-- Description : Drops all objects created by 001_initial_schema.sql.
--               Run this ONLY when you want to tear down the schema completely.
--               Tables are dropped in reverse dependency order so FK constraints
--               are satisfied without disabling checks.
-- =============================================================================

USE vehicle_service_db;

-- Drop tables in reverse FK dependency order
DROP TABLE IF EXISTS service_visit_employees;
DROP TABLE IF EXISTS service_visit_items;
DROP TABLE IF EXISTS service_visits;
DROP TABLE IF EXISTS service_price_history;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS vehicles;

-- Optionally drop the database itself (uncomment if desired)
-- DROP DATABASE IF EXISTS vehicle_service_db;

-- =============================================================================
-- End of rollback 001
-- =============================================================================
