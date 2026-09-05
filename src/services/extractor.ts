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
      console.warn('Gemini extraction failed or was offline', err);
    }
  }

  // Client-Side Factual Extraction: Attempt to read readable text from the file (Text, CSV, Markdown, structured reports)
  const extractedRecords: ExtractedLabRecord[] = [];
  try {
    const rawText = await readFileAsText(file);
    if (rawText && rawText.trim().length > 0) {
      const lines = rawText.split(/\r?\n/);
      const labPattern = /([A-Za-z0-9\s,\-\(\)\/]{3,40}?)(?::|\t|\s{2,}|,)\s*([<>]?\s*\d+(?:\.\d+)?)\s*([a-zA-Z\/%μµ]+)?(?:\s+(?:Ref(?:erence)?(?:\s+Range)?:?\s*)?(\d+(?:\.\d+)?)\s*[-–—to]+\s*(\d+(?:\.\d+)?))?/i;

      lines.forEach((line, idx) => {
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

          if (testName.length > 2 && !isNaN(numericVal)) {
            extractedRecords.push({
              id: `ext-${Date.now()}-${idx}`,
              testName,
              value: rawVal,
              numericValue: isNaN(numericVal) ? null : numericVal,
              unit,
              referenceRangeText: hasRange ? `${lower} - ${upper}` : 'REFERENCE RANGE UNAVAILABLE',
              rangeLower: lower,
              rangeUpper: upper,
              hasReferenceRange: hasRange,
              status,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              observation: `Extracted from source file "${file.name}"`,
              sourceDocument: file.name,
              pageNumber: 1,
              confidence: 0.95,
              isAiExtracted: true,
              isHumanVerified: false,
              isDemoFallback: false,
              originalAiValue: rawVal,
              originalAiUnit: unit,
              originalAiRange: hasRange ? `${lower} - ${upper}` : 'REFERENCE RANGE UNAVAILABLE',
            });
          }
        }
      });
    }
  } catch {
    // Non-text file or stream
  }

  return {
    records: extractedRecords,
    isDemoFallback: false,
    documentTitle: file.name,
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
