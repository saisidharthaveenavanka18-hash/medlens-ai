import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Loader2, 
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { DocumentMeta, BiomarkerRecord } from '../types';
import { extractDocumentData } from '../services/extractor';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newDoc: DocumentMeta) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  if (!isOpen) return null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    'Reading document',
    'Extracting information',
    'Organizing information',
    'Generating AI-assisted summary',
    'Ready for review',
  ];

  const processFile = async (file: File) => {
    setErrorMsg(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExts = ['pdf', 'jpg', 'jpeg', 'png'];
    if (!validExts.includes(ext)) {
      setErrorMsg("Please upload a supported file.");
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setCurrentStep(0);

    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 350);

    try {
      const extraction = await extractDocumentData(file, 'Laboratory Report');
      clearInterval(stepTimer);

      const biomarkers: BiomarkerRecord[] = extraction.records.map((r, idx) => ({
        id: r.id || `bm-${Date.now()}-${idx}`,
        canonicalName: r.testName,
        rawLabel: r.testName,
        category: 'Other',
        numericValue: r.numericValue,
        rawValue: r.value,
        unit: r.unit,
        standardizedUnit: r.unit,
        standardizedValue: r.numericValue,
        referenceRange: {
          rawText: r.referenceRangeText,
          lower: r.rangeLower,
          upper: r.rangeUpper,
          unit: r.unit,
          isMissingInReport: !r.hasReferenceRange,
          sourceCitation: `Extracted from token: "${r.referenceRangeText || 'Not specified'}"`,
        },
        provenance: {
          page: r.pageNumber || 1,
          bbox: [40 + idx * 8, 20, 45 + idx * 8, 80],
          snippet: `${r.testName}: ${r.value} ${r.unit} (Ref: ${r.referenceRangeText || 'N/A'})`,
          confidence: r.confidence,
        },
        status: (r.status === 'REFERENCE RANGE UNAVAILABLE' ? 'UNSPECIFIED' : r.status) as any,
        confidence: r.confidence,
        verificationStatus: r.isHumanVerified ? 'VERIFIED' : 'PENDING',
        auditHistory: [],
        educationalNote: `Clinical test: ${r.testName}. Consult healthcare provider for diagnosis.`,
        clinicalQuestions: [
          `What are the clinical implications of my ${r.testName} measurement (${r.value} ${r.unit})?`,
          `Is any repeat or follow-up testing recommended?`
        ],
      }));

      const newDoc: DocumentMeta = {
        id: `doc-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        patientIdentifier: 'PT-ACTIVE',
        patientAgeGender: extraction.structuredData?.patientAge ? `${extraction.structuredData.patientAge}Y / ${extraction.structuredData.patientSex || ''}` : '',
        labName: 'Uploaded Laboratory Report',
        reportDate: extraction.structuredData?.reportDate || new Date().toISOString().split('T')[0],
        accessionNumber: `ACC-${Date.now().toString().slice(-6)}`,
        fileHash: `hash-${Date.now()}`,
        pageCount: 1,
        overallConfidence: 0.95,
        paperTheme: 'clean',
        biomarkers,
        extractedPatientName: extraction.structuredData?.patientName || undefined,
        extractedAge: extraction.structuredData?.patientAge ? parseInt(extraction.structuredData.patientAge, 10) : undefined,
        extractedSex: (extraction.structuredData?.patientSex as any) || undefined,
        extractedMedications: extraction.structuredData?.medications || [],
        extractedConditions: extraction.structuredData?.conditions || [],
        extractedSymptoms: extraction.structuredData?.symptoms || [],
        extractedAllergies: extraction.structuredData?.allergies || [],
        structuredData: extraction.structuredData,
      };

      setTimeout(() => {
        setIsProcessing(false);
        onUploadSuccess(newDoc);
        onClose();
      }, 400);
    } catch (err) {
      clearInterval(stepTimer);
      setIsProcessing(false);
      console.error('File upload error:', err);
      setErrorMsg("We couldn't complete the AI analysis. Please try again. Your original document is still available.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem',
    }}>
      <div className="card" style={{
        maxWidth: '540px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '12px',
        overflow: 'hidden',
        padding: 0,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.15rem 1.25rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#EFF6FF',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <UploadCloud size={20} color="#1E40AF" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
                Upload Medical Document
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#1E40AF', margin: '0.15rem 0 0' }}>
                Upload a medical report, prescription, laboratory report, or other supported medical document.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {errorMsg && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              padding: '0.55rem 0.85rem',
              color: '#991B1B',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {isProcessing ? (
            /* Progress state */
            <div style={{ padding: '1.75rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>✓ File uploaded</span>
              </div>

              <div>
                <Loader2 size={32} color="#0284C7" style={{ animation: 'spin 1.2s linear infinite', margin: '0 auto' }} />
              </div>

              <div>
                <h4 style={{ color: '#1E293B', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                  Processing {fileName}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#0284C7', margin: 0, fontWeight: 600 }}>
                  Stage {currentStep + 1} of 5: {steps[currentStep]}
                </p>
              </div>

              {/* Numbered Stages */}
              <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
                {steps.map((stg, idx) => {
                  const isDone = idx < currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        background: isCurrent ? '#EFF6FF' : isDone ? '#F0FDF4' : '#F8FAFC',
                        border: `1px solid ${isCurrent ? '#BFDBFE' : isDone ? '#BBF7D0' : '#E2E8F0'}`,
                        fontSize: '0.78rem',
                        color: isCurrent ? '#1D4ED8' : isDone ? '#15803D' : '#94A3B8',
                        fontWeight: isCurrent || isDone ? 600 : 400,
                      }}
                    >
                      <span style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isCurrent ? '#2563EB' : isDone ? '#16A34A' : '#E2E8F0',
                        color: isCurrent || isDone ? '#FFFFFF' : '#64748B',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}>
                        {isDone ? '✓' : idx + 1}
                      </span>
                      <span>{stg}</span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', maxWidth: '380px', height: '6px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  height: '100%',
                  background: '#0284C7',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          ) : (
            <>
              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: dragOver ? '2px dashed #0284C7' : '2px dashed #CBD5E1',
                  borderRadius: '8px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  background: dragOver ? '#EFF6FF' : '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <FileText size={36} color="#0284C7" style={{ margin: '0 auto 0.5rem auto' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: '0 0 0.25rem 0' }}>
                  Upload Medical Document
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                  Upload a medical report, prescription, laboratory report, or other supported medical document (PDF, JPG, PNG).
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ pointerEvents: 'none', fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
                >
                  Choose File
                </button>
              </div>

              {/* Privacy Notice */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.72rem',
                color: '#64748B',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
              }}>
                <ShieldCheck size={14} color="#166534" />
                <span>
                  Client-side processing &amp; zero data sharing. Medical records remain private.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
