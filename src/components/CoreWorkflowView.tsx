import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Check, 
  ShieldCheck, 
  Info, 
  ArrowRight, 
  FileCheck, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  X,
  AlertCircle,
  File,
  Eye,
  UserCheck
} from 'lucide-react';
import { DocumentCategory, PatientRecord } from '../types';
import { 
  ExtractedLabRecord, 
  calculateReferenceRangeStatus, 
  extractDocumentData 
} from '../services/extractor';

interface CoreWorkflowViewProps {
  activePatient?: PatientRecord | null;
  records?: ExtractedLabRecord[];
  onUpdateRecords?: (records: ExtractedLabRecord[]) => void;
  onOpenDualPaneWithDoc?: (docId: string) => void;
  onAddPatient?: () => void;
}

export const CoreWorkflowView: React.FC<CoreWorkflowViewProps> = ({
  activePatient,
  records: externalRecords,
  onUpdateRecords,
  onOpenDualPaneWithDoc,
  onAddPatient,
}) => {
  // Records in current structured medical record
  const [internalRecords, setInternalRecords] = useState<ExtractedLabRecord[]>([]);
  const records = externalRecords !== undefined ? externalRecords : internalRecords;
  const setRecords = (update: ExtractedLabRecord[] | ((prev: ExtractedLabRecord[]) => ExtractedLabRecord[])) => {
    if (typeof update === 'function') {
      setInternalRecords((prev) => {
        const next = update(prev);
        if (onUpdateRecords) onUpdateRecords(next);
        return next;
      });
    } else {
      setInternalRecords(update);
      if (onUpdateRecords) onUpdateRecords(update);
    }
  };

  const activePatientName = activePatient?.name || 'No Patient Selected';
  const activePatientAge = activePatient?.age !== undefined ? activePatient.age : '--';
  const activePatientSex = activePatient?.sex || '--';
  const [activeReports, setActiveReports] = useState<{ id: string; title: string; date: string; lab: string; pageCount: number }[]>([]);

  // Upload state
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('Laboratory Report');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit / Review Modal state
  const [editingRecord, setEditingRecord] = useState<ExtractedLabRecord | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editUnit, setEditUnit] = useState<string>('');
  const [editRangeText, setEditRangeText] = useState<string>('');
  const [editObservation, setEditObservation] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Supported extensions
  const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'txt', 'csv'];
  const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'text/plain'];

  // Handle File Ingestion
  const handleFileUpload = async (fileList: FileList | File[]) => {
    setExtractError(null);
    setUploadSuccessMessage(null);
    const files = Array.from(fileList);

    if (files.length === 0) return;
    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setExtractError(`Unsupported file format ".${ext}". Please upload PDF, PNG, JPG, or JPEG.`);
      return;
    }

    setIsExtracting(true);
    try {
      const extractionResult = await extractDocumentData(file, selectedCategory);
      
      // Append new extracted records to structured table
      setRecords((prev) => [...extractionResult.records, ...prev]);
      
      // Add report to reports list
      setActiveReports((prev) => [
        {
          id: `rep-${Date.now()}`,
          title: file.name,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          lab: selectedCategory === 'Laboratory Report' ? 'Laboratory Report Document' : `${selectedCategory} Upload`,
          pageCount: 1,
        },
        ...prev,
      ]);

      setIsDemoActive(extractionResult.isDemoFallback);
      setUploadSuccessMessage(`Successfully extracted ${extractionResult.records.length} structured laboratory tests from ${file.name}.`);
      setTimeout(() => setUploadSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Extraction error:', err);
      setExtractError('An error occurred during medical document processing.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // One-click Verify
  const handleVerify = (recordId: string) => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          return {
            ...rec,
            isHumanVerified: true,
            verifiedBy: 'Clinician Auditor',
            verifiedAt: new Date().toISOString(),
          };
        }
        return rec;
      })
    );
  };

  // Open Edit Modal
  const handleOpenEdit = (rec: ExtractedLabRecord) => {
    setEditingRecord(rec);
    setEditValue(rec.value);
    setEditUnit(rec.unit);
    setEditRangeText(rec.hasReferenceRange ? rec.referenceRangeText : '');
    setEditObservation(rec.observation || '');
    setEditNotes('');
  };

  // Save Edit Correction (Preserves original AI extraction)
  const handleSaveEdit = () => {
    if (!editingRecord) return;

    const parsedNum = parseFloat(editValue);
    // Parse range lower and upper if provided
    let lower: number | null = null;
    let upper: number | null = null;
    let hasRange = false;

    if (editRangeText.trim() && editRangeText.toUpperCase() !== 'REFERENCE RANGE UNAVAILABLE') {
      const match = editRangeText.match(/([0-9.]+)\s*[-–—to]+\s*([0-9.]+)/i);
      if (match) {
        lower = parseFloat(match[1]);
        upper = parseFloat(match[2]);
        hasRange = !isNaN(lower) && !isNaN(upper);
      } else {
        hasRange = true;
      }
    }

    const newStatus = calculateReferenceRangeStatus(
      isNaN(parsedNum) ? null : parsedNum,
      lower,
      upper,
      hasRange
    );

    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === editingRecord.id) {
          return {
            ...rec,
            value: editValue,
            numericValue: isNaN(parsedNum) ? null : parsedNum,
            unit: editUnit,
            referenceRangeText: hasRange ? editRangeText : 'REFERENCE RANGE UNAVAILABLE',
            rangeLower: lower,
            rangeUpper: upper,
            hasReferenceRange: hasRange,
            status: newStatus,
            observation: editObservation || undefined,
            isHumanVerified: true,
            verifiedBy: 'Clinician Auditor (Manual Correction)',
            verifiedAt: new Date().toISOString(),
            auditNotes: editNotes || 'Audited and adjusted by clinician.',
            // Explicitly preserve original AI extraction
            originalAiValue: rec.originalAiValue || rec.value,
            originalAiUnit: rec.originalAiUnit || rec.unit,
            originalAiRange: rec.originalAiRange || rec.referenceRangeText,
          };
        }
        return rec;
      })
    );

    setEditingRecord(null);
  };

  // Status Badge Helper
  const getStatusBadge = (status: ExtractedLabRecord['status']) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="badge badge-normal" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
            NORMAL
          </span>
        );
      case 'LOW':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            background: '#EFF6FF',
            color: '#1E40AF',
            border: '1px solid #BFDBFE',
            fontSize: '0.72rem',
            fontWeight: 600,
          }}>
            LOW
          </span>
        );
      case 'HIGH':
        return (
          <span className="badge badge-high" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
            HIGH
          </span>
        );
      case 'REFERENCE RANGE UNAVAILABLE':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.15rem 0.45rem',
            borderRadius: '9999px',
            background: '#F8FAFC',
            color: '#64748B',
            border: '1px solid #E2E8F0',
            fontSize: '0.68rem',
            fontWeight: 500,
          }}>
            REFERENCE RANGE UNAVAILABLE
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* Top Banner: Workflow Header & Prominent "Load Demo Patient" Button */}
      <div className="card" style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '8px',
            background: '#DBEAFE',
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
                Clinical Document Extraction &amp; Verification Pipeline
              </h2>
              {isDemoActive && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#92400E',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '4px',
                  letterSpacing: '0.04em',
                }}>
                  DEMO DATA — FICTIONAL
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#1E40AF', margin: '0.2rem 0 0' }}>
              UPLOAD &rarr; EXTRACT &rarr; STRUCTURE &rarr; REFERENCE RANGE &rarr; PROVENANCE &rarr; REVIEW
            </p>
          </div>
        </div>

        {/* Prominent "Load Demo Patient" Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleLoadDemoPatient}
            className="btn btn-primary"
            style={{
              padding: '0.55rem 1.15rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
            }}
          >
            <Sparkles size={16} />
            Load Demo Patient
          </button>
        </div>
      </div>

      {/* Patient & Reports Context Bar */}
      <div className="card" style={{
        padding: '0.875rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.8125rem',
        background: '#FFFFFF',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Active Patient</span>
            <strong style={{ color: '#334155' }}>{activePatientName}</strong> ({activePatientAge} Y / {activePatientSex})
          </div>
          <div style={{ height: '24px', width: '1px', background: '#E2E8F0' }} />
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Reports Loaded</span>
            <span style={{ color: '#334155', fontWeight: 500 }}>
              {activeReports.length} Document(s) &bull; {activeReports.map((r) => r.date).join(', ')}
            </span>
          </div>
          <div style={{ height: '24px', width: '1px', background: '#E2E8F0' }} />
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Safety Guardrail</span>
            <span style={{ color: '#166534', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={14} /> Zero Inferred Reference Ranges
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            {records.filter((r) => r.isHumanVerified).length} of {records.length} Tests Verified
          </span>
        </div>
      </div>

      {uploadSuccessMessage && (
        <div style={{
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          color: '#166534',
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <CheckCircle2 size={16} />
          <span>{uploadSuccessMessage}</span>
        </div>
      )}

      {extractError && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          color: '#991B1B',
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <AlertCircle size={16} />
          <span>{extractError}</span>
        </div>
      )}

      {/* STEP 1: Document Upload */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
              Upload Medical Document
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0' }}>
              Supported formats clearly: <strong style={{ color: '#334155' }}>PDF, JPG, JPEG, PNG</strong>
            </p>
          </div>

          {/* Document Type Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>Select Document Type:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '0.35rem 0.65rem',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 500,
                outline: 'none',
              }}
            >
              <option value="Laboratory Report">Laboratory Report</option>
              <option value="Prescription">Prescription</option>
              <option value="Medical Record">Medical Record</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFileUpload(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: dragOver ? '2px dashed #3B82F6' : '2px dashed #BFDBFE',
            borderRadius: '8px',
            padding: '1.75rem 1.5rem',
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
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files);
              }
            }}
            style={{ display: 'none' }}
          />

          <UploadCloud size={36} color={dragOver ? '#3B82F6' : '#94A3B8'} style={{ margin: '0 auto 0.5rem auto' }} />

          <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#334155', margin: '0 0 0.25rem 0' }}>
            {isExtracting ? 'Analyzing document with extraction pipeline...' : 'Click to browse or drop medical document here'}
          </h4>

          <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 0.75rem 0' }}>
            Accepted: <strong style={{ color: '#334155' }}>PDF, JPG, JPEG, PNG</strong> &bull; Automatic reference range parsing &amp; provenance attribution
          </p>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ pointerEvents: 'none', fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
          >
            Select Document
          </button>
        </div>
      </div>

      {/* STEP 3, 4, 5, 6: Structured Medical Record Table with Reference Range, Provenance, and Review */}
      <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', margin: 0 }}>
              Structured Medical Record
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0' }}>
              Deterministic reference range interpretation &bull; Explicit provenance tags &bull; Clinician sign-off
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Showing {records.length} extracted tests
            </span>
          </div>
        </div>

        {/* Clean Structured Table (No chatbot responses) */}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569' }}>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Test</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Value</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Unit</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Reference Range</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Source &amp; Provenance</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Confidence</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, textAlign: 'right' }}>Review</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => {
              const isLowConfidence = rec.confidence < 0.7;

              return (
                <tr
                  key={rec.id}
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    background: rec.isHumanVerified ? '#F0FDF4' : '#FFFFFF',
                    transition: 'background-color 0.12s ease',
                  }}
                >
                  {/* Test Name */}
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <div style={{ fontWeight: 600, color: '#334155' }}>
                      {rec.testName}
                    </div>
                    {rec.observation && (
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>
                        {rec.observation}
                      </div>
                    )}
                  </td>

                  {/* Value (Preserves original AI extraction if edited) */}
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#334155' }}>
                      {rec.value}
                    </div>
                    {rec.originalAiValue && rec.originalAiValue !== rec.value && (
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                        Orig: {rec.originalAiValue}
                      </div>
                    )}
                  </td>

                  {/* Unit */}
                  <td style={{ padding: '0.75rem 0.85rem', color: '#475569', fontWeight: 500 }}>
                    {rec.unit || '--'}
                  </td>

                  {/* Reference Range (NEVER invented) */}
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    {rec.hasReferenceRange ? (
                      <span style={{ color: '#334155', fontWeight: 500 }}>
                        {rec.referenceRangeText}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#64748B',
                        background: '#F1F5F9',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        border: '1px solid #E2E8F0',
                      }}>
                        REFERENCE RANGE UNAVAILABLE
                      </span>
                    )}
                  </td>

                  {/* Status: LOW / NORMAL / HIGH / REFERENCE RANGE UNAVAILABLE */}
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    {getStatusBadge(rec.status)}
                  </td>

                  {/* Date */}
                  <td style={{ padding: '0.75rem 0.85rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {rec.date}
                  </td>

                  {/* Source & Provenance (AI Extracted, Source Document, Page if available) */}
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        width: 'fit-content',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: '#1E40AF',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                      }}>
                        AI Extracted
                      </span>

                      <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 500 }}>
                        {rec.sourceDocument}
                      </div>

                      {/* Only show page if explicitly available in source report */}
                      {rec.pageNumber !== undefined && (
                        <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                          Page {rec.pageNumber}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Extraction Confidence */}
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isLowConfidence ? '#991B1B' : '#166534',
                      background: isLowConfidence ? '#FEF2F2' : '#F0FDF4',
                      border: `1px solid ${isLowConfidence ? '#FECACA' : '#BBF7D0'}`,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      display: 'inline-block',
                    }}>
                      {(rec.confidence * 100).toFixed(0)}%
                    </span>
                    {isLowConfidence && (
                      <span style={{ display: 'block', fontSize: '0.68rem', color: '#DC2626', marginTop: '0.2rem' }}>
                        Low Confidence
                      </span>
                    )}
                  </td>

                  {/* Review Actions: Edit / Verify / ✓ Human Verified */}
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                    {rec.isHumanVerified ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#166534',
                          background: '#DCFCE7',
                          border: '1px solid #86EFAC',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                        }}>
                          <Check size={13} />
                          Human Verified
                        </span>
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748B',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Re-edit
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                          title="Edit value, unit or reference bounds"
                        >
                          <Edit3 size={12} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleVerify(rec.id)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                          title="Confirm and sign off as Human Verified"
                        >
                          <Check size={12} />
                          Verify
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Responsible AI Safety Guardrail Footer */}
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '0.875rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        fontSize: '0.78rem',
        color: '#64748B',
      }}>
        <Info size={16} color="#3B82F6" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#334155' }}>Responsible AI Compliance:</strong> MedLens extracts and structures printed laboratory information with full provenance and human governance. It does NOT diagnose diseases, prescribe medications, or invent missing reference ranges.
        </div>
      </div>

      {/* Edit & Verification Modal */}
      {editingRecord && (
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
            maxWidth: '560px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '12px',
            overflow: 'hidden',
            padding: 0,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.15rem 1.25rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#EFF6FF',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={18} color="#1E40AF" />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
                    Review &amp; Edit Extracted Test: {editingRecord.testName}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#1E40AF' }}>
                    Source: {editingRecord.sourceDocument} {editingRecord.pageNumber ? `(Page ${editingRecord.pageNumber})` : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Original AI Extraction Callout */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.75rem',
                color: '#64748B',
              }}>
                <span style={{ fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                  Original AI Extraction:
                </span>
                Value: <strong style={{ color: '#1E40AF' }}>{editingRecord.originalAiValue || editingRecord.value} {editingRecord.originalAiUnit || editingRecord.unit}</strong> &bull; Range: {editingRecord.originalAiRange || editingRecord.referenceRangeText}
              </div>

              {/* Form Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                    Observed Value *
                  </label>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '0.45rem 0.65rem',
                      color: '#334155',
                      fontSize: '0.8125rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                    Unit
                  </label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '0.45rem 0.65rem',
                      color: '#334155',
                      fontSize: '0.8125rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                  Reference Range (Printed on Report)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 13 - 17 or leave blank if unavailable"
                  value={editRangeText}
                  onChange={(e) => setEditRangeText(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '0.45rem 0.65rem',
                    color: '#334155',
                    fontSize: '0.8125rem',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                  Leave blank or set to &quot;REFERENCE RANGE UNAVAILABLE&quot; if not provided by lab. Never invent intervals.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                  Clinical Observation / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Confirmed against printed Quest Diagnostics report patch"
                  value={editObservation}
                  onChange={(e) => setEditObservation(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '0.45rem 0.65rem',
                    color: '#334155',
                    fontSize: '0.8125rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              padding: '0.875rem 1.25rem',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC',
            }}>
              <button
                onClick={() => setEditingRecord(null)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem' }}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEdit}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', padding: '0.4rem 0.9rem' }}
              >
                <Check size={14} />
                Save &amp; Mark Human Verified
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
