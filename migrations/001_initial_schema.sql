-- =============================================================================
-- Migration : 001_initial_schema.sql
-- Database  : vehicle_service_db
-- Engine    : MySQL 8.0+ / InnoDB
-- Description: Initial schema for the Vehicle Service Center Management System
-- =============================================================================

-- Create and select the database
CREATE DATABASE IF NOT EXISTS vehicle_service_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE vehicle_service_db;

-- Ensure FK checks are on (InnoDB default, but stated explicitly)
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Table: vehicles
-- Stores registered vehicles and their owner contact details.
-- =============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id           CHAR(36)      NOT NULL,
    number_plate VARCHAR(20)   NOT NULL,
    vehicle_type VARCHAR(50)   NOT NULL,
    make         VARCHAR(50)   NOT NULL,
    model        VARCHAR(50)   NOT NULL,
    owner_name   VARCHAR(100)  NOT NULL,
    owner_phone  VARCHAR(20)   NOT NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_vehicles PRIMARY KEY (id),
    CONSTRAINT uq_vehicles_number_plate UNIQUE (number_plate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: The UNIQUE constraint on number_plate implicitly creates a B-tree index,
-- so a separate CREATE INDEX is not needed.

-- =============================================================================
-- Table: employees
-- Stores service-center staff who can be assigned to visit line items.
-- =============================================================================
CREATE TABLE IF NOT EXISTS employees (
    id        CHAR(36)     NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role      VARCHAR(50)  NOT NULL,
    phone     VARCHAR(20)  NOT NULL,
    active    BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_employees PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Table: services
-- Master catalogue of services offered by the centre.
-- extra_details is a JSON column for future extensible attributes.
-- =============================================================================
CREATE TABLE IF NOT EXISTS services (
    id            CHAR(36)       NOT NULL,
    name          VARCHAR(100)   NOT NULL,
    category      VARCHAR(50)    NOT NULL,
    description   TEXT,
    extra_details JSON           NULL,
    current_price DECIMAL(10,2)  NOT NULL,
    active        BOOLEAN        NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_services PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Table: service_price_history
-- Audit trail of price changes per service over time.
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_price_history (
    id             CHAR(36)      NOT NULL,
    service_id     CHAR(36)      NOT NULL,
    price          DECIMAL(10,2) NOT NULL,
    effective_from TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_service_price_history PRIMARY KEY (id),
    CONSTRAINT fk_sph_service
        FOREIGN KEY (service_id)
        REFERENCES services (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index: speed up price history lookups by service
CREATE INDEX idx_sph_service_id ON service_price_history (service_id);

-- =============================================================================
-- Table: service_visits
-- One record per workshop visit for a vehicle.
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_visits (
    id                CHAR(36)      NOT NULL,
    vehicle_id        CHAR(36)      NOT NULL,
    visit_date        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_cost        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method    VARCHAR(20)   NULL,
    payment_status    VARCHAR(20)   NULL,
    payment_reference VARCHAR(100)  NULL,
    photo_path        VARCHAR(255)  NULL,
    receipt_number    VARCHAR(50)   NULL,

    CONSTRAINT pk_service_visits PRIMARY KEY (id),
    CONSTRAINT fk_sv_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes: frequently queried columns
CREATE INDEX idx_sv_vehicle_id ON service_visits (vehicle_id);
CREATE INDEX idx_sv_visit_date  ON service_visits (visit_date);

-- =============================================================================
-- Table: service_visit_items
-- Individual service line items within a single visit.
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_visit_items (
    id            CHAR(36)      NOT NULL,
    visit_id      CHAR(36)      NOT NULL,
    service_id    CHAR(36)      NOT NULL,
    price_charged DECIMAL(10,2) NOT NULL,

    CONSTRAINT pk_service_visit_items PRIMARY KEY (id),
    CONSTRAINT fk_svi_visit
        FOREIGN KEY (visit_id)
        REFERENCES service_visits (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_svi_service
        FOREIGN KEY (service_id)
        REFERENCES services (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for join performance
CREATE INDEX idx_svi_visit_id   ON service_visit_items (visit_id);
CREATE INDEX idx_svi_service_id ON service_visit_items (service_id);

-- =============================================================================
-- Table: service_visit_employees
-- Maps employees to each service line item (many-to-many).
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_visit_employees (
    id            CHAR(36) NOT NULL,
    visit_item_id CHAR(36) NOT NULL,
    employee_id   CHAR(36) NOT NULL,

    CONSTRAINT pk_service_visit_employees PRIMARY KEY (id),
    CONSTRAINT fk_sve_visit_item
        FOREIGN KEY (visit_item_id)
        REFERENCES service_visit_items (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_sve_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for join performance
CREATE INDEX idx_sve_visit_item_id ON service_visit_employees (visit_item_id);
CREATE INDEX idx_sve_employee_id   ON service_visit_employees (employee_id);

-- =============================================================================
-- Table: admin_users
-- Application admin accounts (passwords stored as hashes, never plaintext).
-- =============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id            CHAR(36)     NOT NULL,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    CONSTRAINT pk_admin_users PRIMARY KEY (id),
    CONSTRAINT uq_admin_users_username UNIQUE (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- End of migration 001
-- =============================================================================
