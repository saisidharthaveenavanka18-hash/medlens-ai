export type BiomarkerStatus = 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL' | 'UNSPECIFIED';

export type VerificationState = 'PENDING' | 'VERIFIED' | 'CORRECTED';

export type UserMode = 'patient' | 'clinician';

export type NavigationTab = 
  | 'dashboard'
  | 'workflow'
  | 'dual-pane' 
  | 'comparison'
  | 'timeline'
  | 'longitudinal' 
  | 'hitl-queue' 
  | 'doctor-prep' 
  | 'patient-intake' 
  | 'document-manager';

export type DocumentCategory = 
  | 'Laboratory Report' 
  | 'Prescription' 
  | 'Medical Record' 
  | 'Other' 
  | 'Unspecified';

export type ProcessingStatus = 
  | 'Uploaded' 
  | 'Processing' 
  | 'Processed' 
  | 'Extraction Failed';

export type ExtractionStatus = 
  | 'Pending' 
  | 'Extracted' 
  | 'Extraction Failed';

export type DocumentVerificationStatus = 
  | 'Needs Verification' 
  | 'Verified' 
  | 'Pending';

export interface ManagedDocument {
  id: string;
  patientId: string;
  filename: string;
  fileType: 'pdf' | 'png' | 'jpg' | 'jpeg';
  fileSize: number;
  documentCategory: DocumentCategory;
  uploadTimestamp: string;
  processingStatus: ProcessingStatus;
  extractionStatus: ExtractionStatus;
  verificationStatus: DocumentVerificationStatus;
  fileHash: string;
  fileDataUrl?: string;
  previewSnippet?: string;
  linkedLabReportId?: string;
}

export type SourceLabel = 
  | 'USER_PROVIDED'
  | 'AI_EXTRACTED'
  | 'AI_GENERATED'
  | 'HUMAN_VERIFIED';

export interface PatientSymptom {
  id: string;
  name: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  duration?: string;
  source: 'USER_PROVIDED';
}

export interface PatientCondition {
  id: string;
  name: string;
  status: 'Active' | 'Managed' | 'In Remission';
  diagnosedYear?: string;
  source: 'USER_PROVIDED';
}

export interface PatientAllergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Anaphylactic';
  source: 'USER_PROVIDED';
}

export interface PatientMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  purpose?: string;
  source: 'USER_PROVIDED';
}

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Intersex' | 'Other' | 'Prefer not to say';
  symptoms: PatientSymptom[];
  conditions: PatientCondition[];
  allergies: PatientAllergy[];
  medications: PatientMedication[];
  medicalHistory: string;
  additionalNotes: string;
  source: 'USER_PROVIDED';
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceRange {
  lower: number | null;
  upper: number | null;
  rawText: string;
  unit: string;
  isMissingInReport: boolean;
  conditionQualifier?: string; // e.g. "Fasting", "Adult Male"
  sourceCitation: string;     // e.g. "Printed directly on page 1, Col 4"
}

export interface Provenance {
  page: number;
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000 normalized grid
  snippet: string;
  confidence: number; // 0.0 to 1.0
}

export interface VerificationAudit {
  id: string;
  biomarkerId: string;
  verifiedBy: string;
  previousValue: string;
  correctedValue: string;
  timestamp: string;
  status: 'AUTO_PARSED' | 'VERIFIED_UNCHANGED' | 'CORRECTED_MANUALLY' | 'FLAGGED';
  notes?: string;
}

export interface BiomarkerRecord {
  id: string;
  canonicalName: string;      // e.g., "Creatinine"
  rawLabel: string;           // e.g., "CREATININE, SERUM"
  category: 'Metabolic' | 'Lipid' | 'Hematology' | 'Renal' | 'Hepatic' | 'Thyroid' | 'Electrolytes' | 'Other';
  numericValue: number | null;
  rawValue: string;
  unit: string;
  standardizedUnit: string;
  standardizedValue: number | null;
  status: BiomarkerStatus;
  confidence: number;         // 0.00 to 1.00
  verificationStatus: VerificationState;
  referenceRange: ReferenceRange;
  provenance: Provenance;
  auditHistory: VerificationAudit[];
  educationalNote: string;    // Plain-English description of physiological role
  clinicalQuestions: string[];// Safe questions to ask a doctor
}

export interface DocumentMeta {
  id: string;
  title: string;
  patientIdentifier: string;  // Anonymized e.g. "PT-8821-X"
  patientAgeGender: string;   // e.g. "52Y / Male"
  labName: string;
  reportDate: string;
  accessionNumber: string;
  fileHash: string;           // SHA-256
  pageCount: number;
  overallConfidence: number;
  biomarkers: BiomarkerRecord[];
  paperTheme?: 'clean' | 'scan' | 'fax';
}

export interface ConflictRecord {
  id: string;
  type: 'UNIT_MISMATCH' | 'RANGE_DIVERGENCE' | 'TEMPORAL_SPIKE';
  biomarkerName: string;
  docAId: string;
  docBId: string;
  docATitle: string;
  docBTitle: string;
  severity: 'INFO' | 'WARNING' | 'ALERT';
  description: string;
  details: string;
  resolutionHint: string;
}

export interface LongitudinalPoint {
  date: string;
  docId: string;
  labName: string;
  numericValue: number;
  unit: string;
  lower: number | null;
  upper: number | null;
  status: BiomarkerStatus;
}

export interface DemoPreset {
  id: string;
  name: string;
  badge: string;
  subtitle: string;
  description: string;
  targetFocus: string;
  documentIds: string[];
  defaultView: NavigationTab;
  highlightBiomarkerId?: string;
}
