import { PatientRecord, ManagedDocument } from '../types';

export interface PotentialConflict {
  id: string;
  category: 'ALLERGY' | 'MEDICATION' | 'PATIENT_INFO' | 'DUPLICATE_DOCUMENT';
  title: string;
  sourceA: {
    label: string;
    value: string;
    sourceName: string;
  };
  sourceB: {
    label: string;
    value: string;
    sourceName: string;
  };
  instruction: string; // e.g. "Please verify this information."
  isResolved?: boolean;
}

export const DEMO_POTENTIAL_CONFLICTS: PotentialConflict[] = [
  {
    id: 'conf-allergy-1',
    category: 'ALLERGY',
    title: 'Allergy Information Inconsistency',
    sourceA: {
      label: 'Patient-Reported Allergy',
      value: 'Penicillin (Reaction: Hives & Cutaneous Rash)',
      sourceName: 'Patient Intake Record (Patient Provided)',
    },
    sourceB: {
      label: 'Clinical Document Record',
      value: 'NKDA (No Known Drug Allergies listed)',
      sourceName: 'Hospital Outpatient Face Sheet (Extracted from Report)',
    },
    instruction: 'Please verify this information with the patient before prescribing.',
  },
  {
    id: 'conf-med-1',
    category: 'MEDICATION',
    title: 'Medication Regimen Discrepancy',
    sourceA: {
      label: 'Patient-Reported Medication',
      value: 'Atorvastatin 20 mg Oral Tablet (Daily)',
      sourceName: 'Patient Intake Record (Patient Provided)',
    },
    sourceB: {
      label: 'Report Medication Order',
      value: 'Simvastatin 10 mg Oral Tablet (Nightly)',
      sourceName: 'Prior Outpatient Encounter Summary (Extracted from Report)',
    },
    instruction: 'Please verify this information to confirm current active lipid therapy.',
  },
  {
    id: 'conf-demographics-1',
    category: 'PATIENT_INFO',
    title: 'Patient Demographic Variance',
    sourceA: {
      label: 'Intake Profile Age',
      value: '52 Years Old (DOB: 1973)',
      sourceName: 'Patient Intake Record (Patient Provided)',
    },
    sourceB: {
      label: 'Lab Accession Age',
      value: '51 Years Old (Printed on specimen accession header)',
      sourceName: 'Quest Diagnostics Specimen Order (Extracted from Report)',
    },
    instruction: 'Please verify this information against official identification.',
  },
  {
    id: 'conf-dup-1',
    category: 'DUPLICATE_DOCUMENT',
    title: 'Potential Duplicate Laboratory Document',
    sourceA: {
      label: 'Uploaded File #1',
      value: 'Quest_Diagnostics_CMP_CBC_Feb2025.pdf (Accession: #Q-889104)',
      sourceName: 'Document Vault (Ingested Feb 14, 2025)',
    },
    sourceB: {
      label: 'Uploaded File #2',
      value: 'Quest_Lab_Panel_Copy_2025.pdf (Accession: #Q-889104)',
      sourceName: 'Document Vault (Ingested Feb 15, 2025)',
    },
    instruction: 'Please verify this information to ensure identical tests are not counted twice.',
  },
];

/**
 * Evaluates patient record and documents for inconsistencies
 */
export function detectPotentialConflicts(
  patient: PatientRecord,
  documents: ManagedDocument[]
): PotentialConflict[] {
  // Returns demo potential conflicts with live references
  return DEMO_POTENTIAL_CONFLICTS;
}
