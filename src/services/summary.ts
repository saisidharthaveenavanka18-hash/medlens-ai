import { ExtractedLabRecord } from './extractor';
import { ManagedDocument, PatientRecord } from '../types';

export interface SafeSummaryData {
  documentsCount: number;
  testsFoundCount: number;
  outsideRangeTests: {
    testName: string;
    value: string;
    unit: string;
    range: string;
    status: string;
  }[];
  observedChanges: {
    testName: string;
    previous: string;
    current: string;
    delta: string;
  }[];
  requiringVerificationCount: number;
  summaryText: string;
  disclaimer: string;
}

/**
 * Generates a concise, responsible, non-diagnostic patient summary strictly grounded in the structured record.
 */
export function generateSafeAiSummary(
  records: ExtractedLabRecord[],
  documents: ManagedDocument[],
  patient: PatientRecord | null
): SafeSummaryData {
  const disclaimer = 'This summary organizes information from the available records and is not a medical diagnosis or treatment recommendation.';

  if (!patient) {
    return {
      documentsCount: 0,
      testsFoundCount: 0,
      outsideRangeTests: [],
      observedChanges: [],
      requiringVerificationCount: 0,
      summaryText: 'No patient selected. Add or select a patient to generate clinical summaries.',
      disclaimer,
    };
  }

  const outside = records.filter(
    (r) => r.status === 'LOW' || r.status === 'HIGH'
  ).map((r) => ({
    testName: r.testName,
    value: r.value,
    unit: r.unit,
    range: r.referenceRangeText,
    status: r.status,
  }));

  const unverified = records.filter((r) => !r.isHumanVerified || r.confidence < 0.7);

  // Compute actual observed numerical changes across matching tests in multiple documents
  const testHistories: Record<string, ExtractedLabRecord[]> = {};
  for (const rec of records) {
    const key = rec.testName.toLowerCase().trim();
    if (!testHistories[key]) testHistories[key] = [];
    testHistories[key].push(rec);
  }

  const changes: {
    testName: string;
    previous: string;
    current: string;
    delta: string;
  }[] = [];

  for (const group of Object.values(testHistories)) {
    if (group.length >= 2) {
      const oldest = group[group.length - 1];
      const latest = group[0];
      if (oldest.numericValue !== null && latest.numericValue !== null) {
        const diff = Number((latest.numericValue - oldest.numericValue).toFixed(2));
        const deltaStr = diff > 0 ? `+${diff} ${latest.unit} observed increase` : `${diff} ${latest.unit} observed change`;
        changes.push({
          testName: latest.testName,
          previous: `${oldest.value} ${oldest.unit} (${oldest.date})`,
          current: `${latest.value} ${latest.unit} (${latest.date})`,
          delta: deltaStr,
        });
      }
    }
  }

  const summaryParagraphs: string[] = [];

  summaryParagraphs.push(
    `Currently, ${documents.length} medical document${documents.length === 1 ? '' : 's'} on record for ${patient.name}. A total of ${records.length} structured laboratory measurement${records.length === 1 ? '' : 's'} have been extracted.`
  );

  if (records.length > 0) {
    if (outside.length > 0) {
      summaryParagraphs.push(
        `Based strictly on the testing facilities' printed intervals, ${outside.length} test(s) have values outside their lab-provided reference ranges: ${outside.map((o) => `${o.testName} (${o.value} ${o.unit}, normal ref: ${o.range})`).join('; ')}.`
      );
    } else {
      summaryParagraphs.push('All extracted tests with printed ranges fall within their respective laboratory thresholds.');
    }

    if (changes.length > 0) {
      summaryParagraphs.push(
        `Observed numerical changes across sequential reports include: ${changes.map((c) => `${c.testName} shifted from ${c.previous} to ${c.current} (${c.delta})`).join('; ')}.`
      );
    }

    if (unverified.length > 0) {
      summaryParagraphs.push(
        `There are ${unverified.length} test item(s) pending human sign-off or exhibiting low optical confidence.`
      );
    } else {
      summaryParagraphs.push('All extracted records have completed human verification.');
    }
  } else {
    summaryParagraphs.push('No structured laboratory tests have been extracted yet. Upload a laboratory report to populate test results.');
  }

  return {
    documentsCount: documents.length,
    testsFoundCount: records.length,
    outsideRangeTests: outside,
    observedChanges: changes,
    requiringVerificationCount: unverified.length,
    summaryText: summaryParagraphs.join('\n\n'),
    disclaimer,
  };
}
