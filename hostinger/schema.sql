-- Proposed MySQL schema for an isolated Hostinger deployment.
-- Run only on a new, empty staging database after reviewing the migration.
-- This schema alone does not make the application compatible with MySQL.
CREATE TABLE IF NOT EXISTS requests (
 reference VARCHAR(32) PRIMARY KEY,
 kind VARCHAR(32) NOT NULL,
 status VARCHAR(32) NOT NULL DEFAULT 'new',
 idempotency_key VARCHAR(128) NOT NULL UNIQUE,
 fingerprint VARCHAR(128) NOT NULL,
 encrypted_payload LONGTEXT NOT NULL,
 resource_id VARCHAR(128), service VARCHAR(128), icp VARCHAR(128),
 created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL,
 INDEX request_expiry (expires_at), INDEX request_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS rate_limits (
 `key` VARCHAR(128) PRIMARY KEY, `count` INT NOT NULL DEFAULT 1,
 expires_at BIGINT NOT NULL, INDEX rate_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS deliveries (
 id VARCHAR(64) PRIMARY KEY, reference VARCHAR(32) NOT NULL,
 status VARCHAR(32) NOT NULL DEFAULT 'pending', attempts INT NOT NULL DEFAULT 0,
 created_at BIGINT NOT NULL, next_at BIGINT NOT NULL,
 INDEX delivery_pending (status,next_at), INDEX delivery_reference (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS cms_overrides (
 path VARCHAR(512) PRIMARY KEY, draft LONGTEXT, live LONGTEXT,
 visibility VARCHAR(16) NOT NULL DEFAULT 'live', revision INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
-- Setup is explicit. The app does not create these tables automatically.
