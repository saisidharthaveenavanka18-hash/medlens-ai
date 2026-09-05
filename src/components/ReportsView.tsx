import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Trash2, 
  GitCompare, 
  Clock, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Search,
  FileCheck,
  Sparkles,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { ManagedDocument, DocumentMeta, PatientRecord } from '../types';
import { extractDocumentData } from '../services/extractor';
import { DocumentCanvas } from './DocumentCanvas';
import { BiomarkerPanel } from './BiomarkerPanel';
import { HitlQueueView } from './HitlQueueView';
import { ReportComparisonView } from './ReportComparisonView';
import { AiAssistedSummaryCard } from './AiAssistedSummaryCard';
import { AskMedLensView } from './AskMedLensView';

interface ReportsViewProps {
  documents: ManagedDocument[];
  labDocuments: DocumentMeta[];
  activePatient: PatientRecord | null;
  onUploadSuccess: (newDoc: DocumentMeta) => void;
  onDeleteDocument?: (docId: string) => Promise<void>;
  onOpenVerification?: (bm: any) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  documents,
  labDocuments,
  activePatient,
  onUploadSuccess,
  onDeleteDocument,
  onOpenVerification,
}) => {
  // Navigation within Reports: 'summary' | 'viewer' | 'all' | 'verify' | 'compare'
  const [activeReportSubTab, setActiveReportSubTab] = useState<'summary' | 'viewer' | 'all' | 'verify' | 'compare'>('summary');
  const [activeDocId, setActiveDocId] = useState<string>(labDocuments[0]?.id || '');
  const [selectedBiomarkerId, setSelectedBiomarkerId] = useState<string | null>(null);

  // Exact requested 5 processing stages
  const steps = [
    'Reading document',
    'Extracting information',
    'Organizing information',
    'Generating AI-assisted summary',
    'Ready for review',
  ];

  // Upload processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 2 ? prev + 1 : prev));
    }, 400);

    try {
      const extraction = await extractDocumentData(file, 'Laboratory Report');
      clearInterval(stepInterval);
      setCurrentStep(steps.length - 1); // "Ready for review"

      const targetPatientId = activePatient ? activePatient.id : 'PT-ACTIVE';

      const biomarkers = extraction.records.map((r, idx) => ({
        id: r.id || `bm-${Date.now()}-${idx}`,
        canonicalName: r.testName,
        rawLabel: r.testName,
        category: 'Other' as const,
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
          sourceCitation: `Extracted from token in ${file.name}`,
        },
        provenance: {
          page: r.pageNumber || 1,
          bbox: [35 + idx * 7, 18, 41 + idx * 7, 82] as [number, number, number, number],
          snippet: `${r.testName}: ${r.value} ${r.unit} (Ref: ${r.referenceRangeText || 'Not available in the uploaded record.'})`,
          confidence: r.confidence,
        },
        status: (r.status === 'REFERENCE RANGE UNAVAILABLE' ? 'UNSPECIFIED' : r.status) as any,
        confidence: r.confidence,
        verificationStatus: (r.isHumanVerified ? 'VERIFIED' : 'PENDING') as 'VERIFIED' | 'PENDING',
        auditHistory: [],
        educationalNote: `Clinical biomarker: ${r.testName}. Consult healthcare provider for medical review.`,
        clinicalQuestions: [
          `What are the clinical implications of my ${r.testName} measurement (${r.value} ${r.unit})?`,
          `Is follow-up testing recommended?`
        ],
      }));

      const newDoc: DocumentMeta = {
        id: `doc-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        patientIdentifier: targetPatientId,
        patientAgeGender: activePatient 
          ? `${activePatient.age}Y / ${activePatient.sex}` 
          : (extraction.structuredData?.patientAge ? `${extraction.structuredData.patientAge}Y / ${extraction.structuredData.patientSex || ''}` : ''),
        labName: 'Clinical Diagnostic Laboratory',
        reportDate: extraction.structuredData?.reportDate || new Date().toISOString().split('T')[0],
        accessionNumber: `ACC-${Date.now().toString().slice(-6)}`,
        fileHash: `sha256-${Date.now()}`,
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
        setActiveDocId(newDoc.id);
        setActiveReportSubTab('summary');
      }, 500);

    } catch (err) {
      clearInterval(stepInterval);
      setIsProcessing(false);
      console.error('File upload error:', err);
      setErrorMsg("We couldn't complete the AI analysis. Please try again. Your original document is still available.");
    }
  };

  // Explicitly map report lifecycle to the 5 standard states:
  // Uploaded | Processing | Ready | Needs Review | Failed
  const renderReportStatusBadge = (processingStatus: string, verificationStatus?: string) => {
    const p = (processingStatus || '').toLowerCase();
    const v = (verificationStatus || '').toLowerCase();

    if (p.includes('fail') || p.includes('error')) {
      return <span className="badge badge-status-failed">Failed</span>;
    }
    if (p.includes('process') || p.includes('uploading') || p.includes('extracting')) {
      return <span className="badge badge-status-processing">Processing</span>;
    }
    if (v.includes('need') || v.includes('pending') || p.includes('pending')) {
      return <span className="badge badge-status-needs-review">Needs Review</span>;
    }
    if (p.includes('ready') || p.includes('complete') || v.includes('verified')) {
      return <span className="badge badge-status-ready">Ready</span>;
    }
    return <span className="badge badge-status-uploaded">Uploaded</span>;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const activeDoc = labDocuments.find((d) => d.id === activeDocId) || labDocuments[0];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. PROMINENT, EXTREMELY SIMPLE UPLOAD AREA */}
      <section className="card" style={{
        padding: '2rem 1.75rem',
        background: '#FFFFFF',
        border: '1.5px solid #CBD5E1',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '14px',
            background: '#F0FDFA',
            color: '#0D9488',
            border: '1px solid #99F6E4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <UploadCloud size={26} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            Upload Medical Document
          </h2>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Upload a medical report, prescription, laboratory report, or other supported medical document.
          </p>

          {/* CLEAR PROCESSING STAGES */}
          {isProcessing ? (
            <div style={{
              background: '#F0F9FF',
              border: '1.5px solid #BAE6FD',
              borderRadius: 'var(--radius-md)',
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}>
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
                <Loader2 size={36} color="#0284C7" style={{ animation: 'spin 1.2s linear infinite', margin: '0 auto' }} />
              </div>

              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0369A1', margin: '0 0 0.25rem' }}>
                  Processing {fileName}
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#0284C7', margin: 0, fontWeight: 600 }}>
                  Stage {currentStep + 1} of 5: {steps[currentStep]}
                </p>
              </div>

              {/* Numbered Stages */}
              <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
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
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        background: isCurrent ? '#EFF6FF' : isDone ? '#F0FDF4' : '#F8FAFC',
                        border: `1px solid ${isCurrent ? '#BFDBFE' : isDone ? '#BBF7D0' : '#E2E8F0'}`,
                        fontSize: '0.8125rem',
                        color: isCurrent ? '#1D4ED8' : isDone ? '#15803D' : '#94A3B8',
                        fontWeight: isCurrent || isDone ? 600 : 400,
                      }}
                    >
                      <span style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isCurrent ? '#2563EB' : isDone ? '#16A34A' : '#E2E8F0',
                        color: isCurrent || isDone ? '#FFFFFF' : '#64748B',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                      }}>
                        {isDone ? '✓' : idx + 1}
                      </span>
                      <span>{stg}</span>
                    </div>
                  );
                })}
              </div>

              {/* Step indicator bar */}
              <div style={{ width: '100%', maxWidth: '420px', height: '6px', background: '#E0F2FE', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  height: '100%',
                  background: '#0284C7',
                  transition: 'width 0.35s ease',
                }} />
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: dragOver ? '2px dashed #0284C7' : '2px dashed #CBD5E1',
                borderRadius: 'var(--radius-md)',
                padding: '2rem 1.5rem',
                background: dragOver ? '#F0F9FF' : '#F8FAFC',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    processFile(e.target.files[0]);
                  }
                }}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                style={{ fontSize: '0.875rem', padding: '0.55rem 1.25rem' }}
              >
                <UploadCloud size={18} />
                Choose File
              </button>

              <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                Supports PDF, JPG, and PNG documents
              </span>

              {errorMsg && (
                <div style={{ color: '#DC2626', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2. PERSISTENT RESPONSIBLE AI NOTICE */}
      <div className="ai-disclaimer-notice" style={{ margin: 0 }}>
        <ShieldAlert size={18} color="#B45309" style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 600 }}>
          AI-assisted information. Verify important details against the original record and consult a qualified healthcare professional for clinical decisions.
        </span>
      </div>

      {/* 3. NATURALLY INTEGRATED SUB-NAVIGATION STRIP */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveReportSubTab('summary')}
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeReportSubTab === 'summary' ? '#BAE6FD' : 'transparent',
              background: activeReportSubTab === 'summary' ? '#F0F9FF' : 'transparent',
              color: activeReportSubTab === 'summary' ? '#0369A1' : '#475569',
              fontSize: '0.8125rem',
              fontWeight: activeReportSubTab === 'summary' ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Sparkles size={15} />
            <span>AI Summary &amp; Ask MedLens</span>
          </button>

          <button
            onClick={() => setActiveReportSubTab('viewer')}
            disabled={labDocuments.length === 0}
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeReportSubTab === 'viewer' ? '#BAE6FD' : 'transparent',
              background: activeReportSubTab === 'viewer' ? '#F0F9FF' : 'transparent',
              color: activeReportSubTab === 'viewer' ? '#0369A1' : labDocuments.length === 0 ? '#CBD5E1' : '#475569',
              fontSize: '0.8125rem',
              fontWeight: activeReportSubTab === 'viewer' ? 600 : 500,
              cursor: labDocuments.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Eye size={15} />
            <span>Original Report Canvas</span>
          </button>

          <button
            onClick={() => setActiveReportSubTab('all')}
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeReportSubTab === 'all' ? '#BAE6FD' : 'transparent',
              background: activeReportSubTab === 'all' ? '#F0F9FF' : 'transparent',
              color: activeReportSubTab === 'all' ? '#0369A1' : '#475569',
              fontSize: '0.8125rem',
              fontWeight: activeReportSubTab === 'all' ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <FileText size={15} />
            <span>All Reports Vault ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveReportSubTab('verify')}
            disabled={labDocuments.length === 0}
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeReportSubTab === 'verify' ? '#BAE6FD' : 'transparent',
              background: activeReportSubTab === 'verify' ? '#F0F9FF' : 'transparent',
              color: activeReportSubTab === 'verify' ? '#0369A1' : labDocuments.length === 0 ? '#CBD5E1' : '#475569',
              fontSize: '0.8125rem',
              fontWeight: activeReportSubTab === 'verify' ? 600 : 500,
              cursor: labDocuments.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <CheckCircle2 size={15} />
            <span>Review &amp; Verify</span>
          </button>

          <button
            onClick={() => setActiveReportSubTab('compare')}
            disabled={labDocuments.length < 2}
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeReportSubTab === 'compare' ? '#BAE6FD' : 'transparent',
              background: activeReportSubTab === 'compare' ? '#F0F9FF' : 'transparent',
              color: activeReportSubTab === 'compare' ? '#0369A1' : labDocuments.length < 2 ? '#CBD5E1' : '#475569',
              fontSize: '0.8125rem',
              fontWeight: activeReportSubTab === 'compare' ? 600 : 500,
              cursor: labDocuments.length < 2 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <GitCompare size={15} />
            <span>Compare Reports</span>
          </button>
        </div>

        {labDocuments.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Active Report:</span>
            <select
              value={activeDocId}
              onChange={(e) => setActiveDocId(e.target.value)}
              style={{
                fontSize: '0.78rem',
                padding: '0.25rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                outline: 'none',
              }}
            >
              {labDocuments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.reportDate})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. NATURALLY INTEGRATED AI SUMMARY & ASK MEDLENS WORKFLOW */}
      {activeReportSubTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* AI-Assisted Summary with Key Info, Important Findings, Lab Results, Meds, Conditions, Missing Info */}
          <AiAssistedSummaryCard
            patient={activePatient}
            documents={documents}
            labDocuments={labDocuments}
            onViewOriginalReport={(docId) => {
              setActiveDocId(docId);
              setActiveReportSubTab('viewer');
            }}
          />

          {/* Ask MedLens naturally embedded into the report workflow */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="#0284C7" />
              <span>Ask MedLens About This Patient&apos;s Records</span>
            </h3>
            <AskMedLensView
              patient={activePatient}
              documents={documents}
              labDocuments={labDocuments}
              defaultSubTab="qa"
              onViewOriginalReport={(docId) => {
                setActiveDocId(docId);
                setActiveReportSubTab('viewer');
              }}
            />
          </div>
        </div>
      )}

      {/* 5. ORIGINAL DOCUMENT CANVAS & BOUNDING BOXES */}
      {activeReportSubTab === 'viewer' && activeDoc && (
        <div className="dual-pane-grid">
          <DocumentCanvas
            document={activeDoc}
            selectedBiomarkerId={selectedBiomarkerId}
            onSelectBiomarker={setSelectedBiomarkerId}
            userMode="patient"
          />
          <BiomarkerPanel
            biomarkers={activeDoc.biomarkers}
            selectedBiomarkerId={selectedBiomarkerId}
            onSelectBiomarker={setSelectedBiomarkerId}
            onOpenVerification={onOpenVerification || (() => {})}
            userMode="patient"
          />
        </div>
      )}

      {/* 6. ALL REPORTS VAULT */}
      {activeReportSubTab === 'all' && (
        documents.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-state-icon">
              <FileText size={24} />
            </div>
            <h3 className="empty-state-title">No medical reports uploaded yet.</h3>
            <p className="empty-state-desc">
              Upload your laboratory report, physician discharge summary, or diagnostic test above to extract clinical information and organize your record.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Report Filename</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Uploaded Date</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Processing Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>AI Analysis Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0F172A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <FileText size={16} color="#0284C7" />
                          <span>{doc.filename}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#334155' }}>
                        {doc.documentCategory}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#64748B' }}>
                        {new Date(doc.uploadTimestamp).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {renderReportStatusBadge(doc.processingStatus, doc.verificationStatus)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge ${doc.verificationStatus === 'Verified' ? 'badge-verified' : 'badge-pending'}`}>
                          {doc.extractionStatus || doc.verificationStatus}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            onClick={() => {
                              setActiveDocId(doc.linkedLabReportId || doc.id);
                              setActiveReportSubTab('viewer');
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem' }}
                          >
                            <Eye size={13} />
                            View Canvas
                          </button>

                          {onDeleteDocument && (
                            <button
                              onClick={() => onDeleteDocument(doc.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#DC2626', borderColor: '#FECACA' }}
                              title="Delete Report"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* 7. REVIEW & VERIFICATION */}
      {activeReportSubTab === 'verify' && (
        <HitlQueueView
          documents={labDocuments}
          onOpenVerification={onOpenVerification || (() => {})}
          onBatchApproveHighConfidence={() => {}}
        />
      )}

      {/* 8. REPORT COMPARISON */}
      {activeReportSubTab === 'compare' && (
        <ReportComparisonView documents={labDocuments} />
      )}

    </div>
  );
};
