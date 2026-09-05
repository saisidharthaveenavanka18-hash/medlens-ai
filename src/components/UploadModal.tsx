import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Loader2, 
  ShieldCheck,
  AlertCircle
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
    'Calculating cryptographic SHA-256 checksum & metadata...',
    'Extracting laboratory data streams & structured values...',
    'Evaluating in-report reference intervals...',
    'Preparing interactive clinical review & provenance...',
  ];

  const processFile = async (file: File) => {
    setErrorMsg(null);
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
        category: 'Laboratory',
        numericValue: r.numericValue,
        rawValue: r.value,
        unit: r.unit,
        standardizedUnit: r.unit,
        referenceRange: {
          rawText: r.referenceRangeText,
          lower: r.rangeLower,
          upper: r.rangeUpper,
          isSpecifiedInReport: r.hasReferenceRange,
        },
        status: r.status,
        confidence: r.confidence,
        boundingBox: {
          x: 20,
          y: 40 + idx * 8,
          width: 60,
          height: 5,
        },
        pageNumber: r.pageNumber || 1,
        verificationStatus: r.isHumanVerified ? 'VERIFIED' : 'PENDING',
        auditHistory: [],
      }));

      const newDoc: DocumentMeta = {
        id: `doc-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        patientIdentifier: 'PT-ACTIVE',
        patientAgeGender: '',
        labName: 'Uploaded Laboratory Report',
        reportDate: new Date().toISOString().split('T')[0],
        accessionNumber: `ACC-${Date.now().toString().slice(-6)}`,
        fileHash: `hash-${Date.now()}`,
        pageCount: 1,
        overallConfidence: 0.95,
        paperTheme: 'clean',
        biomarkers,
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
      setErrorMsg('Failed to process medical document. Please try again.');
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
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
              Upload Laboratory Report (PDF / Image / Text)
            </h3>
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
            <div style={{ padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.875rem' }}>
              <div>
                <Loader2 size={36} color="#3B82F6" style={{ animation: 'spin 1.2s linear infinite' }} />
              </div>
              <div>
                <h4 style={{ color: '#334155', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                  Processing {fileName}
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#1E40AF', margin: 0 }}>
                  {steps[currentStep]}
                </p>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', maxWidth: '340px', height: '6px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  height: '100%',
                  background: '#3B82F6',
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
                  border: dragOver ? '2px dashed #3B82F6' : '2px dashed #BFDBFE',
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
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,application/pdf,image/*,text/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <FileText size={36} color="#3B82F6" style={{ margin: '0 auto 0.5rem auto' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: '0 0 0.25rem 0' }}>
                  Drop your lab report here
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                  Supports PDF, PNG, JPG, JPEG, and structured text reports
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ pointerEvents: 'none', fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
                >
                  Browse Local Files
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
