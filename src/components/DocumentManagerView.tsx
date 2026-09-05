import React, { useState, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  Filter, 
  Plus, 
  Layers, 
  FileCheck, 
  AlertCircle,
  File,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { 
  ManagedDocument, 
  DocumentCategory, 
  ProcessingStatus, 
  ExtractionStatus, 
  DocumentVerificationStatus,
  PatientRecord 
} from '../types';

interface DocumentManagerViewProps {
  documents: ManagedDocument[];
  activePatient: PatientRecord | null;
  onUploadDocuments: (files: File[], defaultCategory: DocumentCategory) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
  onUpdateDocumentCategory: (docId: string, category: DocumentCategory) => Promise<void>;
  onOpenInDualPane: (linkedLabReportId?: string) => void;
  onAddPatient?: () => void;
}

export const DocumentManagerView: React.FC<DocumentManagerViewProps> = ({
  documents,
  activePatient,
  onUploadDocuments,
  onDeleteDocument,
  onUpdateDocumentCategory,
  onOpenInDualPane,
  onAddPatient,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Unspecified');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supported MIME types and extensions
  const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];
  const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

  const validateAndProcessFiles = async (fileList: FileList | File[]) => {
    setUploadError(null);
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(fileList).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isValidExt = ALLOWED_EXTENSIONS.includes(ext);
      const isValidMime = ALLOWED_MIME_TYPES.includes(file.type) || file.type === '';

      if (isValidExt && isValidMime) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setUploadError(`Invalid file format: ${invalidFiles.join(', ')}. Only PDF, PNG, JPG, and JPEG files are supported.`);
      if (validFiles.length === 0) return;
    }

    if (validFiles.length > 0) {
      setIsUploading(true);
      try {
        await onUploadDocuments(validFiles, uploadCategory);
      } catch (err) {
        console.error('Upload failed', err);
        setUploadError('An error occurred during file ingestion.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await validateAndProcessFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedCategoryFilter === 'All' || doc.documentCategory === selectedCategoryFilter;
    const matchesStatus = 
      selectedStatusFilter === 'All' || 
      doc.processingStatus === selectedStatusFilter || 
      doc.verificationStatus === selectedStatusFilter;
    return matchesCategory && matchesStatus;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Subtle pastel badges
  const getProcessingStatusBadge = (status: ProcessingStatus) => {
    switch (status) {
      case 'Uploaded':
        return <span className="badge badge-extracted">Uploaded</span>;
      case 'Processing':
        return <span className="badge badge-pending">Processing</span>;
      case 'Processed':
        return <span className="badge badge-normal">Processed</span>;
      case 'Extraction Failed':
        return <span className="badge badge-critical">Failed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getExtractionStatusBadge = (status: ExtractionStatus) => {
    switch (status) {
      case 'Extracted':
        return <span className="badge badge-extracted">Extracted</span>;
      case 'Pending':
        return <span className="badge badge-pending">Pending</span>;
      case 'Extraction Failed':
        return <span className="badge badge-critical">Failed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getVerificationStatusBadge = (status: DocumentVerificationStatus) => {
    switch (status) {
      case 'Verified':
        return <span className="badge badge-verified"><CheckCircle2 size={11} /> Verified</span>;
      case 'Needs Verification':
        return <span className="badge badge-pending"><AlertTriangle size={11} /> Needs Verification</span>;
      case 'Pending':
        return <span className="badge"><Clock size={11} /> Pending</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Banner */}
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
            width: 42,
            height: 42,
            borderRadius: '8px',
            background: '#DBEAFE',
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
                Medical Document Management &amp; Ingestion
              </h2>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#166534',
                background: '#F0FDF4',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid #BBF7D0',
              }}>
                PostgreSQL Linked
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#1E40AF', margin: '0.2rem 0 0' }}>
              {activePatient ? (
                <>Managing records for: <strong style={{ color: '#1E3A8A' }}>{activePatient.name}</strong> (ID: {activePatient.id})</>
              ) : (
                <>No active patient selected</>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem' }}>
          <div style={{ background: '#FFFFFF', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Total Vault Files</span>
            <strong style={{ color: '#334155', fontSize: '0.925rem' }}>{documents.length}</strong>
          </div>
          <div style={{ background: '#FFFFFF', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #FDE68A' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Needs Verification</span>
            <strong style={{ color: '#92400E', fontSize: '0.925rem' }}>
              {documents.filter((d) => d.verificationStatus === 'Needs Verification').length}
            </strong>
          </div>
        </div>
      </div>

      {/* Security Banner */}
      <div style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: '8px',
        padding: '0.65rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.78rem',
        color: '#166534',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={15} color="#166534" />
          <span>
            <strong>Security &amp; Privacy Enforced:</strong> Documents are processed locally with cryptographic SHA-256 integrity checks. Files are never publicly exposed.
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#166534' }}>
          SECURE_VAULT
        </span>
      </div>

      {/* Drag-and-Drop Multi-File Ingestion Zone */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
              Upload Medical Documents
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0' }}>
              Supports PDF, PNG, JPG, JPEG with strict file validation
            </p>
          </div>

          {/* Document Type Selector for Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>Category:</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '0.35rem 0.65rem',
                color: '#334155',
                fontSize: '0.78rem',
                outline: 'none',
              }}
            >
              <option value="Unspecified">Unspecified / Uncertain (Prompt for review)</option>
              <option value="Laboratory Report">Laboratory Report</option>
              <option value="Prescription">Prescription</option>
              <option value="Medical Record">Medical Record</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {uploadError && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '6px',
            padding: '0.55rem 0.85rem',
            color: '#991B1B',
            fontSize: '0.78rem',
            marginBottom: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <AlertCircle size={15} />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Drop Target */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: dragOver ? '2px dashed #3B82F6' : '2px dashed #BFDBFE',
            borderRadius: '8px',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            background: dragOver ? '#EFF6FF' : '#F8FAFC',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          <UploadCloud size={36} color={dragOver ? '#3B82F6' : '#94A3B8'} style={{ margin: '0 auto 0.5rem auto' }} />
          
          <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#334155', marginBottom: '0.2rem' }}>
            {isUploading ? 'Ingesting and validating documents...' : 'Drag & drop medical documents here'}
          </h4>
          
          <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '0.75rem' }}>
            or click to select from your device &bull; Accepted: <strong style={{ color: '#334155' }}>PDF, PNG, JPG, JPEG</strong>
          </p>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ pointerEvents: 'none', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
          >
            <Plus size={14} />
            Browse Files
          </button>
        </div>
      </div>

      {/* Filter and Management Section */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
              Managed Document Vault
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0' }}>
              Showing {filteredDocs.length} of {documents.length} records linked to patient record
            </p>
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Filter size={13} color="#64748B" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '0.3rem 0.55rem',
                  color: '#334155',
                  fontSize: '0.75rem',
                  outline: 'none',
                }}
              >
                <option value="All">All Categories</option>
                <option value="Laboratory Report">Laboratory Reports</option>
                <option value="Prescription">Prescriptions</option>
                <option value="Medical Record">Medical Records</option>
                <option value="Other">Other</option>
                <option value="Unspecified">Unspecified / Uncertain</option>
              </select>
            </div>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '0.3rem 0.55rem',
                color: '#334155',
                fontSize: '0.75rem',
                outline: 'none',
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Needs Verification">Needs Verification</option>
              <option value="Verified">Verified</option>
              <option value="Processing">Processing</option>
              <option value="Processed">Processed</option>
            </select>
          </div>
        </div>

        {/* Document Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94A3B8' }}>
              <FileText size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
              <p style={{ fontSize: '0.8125rem' }}>No documents match the selected filters.</p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isPdf = doc.fileType === 'pdf';
              const isUnspecified = doc.documentCategory === 'Unspecified';

              return (
                <div
                  key={doc.id}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '8px',
                    border: isUnspecified
                      ? '1px solid #FDE68A'
                      : doc.verificationStatus === 'Needs Verification'
                      ? '1px solid #FDE68A'
                      : '1px solid #E2E8F0',
                    background: isUnspecified
                      ? '#FFFBEB'
                      : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Left: Icon & Title & File details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: '1 1 300px' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      background: isPdf ? '#FEF2F2' : '#EFF6FF',
                      border: isPdf ? '1px solid #FECACA' : '1px solid #BFDBFE',
                      color: isPdf ? '#DC2626' : '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ color: '#334155', fontSize: '0.875rem' }}>
                          {doc.filename}
                        </strong>

                        {/* Category Dropdown */}
                        <select
                          value={doc.documentCategory}
                          onChange={(e) => onUpdateDocumentCategory(doc.id, e.target.value as DocumentCategory)}
                          style={{
                            background: isUnspecified ? '#FFFBEB' : '#F8FAFC',
                            border: isUnspecified ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                            color: isUnspecified ? '#92400E' : '#475569',
                            borderRadius: '4px',
                            padding: '0.15rem 0.4rem',
                            fontSize: '0.72rem',
                            fontWeight: 500,
                            outline: 'none',
                          }}
                        >
                          <option value="Laboratory Report">Laboratory Report</option>
                          <option value="Prescription">Prescription</option>
                          <option value="Medical Record">Medical Record</option>
                          <option value="Other">Other</option>
                          <option value="Unspecified">Unspecified / Uncertain</option>
                        </select>

                        {isUnspecified && (
                          <span style={{ fontSize: '0.68rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <AlertTriangle size={11} /> Review Type
                          </span>
                        )}
                      </div>

                      {/* File Metadata Row: Date, Size, Format */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.25rem', fontSize: '0.72rem', color: '#64748B' }}>
                        <span>Uploaded: {new Date(doc.uploadTimestamp).toLocaleDateString()}</span>
                        <span>&bull;</span>
                        <span>Size: <strong style={{ color: '#334155' }}>{formatFileSize(doc.fileSize)}</strong></span>
                        <span>&bull;</span>
                        <span>Format: <code style={{ color: '#3B82F6', textTransform: 'uppercase' }}>{doc.fileType}</code></span>
                      </div>

                      {doc.previewSnippet && (
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          &ldquo;{doc.previewSnippet}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle: Explicit Document State Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748B', marginBottom: '0.15rem' }}>Processing</span>
                      {getProcessingStatusBadge(doc.processingStatus)}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748B', marginBottom: '0.15rem' }}>Extraction</span>
                      {getExtractionStatusBadge(doc.extractionStatus)}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748B', marginBottom: '0.15rem' }}>Verification</span>
                      {getVerificationStatusBadge(doc.verificationStatus)}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    <button
                      onClick={() => onOpenInDualPane(doc.linkedLabReportId || doc.id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      title="Open interactive report canvas with bounding box coordinates"
                    >
                      <Layers size={13} color="#3B82F6" />
                      Open Medical Report
                    </button>

                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.5rem', color: '#94A3B8' }}
                      title="Delete document record from PostgreSQL"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
