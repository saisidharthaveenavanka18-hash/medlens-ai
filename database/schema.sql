-- ==============================================================================
-- MedLens PostgreSQL Database Schema
-- Module: Patient Information Intake & Multi-Source Data Provenance
-- ==============================================================================
-- This schema enforces clean relational decomposition:
-- 1. `patients`: Core demographics and narrative fields with strict age CHECK constraint
-- 2. `patient_symptoms`: 1-to-Many relational symptoms table with severity and duration
-- 3. `patient_conditions`: 1-to-Many existing chronic / diagnosed medical conditions
-- 4. `patient_allergies`: 1-to-Many allergen entries with specific adverse reaction
-- 5. `patient_medications`: 1-to-Many active prescriptions with dosage and frequency
--
-- CRITICAL DATA PROVENANCE:
-- Every table includes `source VARCHAR(32) NOT NULL DEFAULT 'USER_PROVIDED'`
-- to maintain a permanent, unalterable distinction between Patient-Provided,
-- AI-Extracted, AI-Generated, and Human-Verified medical records.
-- ==============================================================================

-- 1. Core Patient Table
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL CHECK (age >= 0 AND age <= 125),
    sex VARCHAR(32) NOT NULL,
    medical_history TEXT,
    additional_notes TEXT,
    source VARCHAR(32) NOT NULL DEFAULT 'USER_PROVIDED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for lookup by patient name and creation date
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);

-- 2. Symptoms Table (Relational decomposition)
CREATE TABLE IF NOT EXISTS patient_symptoms (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'Moderate',
    duration VARCHAR(64),
    source VARCHAR(32) NOT NULL DEFAULT 'USER_PROVIDED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_symptoms_patient_id ON patient_symptoms(patient_id);

-- 3. Existing Conditions Table
CREATE TABLE IF NOT EXISTS patient_conditions (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Active',
    diagnosed_year VARCHAR(32),
    source VARCHAR(32) NOT NULL DEFAULT 'USER_PROVIDED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_conditions_patient_id ON patient_conditions(patient_id);

-- 4. Allergies Table
CREATE TABLE IF NOT EXISTS patient_allergies (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen VARCHAR(255) NOT NULL,
    reaction VARCHAR(255),
    severity VARCHAR(32) NOT NULL DEFAULT 'Moderate',
    source VARCHAR(32) NOT NULL DEFAULT 'USER_PROVIDED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient_id ON patient_allergies(patient_id);

-- 5. Current Medications Table
CREATE TABLE IF NOT EXISTS patient_medications (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(64) NOT NULL,
    frequency VARCHAR(64) NOT NULL,
    purpose VARCHAR(255),
    source VARCHAR(32) NOT NULL DEFAULT 'USER_PROVIDED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_medications_patient_id ON patient_medications(patient_id);

-- ==============================================================================
-- 6. Medical Documents Table (Linked directly to patients)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(32) NOT NULL CHECK (file_type IN ('pdf', 'png', 'jpg', 'jpeg')),
    file_size INT NOT NULL,
    document_category VARCHAR(64) NOT NULL CHECK (document_category IN ('Laboratory Report', 'Prescription', 'Medical Record', 'Other', 'Unspecified')),
    upload_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processing_status VARCHAR(32) NOT NULL CHECK (processing_status IN ('Uploaded', 'Processing', 'Processed', 'Extraction Failed')),
    extraction_status VARCHAR(32) NOT NULL CHECK (extraction_status IN ('Pending', 'Extracted', 'Extraction Failed')),
    verification_status VARCHAR(32) NOT NULL CHECK (verification_status IN ('Needs Verification', 'Verified', 'Pending')),
    file_hash VARCHAR(64) NOT NULL,
    preview_snippet TEXT
);

CREATE INDEX IF NOT EXISTS idx_documents_patient_id ON documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_upload_timestamp ON documents(upload_timestamp);

