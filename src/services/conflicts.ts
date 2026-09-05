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

export const DEMO_POTENTIAL_CONFLICTS: PotentialConflict[] = [];

/**
 * Evaluates patient record and documents for authentic cross-record inconsistencies
 */
export function detectPotentialConflicts(
  patient: PatientRecord | null,
  documents: ManagedDocument[]
): PotentialConflict[] {
  if (!patient || documents.length === 0) {
    return [];
  }

  const conflicts: PotentialConflict[] = [];

  // 1. Detect duplicate document files (same hash or same name uploaded multiple times)
  const seenHashes: Record<string, ManagedDocument> = {};
  const seenNames: Record<string, ManagedDocument> = {};

  for (const doc of documents) {
    if (doc.fileHash && seenHashes[doc.fileHash]) {
      const prior = seenHashes[doc.fileHash];
      conflicts.push({
        id: `conf-dup-${doc.id}`,
        category: 'DUPLICATE_DOCUMENT',
        title: 'Potential Duplicate Laboratory Document',
        sourceA: {
          label: 'Existing Document',
          value: `${prior.filename} (${prior.documentCategory})`,
          sourceName: 'Document Vault',
        },
        sourceB: {
          label: 'New Upload',
          value: `${doc.filename} (${doc.documentCategory})`,
          sourceName: 'Document Vault',
        },
        instruction: 'Please verify whether this document is a duplicate to prevent double-counting measurements.',
      });
    } else if (doc.fileHash) {
      seenHashes[doc.fileHash] = doc;
    }

    if (doc.filename && seenNames[doc.filename.toLowerCase()]) {
      const prior = seenNames[doc.filename.toLowerCase()];
      if (prior.id !== doc.id && (!doc.fileHash || doc.fileHash !== prior.fileHash)) {
        conflicts.push({
          id: `conf-name-${doc.id}`,
          category: 'DUPLICATE_DOCUMENT',
          title: 'Matching Filename Uploaded',
          sourceA: {
            label: 'Prior Ingestion',
            value: prior.filename,
            sourceName: 'Document Vault',
          },
          sourceB: {
            label: 'Recent Ingestion',
            value: doc.filename,
            sourceName: 'Document Vault',
          },
          instruction: 'Please confirm whether these represent consecutive versions of the same encounter.',
        });
      }
    } else if (doc.filename) {
      seenNames[doc.filename.toLowerCase()] = doc;
    }
  }

  return conflicts;
}
