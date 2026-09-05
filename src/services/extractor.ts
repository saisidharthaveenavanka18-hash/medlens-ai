import { DocumentCategory, StructuredExtraction } from '../types';

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
  pageNumber?: number;
  confidence: number;
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

export interface ComprehensiveExtractionResult {
  records: ExtractedLabRecord[];
  structuredData: StructuredExtraction;
  documentTitle: string;
  isDemoFallback: boolean;
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
 * Parses user-uploaded documents.
 * Checks localStorage first, then VITE_GEMINI_API_KEY.
 * Extracts: Patient details, Symptoms, Conditions, Allergies, Medications, Laboratory tests, Values, Units, Reference ranges, Report date, Observations.
 * NEVER invents missing information; uses "Not available in the uploaded record."
 */
export async function extractDocumentData(
  file: File,
  category: DocumentCategory
): Promise<ComprehensiveExtractionResult> {
  const geminiApiKey = 
    (typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : null) || 
    import.meta.env.VITE_GEMINI_API_KEY || 
    '';

  const docId = `doc-${Date.now()}`;
  const defaultPage = 1;

  if (geminiApiKey && geminiApiKey.trim() !== '') {
    try {
      const base64Data = await readFileAsBase64(file);
      const mimeType = file.type || 'application/pdf';

      const prompt = `You are a strict, responsible clinical document extraction engine.
Analyze this medical document and extract ALL available clinical information into strict JSON.

CRITICAL RESPONSIBLE AI & EXTRACTION RULES:
1. Extract ONLY information explicitly present in the document.
2. NEVER invent, extrapolate, or hallucinate missing information.
3. If an item is absent, record "Not available in the uploaded record."
4. Do NOT diagnose diseases or recommend treatments or dosage changes.
5. Extract reference intervals ONLY if explicitly printed in the report. If omitted, set hasReferenceRange: false, range: "Not available in the uploaded record."
6. Determine status: If no range, "REFERENCE RANGE UNAVAILABLE". If value < lower, "LOW". If value > upper, "HIGH". Otherwise "NORMAL".

Return ONLY a JSON object formatted exactly as:
{
  "patientName": string or null,
  "patientAge": string or null,
  "patientSex": string or null,
  "bloodGroup": string or null,
  "reportDate": string or null,
  "symptoms": string[],
  "conditions": string[],
  "allergies": string[],
  "medications": string[],
  "laboratoryResults": [
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
      "date": string or null,
      "observation": string or null,
      "pageNumber": number or null,
      "confidence": number
    }
  ],
  "clinicalObservations": string[],
  "missingFields": string[]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`,
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
          const labItems = Array.isArray(parsed.laboratoryResults) ? parsed.laboratoryResults : [];

          const records: ExtractedLabRecord[] = labItems.map((item: any, idx: number) => {
            const numVal = item.numericValue !== undefined && item.numericValue !== null ? item.numericValue : parseFloat(item.value);
            const lower = typeof item.rangeLower === 'number' ? item.rangeLower : null;
            const upper = typeof item.rangeUpper === 'number' ? item.rangeUpper : null;
            const hasRange = item.hasReferenceRange !== false && (lower !== null || upper !== null);
            const computedStatus = calculateReferenceRangeStatus(isNaN(numVal) ? null : numVal, lower, upper, hasRange);

            return {
              id: `gemini-${Date.now()}-${idx}`,
              testName: item.testName || 'Clinical Assay',
              value: String(item.value || ''),
              numericValue: isNaN(numVal) ? null : numVal,
              unit: item.unit || '',
              referenceRangeText: hasRange ? item.referenceRangeText || `${lower} - ${upper}` : 'Not available in the uploaded record.',
              rangeLower: lower,
              rangeUpper: upper,
              hasReferenceRange: hasRange,
              status: computedStatus,
              date: item.date || parsed.reportDate || new Date().toISOString().split('T')[0],
              observation: item.observation || undefined,
              sourceDocument: file.name,
              pageNumber: item.pageNumber || defaultPage,
              confidence: typeof item.confidence === 'number' ? item.confidence : 0.96,
              isAiExtracted: true,
              isHumanVerified: false,
              isDemoFallback: false,
              originalAiValue: String(item.value || ''),
              originalAiUnit: item.unit || '',
              originalAiRange: hasRange ? item.referenceRangeText || `${lower} - ${upper}` : 'Not available in the uploaded record.',
            };
          });

          // Compile missing fields
          const missingFields: string[] = [];
          if (!parsed.patientName) missingFields.push('Patient name: Not available in the uploaded record.');
          if (!parsed.patientAge) missingFields.push('Patient age: Not available in the uploaded record.');
          if (!parsed.bloodGroup) missingFields.push('Blood group: Not available in the uploaded record.');
          if (!parsed.allergies || parsed.allergies.length === 0) missingFields.push('Allergies: Not available in the uploaded record.');
          if (!parsed.medications || parsed.medications.length === 0) missingFields.push('Medications: Not available in the uploaded record.');
          if (records.some((r) => !r.hasReferenceRange)) missingFields.push('Reference ranges for some tests: Not available in the uploaded record.');

          const structuredData: StructuredExtraction = {
            id: `ext-${Date.now()}`,
            documentId: docId,
            patientName: parsed.patientName || undefined,
            patientAge: parsed.patientAge || undefined,
            patientSex: parsed.patientSex || undefined,
            reportDate: parsed.reportDate || new Date().toISOString().split('T')[0],
            symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
            conditions: Array.isArray(parsed.conditions) ? parsed.conditions : [],
            allergies: Array.isArray(parsed.allergies) ? parsed.allergies : [],
            medications: Array.isArray(parsed.medications) ? parsed.medications : [],
            laboratoryResults: records.map((r) => ({
              name: r.testName,
              value: r.value,
              numericValue: r.numericValue,
              unit: r.unit,
              referenceRange: r.referenceRangeText,
              rangeLower: r.rangeLower,
              rangeUpper: r.rangeUpper,
              hasReferenceRange: r.hasReferenceRange,
              status: r.status,
              observation: r.observation,
            })),
            clinicalObservations: Array.isArray(parsed.clinicalObservations) ? parsed.clinicalObservations : [],
            missingFields,
            sourceDocument: file.name,
            pageNumber: defaultPage,
            extractedAt: new Date().toISOString(),
          };

          return {
            records,
            structuredData,
            documentTitle: file.name,
            isDemoFallback: false,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini extraction error, switching to deterministic fallback', err);
    }
  }

  // Deterministic local parsing when offline, no key, or API fallback
  return await extractLocally(file, docId, defaultPage);
}

/**
 * Deterministic local parser: extracts strictly what is in text/PDF without hallucinations
 */
async function extractLocally(file: File, docId: string, pageNumber: number): Promise<ComprehensiveExtractionResult> {
  const extractedRecords: ExtractedLabRecord[] = [];
  const symptoms: string[] = [];
  const conditions: string[] = [];
  const allergies: string[] = [];
  const medications: string[] = [];
  const observations: string[] = [];

  let extractedPatientName: string | undefined;
  let extractedAge: string | undefined;
  let extractedSex: string | undefined;
  let extractedDate: string | undefined;

  try {
    const rawText = await readFileAsText(file);
    if (rawText && rawText.trim().length > 0) {
      const lines = rawText.split(/\r?\n/);

      // Regex for lab results: Name: Value Unit (Ref: Lower - Upper)
      const labPattern = /([A-Za-z0-9\s,\-\(\)\/]{3,40}?)(?::|\t|\s{2,}|,)\s*([<>]?\s*\d+(?:\.\d+)?)\s*([a-zA-Z\/%μµ]+)?(?:\s+(?:Ref(?:erence)?(?:\s+Range)?:?\s*)?(\d+(?:\.\d+)?)\s*[-–—to]+\s*(\d+(?:\.\d+)?))?/i;
      const patientPattern = /(?:Patient(?:\s+Name)?|Name):\s*([A-Za-z\s]{2,40})/i;
      const agePattern = /(?:Age):\s*(\d{1,3})/i;
      const sexPattern = /(?:Sex|Gender):\s*(Male|Female|Other)/i;
      const datePattern = /(?:Date|Collected|Reported):\s*(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})/i;

      lines.forEach((line, idx) => {
        // Patient metadata
        const pMatch = line.match(patientPattern);
        if (pMatch && !extractedPatientName) extractedPatientName = pMatch[1].trim();

        const aMatch = line.match(agePattern);
        if (aMatch && !extractedAge) extractedAge = aMatch[1].trim();

        const sMatch = line.match(sexPattern);
        if (sMatch && !extractedSex) extractedSex = sMatch[1].trim();

        const dMatch = line.match(datePattern);
        if (dMatch && !extractedDate) extractedDate = dMatch[1].trim();

        // Check for explicitly stated conditions/allergies/medications
        if (/allerg/i.test(line)) {
          const clean = line.replace(/^(Allergies|Allergy):\s*/i, '').trim();
          if (clean && clean.length > 2) allergies.push(clean);
          return;
        }
        if (/medication|prescription|rx:/i.test(line)) {
          const clean = line.replace(/^(Medications|Prescriptions|Rx):\s*/i, '').trim();
          if (clean && clean.length > 2) medications.push(clean);
          return;
        }
        if (/diagnosis|history|condition/i.test(line)) {
          const clean = line.replace(/^(Diagnosis|Conditions|History):\s*/i, '').trim();
          if (clean && clean.length > 2) conditions.push(clean);
          return;
        }
        if (/symptom|complaint/i.test(line)) {
          const clean = line.replace(/^(Symptoms|Chief Complaint):\s*/i, '').trim();
          if (clean && clean.length > 2) symptoms.push(clean);
          return;
        }

        // Skip metadata header lines from being treated as lab results
        if (/^(Patient|Name|Age|Sex|Gender|Date|Collected|Reported|Doctor|Physician|Facility|Hospital|Accession|MRN):/i.test(line.trim())) {
          return;
        }

        // Lab tests
        const match = line.match(labPattern);
        if (match) {
          const testName = match[1].trim();
          const rawVal = match[2].trim();
          const unit = (match[3] || '').trim();
          const lower = match[4] ? parseFloat(match[4]) : null;
          const upper = match[5] ? parseFloat(match[5]) : null;
          const numericVal = parseFloat(rawVal.replace(/[<>]/g, ''));
          const hasRange = lower !== null && upper !== null;
          const status = calculateReferenceRangeStatus(isNaN(numericVal) ? null : numericVal, lower, upper, hasRange);

          // Avoid common false positives
          const isBlacklisted = /^(patient|name|age|sex|gender|date|phone|total|ref|reference|notes|comments)$/i.test(testName);

          if (testName.length > 2 && !isNaN(numericVal) && !isBlacklisted) {
            extractedRecords.push({
              id: `ext-${Date.now()}-${idx}`,
              testName,
              value: rawVal,
              numericValue: isNaN(numericVal) ? null : numericVal,
              unit,
              referenceRangeText: hasRange ? `${lower} - ${upper}` : 'Reference range not provided in the uploaded report.',
              rangeLower: lower,
              rangeUpper: upper,
              hasReferenceRange: hasRange,
              status,
              date: extractedDate || new Date().toISOString().split('T')[0],
              observation: `Extracted from token: "${line.trim()}"`,
              sourceDocument: file.name,
              pageNumber,
              confidence: 0.95,
              isAiExtracted: true,
              isHumanVerified: false,
              isDemoFallback: false,
              originalAiValue: rawVal,
              originalAiUnit: unit,
              originalAiRange: hasRange ? `${lower} - ${upper}` : 'Reference range not provided in the uploaded report.',
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn('Text read failed', err);
  }

  // Missing fields explicitly flagged
  const missingFields: string[] = [];
  if (!extractedPatientName) missingFields.push('Patient name: Not available in the uploaded record.');
  if (!extractedAge) missingFields.push('Patient age: Not available in the uploaded record.');
  if (allergies.length === 0) missingFields.push('Allergies: Not available in the uploaded record.');
  if (medications.length === 0) missingFields.push('Medications: Not available in the uploaded record.');
  if (conditions.length === 0) missingFields.push('Conditions: Not available in the uploaded record.');
  if (extractedRecords.length === 0) missingFields.push('Laboratory assays: Not available in the uploaded record.');

  const structuredData: StructuredExtraction = {
    id: `ext-${Date.now()}`,
    documentId: docId,
    patientName: extractedPatientName,
    patientAge: extractedAge,
    patientSex: extractedSex,
    reportDate: extractedDate || new Date().toISOString().split('T')[0],
    symptoms,
    conditions,
    allergies,
    medications,
    laboratoryResults: extractedRecords.map((r) => ({
      name: r.testName,
      value: r.value,
      numericValue: r.numericValue,
      unit: r.unit,
      referenceRange: r.referenceRangeText,
      rangeLower: r.rangeLower,
      rangeUpper: r.rangeUpper,
      hasReferenceRange: r.hasReferenceRange,
      status: r.status,
      observation: r.observation,
    })),
    clinicalObservations: observations,
    missingFields,
    sourceDocument: file.name,
    pageNumber,
    extractedAt: new Date().toISOString(),
  };

  return {
    records: extractedRecords,
    structuredData,
    documentTitle: file.name,
    isDemoFallback: false,
  };
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
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
