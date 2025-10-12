-- Migration: create characters table
-- Run this using your preferred migration tool or mysql CLI

CREATE TABLE IF NOT EXISTS characters (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  species_slug VARCHAR(255) DEFAULT NULL,
  data JSON DEFAULT (JSON_OBJECT()),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);
