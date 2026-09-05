import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { DocumentMeta } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newDoc: DocumentMeta) => void;
  availableSamples: DocumentMeta[];
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  availableSamples,
}) => {
  if (!isOpen) return null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fileName, setFileName] = useState('');

  const steps = [
    'Calculating cryptographic SHA-256 checksum & metadata...',
    'Extracting vector text streams & bounding box coordinates...',
    'Detecting in-report laboratory reference intervals...',
    'Verifying spatial provenance & grounding tokens...',
    'Ready for interactive clinical review!',
  ];

  const handleSimulateUpload = (sampleDoc: DocumentMeta) => {
    setFileName(sampleDoc.title + ' (' + sampleDoc.labName + ')');
    setIsProcessing(true);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          setTimeout(() => {
            setIsProcessing(false);
            onUploadSuccess(sampleDoc);
            onClose();
          }, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 400);
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
        maxWidth: '580px',
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
              Upload Laboratory Report (PDF / Image)
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
          {isProcessing ? (
            /* Progress state */
            <div style={{ padding: '1.75rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.875rem' }}>
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
                onClick={() => handleSimulateUpload(availableSamples[0])}
                style={{
                  border: '2px dashed #BFDBFE',
                  borderRadius: '8px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <FileText size={32} color="#3B82F6" style={{ margin: '0 auto 0.5rem auto' }} />
                <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#334155', margin: '0 0 0.2rem 0' }}>
                  Drop your lab report here
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 0.875rem 0' }}>
                  Supports Quest, Labcorp, and standard outpatient lab PDFs/images
                </p>
                <button className="btn btn-secondary" style={{ pointerEvents: 'none', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                  Browse Local Files
                </button>
              </div>

              {/* Quick Preset Selector */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  Or instantly test with pre-processed clinical reports:
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {availableSamples.map((sample) => (
                    <div
                      key={sample.id}
                      onClick={() => handleSimulateUpload(sample)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <FileCheck size={16} color="#3B82F6" />
                        <div>
                          <strong style={{ color: '#334155', fontSize: '0.8125rem', display: 'block' }}>
                            {sample.title}
                          </strong>
                          <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            {sample.labName} &bull; {sample.reportDate} ({sample.biomarkers.length} markers)
                          </span>
                        </div>
                      </div>

                      <span className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}>
                        Load Report
                      </span>
                    </div>
                  ))}
                </div>
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
                  Client-side evaluation &amp; zero data sharing. Documents are processed locally.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
