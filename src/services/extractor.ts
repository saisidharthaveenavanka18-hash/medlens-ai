import { DocumentCategory } from '../types';

export interface ExtractedLabRecord {
  id: string;
  testName: string;
  value: string;
  numericValue: number | null;
  unit: string;
  referenceRangeText: string;
  rangeLower: number | null;
  rangeUpper: number | null;
  hasReferenceRange: boolean;
  status: 'NORMAL' | 'LOW' | 'HIGH' | 'REFERENCE RANGE UNAVAILABLE';
  date: string;
  observation?: string;
  sourceDocument: string;
  pageNumber?: number; // Only stored when explicitly available in source report
  confidence: number; // 0.0 to 1.0
  isAiExtracted: boolean;
  isHumanVerified: boolean;
  isDemoFallback: boolean;
  originalAiValue?: string;
  originalAiUnit?: string;
  originalAiRange?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  auditNotes?: string;
}

export interface FictionalDemoPatient {
  id: string;
  name: string;
  age: number;
  sex: string;
  reports: {
    id: string;
    title: string;
    date: string;
    lab: string;
    pageCount: number;
  }[];
  records: ExtractedLabRecord[];
}

/**
 * Deterministic reference range calculator.
 * Strictly adheres to rule:
 * - Determine LOW / NORMAL / HIGH ONLY when the reference range exists in the source report.
 * - If there is no reference range: REFERENCE RANGE UNAVAILABLE.
 * - NEVER invent a reference range.
 */
export function calculateReferenceRangeStatus(
  numericValue: number | null,
  lower: number | null,
  upper: number | null,
  hasRange: boolean
): 'NORMAL' | 'LOW' | 'HIGH' | 'REFERENCE RANGE UNAVAILABLE' {
  if (!hasRange || numericValue === null || isNaN(numericValue) || (lower === null && upper === null)) {
    return 'REFERENCE RANGE UNAVAILABLE';
  }

  if (lower !== null && numericValue < lower) {
    return 'LOW';
  }

  if (upper !== null && numericValue > upper) {
    return 'HIGH';
  }

  return 'NORMAL';
}

/**
 * Fictional Demo Patient with 2 medical reports and required medical test variations:
 * 1. Normal result (e.g. Hemoglobin 14.2 g/dL with 13.0–17.0)
 * 2. Low result (e.g. Vitamin D 22 ng/mL with 30–100)
 * 3. High result (e.g. Fasting Glucose 114 mg/dL with 70–99)
 * 4. Missing reference range (e.g. hs-CRP 2.3 mg/L with REFERENCE RANGE UNAVAILABLE)
 * 5. Low-confidence result (e.g. Creatinine 1.1 mg/dL, confidence 0.64 due to fax toner smudge)
 */
export const FICTIONAL_DEMO_PATIENT: FictionalDemoPatient = {
  id: 'pt-demo-fictional-8821',
  name: 'Eleanor Vance (Fictional Patient)',
  age: 52,
  sex: 'Female',
  reports: [
    {
      id: 'rep-quest-2025-02',
      title: 'Quest Diagnostics Comprehensive Metabolic & CBC Panel',
      date: 'Feb 14, 2025',
      lab: 'Quest Diagnostics Regional Lab (Clifton, NJ)',
      pageCount: 2,
    },
    {
      id: 'rep-labcorp-2024-01',
      title: 'Labcorp Outpatient Lipid & Micronutrient Assay',
      date: 'Jan 18, 2024',
      lab: 'Labcorp Burlington Center (Burlington, NC)',
      pageCount: 1,
    },
  ],
  records: [
    // 1. High result (Fasting Glucose)
    {
      id: 'rec-1',
      testName: 'Fasting Blood Glucose',
      value: '114',
      numericValue: 114,
      unit: 'mg/dL',
      referenceRangeText: '70 - 99',
      rangeLower: 70,
      rangeUpper: 99,
      hasReferenceRange: true,
      status: 'HIGH',
      date: 'Feb 14, 2025',
      observation: 'Consistent upward trajectory over consecutive tests; warrants follow-up clinical discussion',
      sourceDocument: 'Quest_Diagnostics_CMP_CBC_Feb2025.pdf',
      pageNumber: 1,
      confidence: 0.98,
      isAiExtracted: true,
      isHumanVerified: false,
      isDemoFallback: true,
      originalAiValue: '114',
      originalAiUnit: 'mg/dL',
      originalAiRange: '70 - 99',
    },
    // 2. Normal result (Hemoglobin)
    {
      id: 'rec-2',
      testName: 'Hemoglobin (CBC)',
      value: '14.2',
      numericValue: 14.2,
      unit: 'g/dL',
      referenceRangeText: '13.0 - 17.0',
      rangeLower: 13.0,
      rangeUpper: 17.0,
      hasReferenceRange: true,
      status: 'NORMAL',
      date: 'Feb 14, 2025',
      observation: 'Within biological homeostatic bounds for adult female baseline',
      sourceDocument: 'Quest_Diagnostics_CMP_CBC_Feb2025.pdf',
      pageNumber: 1,
      confidence: 0.99,
      isAiExtracted: true,
      isHumanVerified: false,
      isDemoFallback: true,
      originalAiValue: '14.2',
      originalAiUnit: 'g/dL',
      originalAiRange: '13.0 - 17.0',
    },
    // 3. Low result (Vitamin D, 25-Hydroxy)
    {
      id: 'rec-3',
      testName: 'Vitamin D, 25-Hydroxy',
      value: '22',
      numericValue: 22,
      unit: 'ng/mL',
      referenceRangeText: '30 - 100',
      rangeLower: 30,
      rangeUpper: 100,
      hasReferenceRange: true,
      status: 'LOW',
      date: 'Jan 18, 2024',
      observation: 'Sub-optimal serum level; common in winter months',
      sourceDocument: 'Labcorp_Lipid_Micronutrient_Jan2024.pdf',
      pageNumber: 1,
      confidence: 0.95,
      isAiExtracted: true,
      isHumanVerified: false,
      isDemoFallback: true,
      originalAiValue: '22',
      originalAiUnit: 'ng/mL',
      originalAiRange: '30 - 100',
    },
    // 4. Missing reference range (hs-CRP - High-Sensitivity C-Reactive Protein)
    {
      id: 'rec-4',
      testName: 'hs-CRP (High-Sensitivity C-Reactive Protein)',
      value: '2.3',
      numericValue: 2.3,
      unit: 'mg/L',
      referenceRangeText: 'REFERENCE RANGE UNAVAILABLE',
      rangeLower: null,
      rangeUpper: null,
      hasReferenceRange: false,
      status: 'REFERENCE RANGE UNAVAILABLE',
      date: 'Feb 14, 2025',
      observation: 'Testing facility omitted reference bounds on outpatient fax sheet; MedLens will not guess intervals',
      sourceDocument: 'Quest_Diagnostics_CMP_CBC_Feb2025.pdf',
      pageNumber: 2,
      confidence: 0.92,
      isAiExtracted: true,
      isHumanVerified: false,
      isDemoFallback: true,
      originalAiValue: '2.3',
      originalAiUnit: 'mg/L',
      originalAiRange: 'REFERENCE RANGE UNAVAILABLE',
    },
    // 5. Low-confidence result (Creatinine with fax toner smudge)
    {
      id: 'rec-5',
      testName: 'Serum Creatinine',
      value: '1.1',
      numericValue: 1.1,
      unit: 'mg/dL',
      referenceRangeText: '0.6 - 1.3',
      rangeLower: 0.6,
      rangeUpper: 1.3,
      hasReferenceRange: true,
      status: 'NORMAL',
      date: 'Feb 14, 2025',
      observation: 'Toner horizontal streak detected across decimal point; flagged for clinician confirmation',
      sourceDocument: 'Quest_Diagnostics_CMP_CBC_Feb2025.pdf',
      pageNumber: 2,
      confidence: 0.64,
      isAiExtracted: true,
      isHumanVerified: false,
      isDemoFallback: true,
      originalAiValue: '1.1',
      originalAiUnit: 'mg/dL',
      originalAiRange: '0.6 - 1.3',
    },
    // 6. Normal result across time (Total Cholesterol)
    {
      id: 'rec-6',
      testName: 'Total Cholesterol',
      value: '185',
      numericValue: 185,
      unit: 'mg/dL',
      referenceRangeText: '125 - 200',
      rangeLower: 125,
      rangeUpper: 200,
      hasReferenceRange: true,
      status: 'NORMAL',
      date: 'Jan 18, 2024',
      observation: 'Desirable cardiovascular risk profile lipid marker',
      sourceDocument: 'Labcorp_Lipid_Micronutrient_Jan2024.pdf',
      pageNumber: 1,
      confidence: 0.97,
      isAiExtracted: true,
      isHumanVerified: true,
      isDemoFallback: true,
      originalAiValue: '185',
      originalAiUnit: 'mg/dL',
      originalAiRange: '125 - 200',
      verifiedBy: 'Dr. Sarah Lin, MD (Clinician Reviewer)',
      verifiedAt: '2025-02-15T10:30:00Z',
      auditNotes: 'Confirmed against printed Labcorp summary.',
    },
  ],
};

/**
 * Parses user-uploaded documents.
 * Attempts Gemini extraction if configured via VITE_GEMINI_API_KEY.
 * Gracefully falls back to structured fictional demo extraction with DEMO DATA banner.
 */
export async function extractDocumentData(
  file: File,
  category: DocumentCategory
): Promise<{
  records: ExtractedLabRecord[];
  isDemoFallback: boolean;
  documentTitle: string;
}> {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (geminiApiKey && geminiApiKey.trim() !== '') {
    try {
      // If user supplied Gemini API key, we attempt structured JSON extraction
      const base64Data = await readFileAsBase64(file);
      const mimeType = file.type || 'application/pdf';

      const prompt = `You are a strict, responsible clinical document extraction engine.
Extract all laboratory test results from this medical document into JSON.
CRITICAL SAFETY RULES:
- Do NOT diagnose any diseases or conditions.
- Do NOT prescribe treatments or recommend dosage changes.
- Extract ONLY what is explicitly printed in the document.
- Test name, observed value, unit, reference range, date, and observation.
- If a reference range is NOT printed or omitted, set hasReferenceRange: false and referenceRange: "REFERENCE RANGE UNAVAILABLE". NEVER invent a reference range.
- Determine status: If no range, "REFERENCE RANGE UNAVAILABLE". If value < lower, "LOW". If value > upper, "HIGH". Otherwise "NORMAL".
- Confidence score between 0.0 and 1.0.

Return ONLY a JSON array with objects matching:
[
  {
    "testName": string,
    "value": string,
    "numericValue": number or null,
    "unit": string,
    "referenceRangeText": string,
    "rangeLower": number or null,
    "rangeUpper": number or null,
    "hasReferenceRange": boolean,
    "status": "NORMAL" | "LOW" | "HIGH" | "REFERENCE RANGE UNAVAILABLE",
    "date": string,
    "observation": string,
    "pageNumber": number or null,
    "confidence": number
  }
]`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const formattedRecords: ExtractedLabRecord[] = parsed.map((item: any, idx: number) => {
              const numVal = item.numericValue !== undefined ? item.numericValue : parseFloat(item.value);
              const lower = item.rangeLower !== undefined ? item.rangeLower : null;
              const upper = item.rangeUpper !== undefined ? item.rangeUpper : null;
              const hasRange = item.hasReferenceRange !== false && (lower !== null || upper !== null);
              const computedStatus = calculateReferenceRangeStatus(numVal, lower, upper, hasRange);

              return {
                id: `gemini-${Date.now()}-${idx}`,
                testName: item.testName || 'Unknown Assay',
                value: String(item.value || ''),
                numericValue: isNaN(numVal) ? null : numVal,
                unit: item.unit || '',
                referenceRangeText: hasRange ? item.referenceRangeText || `${lower} - ${upper}` : 'REFERENCE RANGE UNAVAILABLE',
                rangeLower: lower,
                rangeUpper: upper,
                hasReferenceRange: hasRange,
                status: computedStatus,
                date: item.date || new Date().toLocaleDateString(),
                observation: item.observation || undefined,
                sourceDocument: file.name,
                pageNumber: item.pageNumber || undefined,
                confidence: typeof item.confidence === 'number' ? item.confidence : 0.95,
                isAiExtracted: true,
                isHumanVerified: false,
                isDemoFallback: false,
                originalAiValue: String(item.value || ''),
                originalAiUnit: item.unit || '',
                originalAiRange: hasRange ? item.referenceRangeText || `${lower} - ${upper}` : 'REFERENCE RANGE UNAVAILABLE',
              };
            });

            return {
              records: formattedRecords,
              isDemoFallback: false,
              documentTitle: file.name,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Gemini extraction failed or was offline, falling back to reliable fictional demo data', err);
    }
  }

  // Reliable Fictional DEMO DATA fallback (works 100% offline, zero external APIs required)
  // Generates realistic structured extractions mapped to the uploaded document name
  const simulatedDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  await simulatedDelay(600);

  const fallbackRecords: ExtractedLabRecord[] = [
    {
      id: `ext-${Date.now()}-1`,
      testName: 'Fasting Blood Glucose',
      value: '114',
      numericValue: 114,
      unit: 'mg/dL',
      referenceRangeText: '70 - 99',
      rangeLower: 70,
      rangeUpper: 99,
      hasReferenceRange: true,
      status: 'HIGH',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      observation: 'Impaired fasting glucose threshold observed; recommend lifestyle discussion',
      sourceDocument: file.name,
      pageNumber: 1,
      confidence: 0.96,
      isAiExtracted: true,
      isHumanVerified: false,
      isDemoFallback: true,
      originalAiValue: '114',
      originalAiUnit: 'mg/dL',
      originalAiRange: '70 - 99',
    },
    {
      id: `ext-${Date.now()}-2`,
      testName: 'Hemoglobin (CBC)',
      value: '14.2',
      numericValue: 14.2,
      unit: 'g/dL',
      referenceRangeText: '13.0 - 17.0',
      rangeLower: 13.0,
      rangeUpper: 17.0,
      hasReferenceRange: true,
      status: 'NORMAL',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      observation: 'Red blood cell oxygen carrier capacity within expected limits',
      sourceDocument: file.name,
      pageNumber: 1,
      confidence: 0.98,
      isAiExtracted: true,
      isHumanVerified: false,
      isDemoFallback: true,
      originalAiValue: '14.2',
      originalAiUnit: 'g/dL',
      originalAiRange: '13.0 - 17.0',
    },
    {
      id: `ext-${Date.now()}-3`,
      testName: 'Vitamin D, 25-Hydroxy',
      value: '22',
      numericValue: 22,
      unit: 'ng/mL',
      referenceRangeText: '30 - 100',
      rangeLower: 30,
      rangeUpper: 100,
      hasReferenceRange: true,
      status: 'LOW',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      observation: 'Serum 25(OH)D below 30 ng/mL laboratory benchmark',
      sourceDocument: file.name,
      pageNumber: 1,
      confidence: 0.94,
      isAiExtracted: true,
      isHumanVerified: false,
      isDemoFallback: true,
      originalAiValue: '22',
      originalAiUnit: 'ng/mL',
      originalAiRange: '30 - 100',
    },
    {
      id: `ext-${Date.now()}-4`,
      testName: 'hs-CRP (Cardiovascular Risk Marker)',
      value: '2.3',
      numericValue: 2.3,
      unit: 'mg/L',
      referenceRangeText: 'REFERENCE RANGE UNAVAILABLE',
      rangeLower: null,
      rangeUpper: null,
      hasReferenceRange: false,
      status: 'REFERENCE RANGE UNAVAILABLE',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      observation: 'Testing lab omitted reference interval; MedLens refrains from guessing ranges',
      sourceDocument: file.name,
      pageNumber: 2,
      confidence: 0.91,
      isAiExtracted: true,
      isHumanVerified: false,
      isDemoFallback: true,
      originalAiValue: '2.3',
      originalAiUnit: 'mg/L',
      originalAiRange: 'REFERENCE RANGE UNAVAILABLE',
    },
    {
      id: `ext-${Date.now()}-5`,
      testName: 'Serum Creatinine',
      value: '1.1',
      numericValue: 1.1,
      unit: 'mg/dL',
      referenceRangeText: '0.6 - 1.3',
      rangeLower: 0.6,
      rangeUpper: 1.3,
      hasReferenceRange: true,
      status: 'NORMAL',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      observation: 'Low optical confidence flag: potential smudge on decimal token',
      sourceDocument: file.name,
      pageNumber: 2,
      confidence: 0.64,
      isAiExtracted: true,
      isHumanVerified: false,
      isDemoFallback: true,
      originalAiValue: '1.1',
      originalAiUnit: 'mg/dL',
      originalAiRange: '0.6 - 1.3',
    },
  ];

  return {
    records: fallbackRecords,
    isDemoFallback: true,
    documentTitle: file.name,
  };
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
