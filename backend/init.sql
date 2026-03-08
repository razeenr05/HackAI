-- =============================================================
-- MapScribe / HackAI  —  PostgreSQL Initialisation Script
-- =============================================================
-- This file is mounted into the Postgres Docker container at
--   /docker-entrypoint-initdb.d/init.sql
-- It runs automatically the FIRST time the container starts
-- (i.e. when the data volume is empty).
--
-- NOTE: SQLAlchemy also calls Base.metadata.create_all() on
-- startup, so the tables will be created even if this file is
-- not used.  This file additionally:
--   • Creates the database and role (useful for fresh installs)
--   • Documents the full schema for reference
--   • Ensures indexes exist for common query patterns
-- =============================================================

-- Create the application role if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mapscribe') THEN
    CREATE ROLE mapscribe WITH LOGIN PASSWORD 'mapscribe_pass';
  END IF;
END $$;

-- Tables are created by SQLAlchemy (Base.metadata.create_all)
-- so we only add extra indexes / grants here.

-- Grant privileges once the tables are created by SQLAlchemy
-- (SQLAlchemy runs create_all before the first request)

-- Extra indexes for performance (safe to run even if they already exist)
CREATE INDEX IF NOT EXISTS idx_nodes_user_id        ON nodes (user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user   ON user_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user   ON user_activity (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_date   ON user_activity (activity_date);
CREATE INDEX IF NOT EXISTS idx_edges_source         ON edges (source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target         ON edges (target_id);