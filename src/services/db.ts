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

// Initial default patient for instant demonstration
export const INITIAL_DEMO_PATIENT: PatientRecord = {
  id: 'pt-8942-intake',
  name: 'Eleanor Vance',
  age: 52,
  sex: 'Female',
  symptoms: [
    { id: 'sym-1', name: 'Mild Afternoon Fatigue', severity: 'Mild', duration: '3 weeks', source: 'USER_PROVIDED' },
    { id: 'sym-2', name: 'Occasional Joint Stiffness', severity: 'Mild', duration: '2 months', source: 'USER_PROVIDED' },
    { id: 'sym-3', name: 'Post-prandial Drowsiness', severity: 'Moderate', duration: '6 weeks', source: 'USER_PROVIDED' },
  ],
  conditions: [
    { id: 'con-1', name: 'Borderline Hyperlipidemia', status: 'Managed', diagnosedYear: '2023', source: 'USER_PROVIDED' },
    { id: 'con-2', name: 'Mild Essential Hypertension', status: 'Managed', diagnosedYear: '2021', source: 'USER_PROVIDED' },
  ],
  allergies: [
    { id: 'alg-1', allergen: 'Penicillin', reaction: 'Urticaria / Skin Rash', severity: 'Moderate', source: 'USER_PROVIDED' },
    { id: 'alg-2', allergen: 'Shellfish', reaction: 'Lip Swelling', severity: 'Severe', source: 'USER_PROVIDED' },
  ],
  medications: [
    { id: 'med-1', name: 'Atorvastatin', dosage: '10mg', frequency: 'Once daily (Evening)', purpose: 'Lipid management', source: 'USER_PROVIDED' },
    { id: 'med-2', name: 'CoQ10 Ubiquinol', dosage: '100mg', frequency: 'Once daily (Morning)', purpose: 'Cellular energy supplement', source: 'USER_PROVIDED' },
  ],
  medicalHistory: 'Family history of Type 2 Diabetes (maternal grandfather) and Coronary Artery Disease (father, age 64). Non-smoker, walks 30 minutes 4 times per week.',
  additionalNotes: 'Requested comprehensive annual lab review. Exploring Mediterranean dietary adjustments to support healthy metabolic and lipid trajectories.',
  source: 'USER_PROVIDED',
  createdAt: '2024-01-14T10:30:00Z',
  updatedAt: '2024-01-14T10:30:00Z',
};

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

    // Seed default demo patient if empty
    const checkRes = await pgInstance.query('SELECT COUNT(*) as count FROM patients');
    const count = parseInt((checkRes.rows[0] as any)?.count || '0', 10);
    if (count === 0) {
      await savePatientToPostgres(INITIAL_DEMO_PATIENT);
    }

    // Seed default documents if empty
    const checkDocRes = await pgInstance.query('SELECT COUNT(*) as count FROM documents');
    const docCount = parseInt((checkDocRes.rows[0] as any)?.count || '0', 10);
    if (docCount === 0) {
      for (const d of INITIAL_DEMO_DOCUMENTS) {
        await saveDocumentToPostgres(d);
      }
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

// Initial Demo Managed Documents
export const INITIAL_DEMO_DOCUMENTS: ManagedDocument[] = [
  {
    id: 'doc-item-1',
    patientId: 'pt-8942-intake',
    filename: 'CBC_Comprehensive_Metabolic_Panel.pdf',
    fileType: 'pdf',
    fileSize: 254820,
    documentCategory: 'Laboratory Report',
    uploadTimestamp: '2024-01-15T14:20:00Z',
    processingStatus: 'Processed',
    extractionStatus: 'Extracted',
    verificationStatus: 'Verified',
    fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    linkedLabReportId: 'doc-quest-2024-01',
    previewSnippet: 'Quest Diagnostics: Glucose (94 mg/dL), Total Cholesterol (228 mg/dL), Creatinine (0.98 mg/dL)',
  },
  {
    id: 'doc-item-2',
    patientId: 'pt-8942-intake',
    filename: 'Routine_6Month_Metabolic_Followup.pdf',
    fileType: 'pdf',
    fileSize: 196410,
    documentCategory: 'Laboratory Report',
    uploadTimestamp: '2024-06-20T11:05:00Z',
    processingStatus: 'Processed',
    extractionStatus: 'Extracted',
    verificationStatus: 'Verified',
    fileHash: '4a6b291c98fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c912',
    linkedLabReportId: 'doc-labcorp-2024-06',
    previewSnippet: 'Labcorp Central: Glucose (104 mg/dL), Cholesterol (204 mg/dL), AST (36 U/L - Assay Divergence)',
  },
  {
    id: 'doc-item-3',
    patientId: 'pt-8942-intake',
    filename: 'Hospital_Outpatient_Fax_Scan.pdf',
    fileType: 'pdf',
    fileSize: 421000,
    documentCategory: 'Laboratory Report',
    uploadTimestamp: '2025-02-10T09:12:00Z',
    processingStatus: 'Processed',
    extractionStatus: 'Extracted',
    verificationStatus: 'Needs Verification',
    fileHash: 'f7c3bc1d98fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852ff34',
    linkedLabReportId: 'doc-hospital-2025-02',
    previewSnippet: 'City Health Hospital: Glucose (112 mg/dL), Creatinine (1.05 mg/dL - Smudged OCR), hs-CRP (1.8 mg/L)',
  },
  {
    id: 'doc-item-4',
    patientId: 'pt-8942-intake',
    filename: 'Atorvastatin_Prescription_Order.jpg',
    fileType: 'jpg',
    fileSize: 124500,
    documentCategory: 'Prescription',
    uploadTimestamp: '2024-01-16T16:45:00Z',
    processingStatus: 'Processed',
    extractionStatus: 'Extracted',
    verificationStatus: 'Verified',
    fileHash: '98d7fa2b6318fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7834a8',
    previewSnippet: 'Rx: Atorvastatin Calcium 10mg Tablets, Sig: 1 tab PO qHS #90 refills 3, Dr. Miller',
  },
  {
    id: 'doc-item-5',
    patientId: 'pt-8942-intake',
    filename: 'Cardiology_Consultation_Summary.png',
    fileType: 'png',
    fileSize: 531200,
    documentCategory: 'Medical Record',
    uploadTimestamp: '2024-02-01T10:15:00Z',
    processingStatus: 'Processed',
    extractionStatus: 'Extracted',
    verificationStatus: 'Needs Verification',
    fileHash: '11a8c90321fc1c149afbf4c8996fb92427ae41e4649b934ca495991b78912ef',
    previewSnippet: 'Clinical Summary: Evaluation of cardiovascular risk profile, CAC score discussion, lifestyle intervention.',
  },
];

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
