-- =============================================================================
-- Migration : 002_add_vehicle_type_to_services.sql
-- Database  : vehicle_service_db
-- Engine    : MySQL 8.0+ / InnoDB
-- Description: Add vehicle_type column to services table
-- =============================================================================

USE vehicle_service_db;

-- Add vehicle_type column
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Car' AFTER name;

-- Ensure existing services default to Car
UPDATE services
SET vehicle_type = 'Car'
WHERE vehicle_type IS NULL OR vehicle_type = '';
