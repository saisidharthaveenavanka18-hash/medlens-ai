import { PGlite } from '@electric-sql/pglite';
import { 
  PatientRecord, 
  PatientSymptom, 
  PatientCondition, 
  PatientAllergy, 
  PatientMedication,
  ManagedDocument,
  ProcessingStatus,
  DocumentVerificationStatus 
} from '../types';

let pgInstance: PGlite | null = null;
let isDbInitialized = false;

// Query audit log for live PostgreSQL inspection
export interface QueryLogEntry {
  id: string;
  query: string;
  params: any[];
  durationMs: number;
  timestamp: string;
  rowCount: number;
}

export const recentQueryLogs: QueryLogEntry[] = [];

function logQuery(query: string, params: any[], durationMs: number, rowCount: number) {
  const entry: QueryLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    query: query.trim(),
    params,
    durationMs: Number(durationMs.toFixed(2)),
    timestamp: new Date().toISOString(),
    rowCount,
  };
  recentQueryLogs.unshift(entry);
  if (recentQueryLogs.length > 50) {
    recentQueryLogs.pop();
  }
}

// Initialize PostgreSQL engine & relational tables
export async function getPgDatabase(): Promise<PGlite> {
  if (pgInstance && isDbInitialized) {
    return pgInstance;
  }

  if (!pgInstance) {
    pgInstance = new PGlite();
  }

  if (!isDbInitialized) {
    const startTime = performance.now();
    
    // Execute PostgreSQL DDL
    await pgInstance.exec(`
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

      CREATE TABLE IF NOT EXISTS patient_symptoms (
          id VARCHAR(64) PRIMARY KEY,
          patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          severity VARCHAR(32) NOT NULL DEFAULT 'Moderate',
          duration VARCHAR(64),
          source VARCHAR(32) NOT NULL DEFAULT 'USER_PROVIDED',
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patient_conditions (
          id VARCHAR(64) PRIMARY KEY,
          patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'Active',
          diagnosed_year VARCHAR(32),
          source VARCHAR(32) NOT NULL DEFAULT 'USER_PROVIDED',
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patient_allergies (
          id VARCHAR(64) PRIMARY KEY,
          patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
          allergen VARCHAR(255) NOT NULL,
          reaction VARCHAR(255),
          severity VARCHAR(32) NOT NULL DEFAULT 'Moderate',
          source VARCHAR(32) NOT NULL DEFAULT 'USER_PROVIDED',
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

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

      CREATE TABLE IF NOT EXISTS documents (
          id VARCHAR(64) PRIMARY KEY,
          patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
          filename VARCHAR(255) NOT NULL,
          file_type VARCHAR(32) NOT NULL,
          file_size INT NOT NULL,
          document_category VARCHAR(64) NOT NULL,
          upload_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          processing_status VARCHAR(32) NOT NULL,
          extraction_status VARCHAR(32) NOT NULL,
          verification_status VARCHAR(32) NOT NULL,
          file_hash VARCHAR(64) NOT NULL,
          preview_snippet TEXT,
          linked_lab_report_id VARCHAR(64)
      );
    `);

    isDbInitialized = true;
    logQuery('CREATE SCHEMA [patients, symptoms, conditions, allergies, medications, documents]', [], performance.now() - startTime, 6);

    // Purge any legacy demo data from prior sessions
    try {
      await pgInstance.query("DELETE FROM patients WHERE id = 'pt-8942-intake' OR name = 'Eleanor Vance'");
      await pgInstance.query("DELETE FROM documents WHERE patient_id = 'pt-8942-intake'");
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('medlens_patient_pt-8942-intake');
        if (localStorage.getItem('medlens_active_patient_id') === 'pt-8942-intake') {
          localStorage.removeItem('medlens_active_patient_id');
        }
      }
    } catch {
      // Ignore cleanup error
    }
  }

  return pgInstance;
}

// Persist Patient Record into PostgreSQL with clean relational tables
export async function savePatientToPostgres(patient: PatientRecord): Promise<void> {
  const pg = await getPgDatabase();
  const startTime = performance.now();

  // Upsert Patient record
  await pg.query(`
    INSERT INTO patients (id, name, age, sex, medical_history, additional_notes, source, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      age = EXCLUDED.age,
      sex = EXCLUDED.sex,
      medical_history = EXCLUDED.medical_history,
      additional_notes = EXCLUDED.additional_notes,
      source = EXCLUDED.source,
      updated_at = EXCLUDED.updated_at;
  `, [
    patient.id,
    patient.name,
    patient.age,
    patient.sex,
    patient.medicalHistory,
    patient.additionalNotes,
    'USER_PROVIDED',
    patient.createdAt || new Date().toISOString(),
    new Date().toISOString(),
  ]);

  // Clean and insert relational symptoms
  await pg.query('DELETE FROM patient_symptoms WHERE patient_id = $1', [patient.id]);
  for (const s of patient.symptoms) {
    await pg.query(`
      INSERT INTO patient_symptoms (id, patient_id, name, severity, duration, source, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
    `, [s.id, patient.id, s.name, s.severity, s.duration || null, 'USER_PROVIDED']);
  }

  // Clean and insert relational conditions
  await pg.query('DELETE FROM patient_conditions WHERE patient_id = $1', [patient.id]);
  for (const c of patient.conditions) {
    await pg.query(`
      INSERT INTO patient_conditions (id, patient_id, name, status, diagnosed_year, source, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
    `, [c.id, patient.id, c.name, c.status, c.diagnosedYear || null, 'USER_PROVIDED']);
  }

  // Clean and insert relational allergies
  await pg.query('DELETE FROM patient_allergies WHERE patient_id = $1', [patient.id]);
  for (const a of patient.allergies) {
    await pg.query(`
      INSERT INTO patient_allergies (id, patient_id, allergen, reaction, severity, source, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
    `, [a.id, patient.id, a.allergen, a.reaction, a.severity, 'USER_PROVIDED']);
  }

  // Clean and insert relational medications
  await pg.query('DELETE FROM patient_medications WHERE patient_id = $1', [patient.id]);
  for (const m of patient.medications) {
    await pg.query(`
      INSERT INTO patient_medications (id, patient_id, name, dosage, frequency, purpose, source, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP);
    `, [m.id, patient.id, m.name, m.dosage, m.frequency, m.purpose || null, 'USER_PROVIDED']);
  }

  const duration = performance.now() - startTime;
  logQuery(`UPSERT PATIENT RELATIONAL GRAPH [id: ${patient.id}]`, [patient.name, patient.age, patient.sex], duration, 1);

  // Synchronous localStorage backup
  try {
    localStorage.setItem(`medlens_patient_${patient.id}`, JSON.stringify(patient));
    localStorage.setItem('medlens_active_patient_id', patient.id);
  } catch (err) {
    console.warn('LocalStorage save fallback error', err);
  }
}

// Fetch Patient from PostgreSQL by joining relational tables
export async function getPatientFromPostgres(patientId: string): Promise<PatientRecord | null> {
  const pg = await getPgDatabase();
  const startTime = performance.now();

  const patientRes = await pg.query('SELECT * FROM patients WHERE id = $1', [patientId]);
  if (patientRes.rows.length === 0) {
    return null;
  }

  const pRow: any = patientRes.rows[0];

  const symptomsRes = await pg.query('SELECT * FROM patient_symptoms WHERE patient_id = $1', [patientId]);
  const conditionsRes = await pg.query('SELECT * FROM patient_conditions WHERE patient_id = $1', [patientId]);
  const allergiesRes = await pg.query('SELECT * FROM patient_allergies WHERE patient_id = $1', [patientId]);
  const medicationsRes = await pg.query('SELECT * FROM patient_medications WHERE patient_id = $1', [patientId]);

  const duration = performance.now() - startTime;
  logQuery(`SELECT PATIENT & JOIN CHILD TABLES WHERE id = '${patientId}'`, [patientId], duration, 1);

  const patient: PatientRecord = {
    id: pRow.id,
    name: pRow.name,
    age: Number(pRow.age),
    sex: pRow.sex,
    medicalHistory: pRow.medical_history || '',
    additionalNotes: pRow.additional_notes || '',
    source: 'USER_PROVIDED',
    createdAt: pRow.created_at,
    updatedAt: pRow.updated_at,
    symptoms: symptomsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      severity: r.severity,
      duration: r.duration,
      source: 'USER_PROVIDED',
    })),
    conditions: conditionsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      diagnosedYear: r.diagnosed_year,
      source: 'USER_PROVIDED',
    })),
    allergies: allergiesRes.rows.map((r: any) => ({
      id: r.id,
      allergen: r.allergen,
      reaction: r.reaction,
      severity: r.severity,
      source: 'USER_PROVIDED',
    })),
    medications: medicationsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      dosage: r.dosage,
      frequency: r.frequency,
      purpose: r.purpose,
      source: 'USER_PROVIDED',
    })),
  };

  return patient;
}

// Fetch all patients from PostgreSQL
export async function getAllPatientsFromPostgres(): Promise<PatientRecord[]> {
  const pg = await getPgDatabase();
  const startTime = performance.now();

  const res = await pg.query('SELECT id FROM patients ORDER BY created_at DESC');
  const patients: PatientRecord[] = [];
  for (const row of res.rows as any[]) {
    const p = await getPatientFromPostgres(row.id);
    if (p) patients.push(p);
  }

  const duration = performance.now() - startTime;
  logQuery('SELECT ALL PATIENTS', [], duration, patients.length);
  return patients;
}

// Delete Patient and all linked records from PostgreSQL (cascading)
export async function deletePatientFromPostgres(patientId: string): Promise<void> {
  const pg = await getPgDatabase();
  const startTime = performance.now();

  await pg.query('DELETE FROM patients WHERE id = $1', [patientId]);
  const duration = performance.now() - startTime;
  logQuery(`DELETE PATIENT [id: ${patientId}]`, [patientId], duration, 1);

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`medlens_patient_${patientId}`);
      if (localStorage.getItem('medlens_active_patient_id') === patientId) {
        localStorage.removeItem('medlens_active_patient_id');
      }
    }
  } catch (err) {
    console.warn('LocalStorage cleanup error', err);
  }
}

// Save a Managed Document to PostgreSQL
export async function saveDocumentToPostgres(doc: ManagedDocument): Promise<void> {
  const pg = await getPgDatabase();
  const startTime = performance.now();

  await pg.query(`
    INSERT INTO documents (
      id, patient_id, filename, file_type, file_size, document_category,
      upload_timestamp, processing_status, extraction_status, verification_status,
      file_hash, preview_snippet, linked_lab_report_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (id) DO UPDATE SET
      filename = EXCLUDED.filename,
      document_category = EXCLUDED.document_category,
      processing_status = EXCLUDED.processing_status,
      extraction_status = EXCLUDED.extraction_status,
      verification_status = EXCLUDED.verification_status,
      preview_snippet = EXCLUDED.preview_snippet,
      linked_lab_report_id = EXCLUDED.linked_lab_report_id;
  `, [
    doc.id,
    doc.patientId,
    doc.filename,
    doc.fileType,
    doc.fileSize,
    doc.documentCategory,
    doc.uploadTimestamp || new Date().toISOString(),
    doc.processingStatus,
    doc.extractionStatus,
    doc.verificationStatus,
    doc.fileHash,
    doc.previewSnippet || null,
    doc.linkedLabReportId || null,
  ]);

  const duration = performance.now() - startTime;
  logQuery(`UPSERT DOCUMENT [${doc.filename}] (Category: ${doc.documentCategory})`, [doc.filename, doc.processingStatus], duration, 1);
}

// Fetch all documents for a patient from PostgreSQL
export async function getDocumentsByPatientFromPostgres(patientId: string): Promise<ManagedDocument[]> {
  const pg = await getPgDatabase();
  const startTime = performance.now();

  const res = await pg.query('SELECT * FROM documents WHERE patient_id = $1 ORDER BY upload_timestamp DESC', [patientId]);
  const duration = performance.now() - startTime;
  logQuery(`SELECT DOCUMENTS WHERE patient_id = '${patientId}'`, [patientId], duration, res.rows.length);

  return res.rows.map((r: any) => ({
    id: r.id,
    patientId: r.patient_id,
    filename: r.filename,
    fileType: r.file_type,
    fileSize: Number(r.file_size),
    documentCategory: r.document_category,
    uploadTimestamp: r.upload_timestamp,
    processingStatus: r.processing_status,
    extractionStatus: r.extraction_status,
    verificationStatus: r.verification_status,
    fileHash: r.file_hash,
    previewSnippet: r.preview_snippet || undefined,
    linkedLabReportId: r.linked_lab_report_id || undefined,
  }));
}

// Delete Document from PostgreSQL
export async function deleteDocumentFromPostgres(docId: string): Promise<void> {
  const pg = await getPgDatabase();
  const startTime = performance.now();

  await pg.query('DELETE FROM documents WHERE id = $1', [docId]);
  const duration = performance.now() - startTime;
  logQuery(`DELETE FROM documents WHERE id = '${docId}'`, [docId], duration, 1);
}

// Update Document Category or Verification Status
export async function updateDocumentStatusInPostgres(
  docId: string, 
  updates: { 
    category?: ManagedDocument['documentCategory'];
    processingStatus?: ProcessingStatus;
    verificationStatus?: DocumentVerificationStatus;
  }
): Promise<void> {
  const pg = await getPgDatabase();
  const startTime = performance.now();

  if (updates.category) {
    await pg.query('UPDATE documents SET document_category = $1 WHERE id = $2', [updates.category, docId]);
  }
  if (updates.processingStatus) {
    await pg.query('UPDATE documents SET processing_status = $1 WHERE id = $2', [updates.processingStatus, docId]);
  }
  if (updates.verificationStatus) {
    await pg.query('UPDATE documents SET verification_status = $1 WHERE id = $2', [updates.verificationStatus, docId]);
  }

  const duration = performance.now() - startTime;
  logQuery(`UPDATE documents SET ${JSON.stringify(updates)} WHERE id = '${docId}'`, [docId], duration, 1);
}
