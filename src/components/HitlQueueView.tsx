import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileEdit, 
  ShieldCheck, 
  CheckCheck, 
  History,
  Clock
} from 'lucide-react';
import { DocumentMeta, BiomarkerRecord } from '../types';

interface HitlQueueViewProps {
  documents: DocumentMeta[];
  onOpenVerification: (bm: BiomarkerRecord) => void;
  onBatchApproveHighConfidence: () => void;
}

export const HitlQueueView: React.FC<HitlQueueViewProps> = ({
  documents,
  onOpenVerification,
  onBatchApproveHighConfidence,
}) => {
  // Aggregate all biomarkers across documents
  const allBiomarkers: { doc: DocumentMeta; bm: BiomarkerRecord }[] = [];
  documents.forEach((doc) => {
    doc.biomarkers.forEach((bm) => {
      allBiomarkers.push({ doc, bm });
    });
  });

  const pendingItems = allBiomarkers.filter((item) => item.bm.verificationStatus === 'PENDING' || item.bm.confidence < 0.85);
  const verifiedItems = allBiomarkers.filter((item) => item.bm.verificationStatus === 'VERIFIED');
  const avgConfidence = allBiomarkers.length > 0
    ? ((allBiomarkers.reduce((acc, item) => acc + (item.bm.confidence || 0), 0) / allBiomarkers.length) * 100).toFixed(1) + '%'
    : '0%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* Overview Banner */}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1E40AF',
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
              Human-in-the-Loop (HITL) Clinical Verification Queue
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#1E40AF', margin: '0.2rem 0 0' }}>
              Clinician sign-off queue for lower-confidence OCR tokens and smudged values
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button
            onClick={onBatchApproveHighConfidence}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
            disabled={allBiomarkers.length === 0}
          >
            <CheckCheck size={14} color="#166534" />
            Batch Verify High-Confidence (&gt;90%)
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Extracted</span>
          <strong style={{ fontSize: '1.4rem', color: '#334155' }}>
            {allBiomarkers.length}
          </strong>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#166534', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Clinician Verified</span>
          <strong style={{ fontSize: '1.4rem', color: '#166534' }}>
            {verifiedItems.length}
          </strong>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#92400E', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Pending Review</span>
          <strong style={{ fontSize: '1.4rem', color: '#92400E' }}>
            {pendingItems.length}
          </strong>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#1E40AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>OCR Precision</span>
          <strong style={{ fontSize: '1.4rem', color: '#1E40AF' }}>
            {avgConfidence}
          </strong>
        </div>
      </div>

      {/* Items Requiring Review Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
              Items Awaiting Human Verification
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0' }}>
              Sorted by lowest OCR character confidence
            </p>
          </div>

          <span className="badge badge-pending" style={{ fontSize: '0.75rem' }}>
            {pendingItems.length} Action Items
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {allBiomarkers.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B' }}>
              <CheckCircle2 size={32} color="#94A3B8" style={{ margin: '0 auto 0.5rem auto' }} />
              <h4 style={{ color: '#334155', fontSize: '0.925rem', margin: 0 }}>No extracted items yet</h4>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                Upload a medical report to inspect and verify OCR extractions.
              </p>
            </div>
          ) : pendingItems.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B' }}>
              <CheckCircle2 size={32} color="#166534" style={{ margin: '0 auto 0.5rem auto' }} />
              <h4 style={{ color: '#334155', fontSize: '0.925rem', margin: 0 }}>All extracted items have been verified!</h4>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                100% human sign-off achieved across all active lab reports.
              </p>
            </div>
          ) : (
            pendingItems.map(({ doc, bm }) => (
              <div
                key={bm.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1rem',
                  borderRadius: '8px',
                  background: '#F8FAFC',
                  border: bm.confidence < 0.7 ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '6px',
                    background: bm.confidence < 0.7 ? '#FEF2F2' : '#FFFBEB',
                    border: bm.confidence < 0.7 ? '1px solid #FECACA' : '1px solid #FDE68A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <AlertTriangle size={16} color={bm.confidence < 0.7 ? '#DC2626' : '#D97706'} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#334155', fontSize: '0.875rem' }}>
                        {bm.canonicalName}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        ({doc.title} &bull; {doc.labName})
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                      Raw OCR string: <code style={{ color: '#334155', background: '#FFFFFF', padding: '0.1rem 0.3rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>&quot;{bm.provenance.snippet.slice(0, 45)}...&quot;</code>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155' }}>
                      {bm.rawValue} {bm.unit}
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      color: bm.confidence < 0.7 ? '#DC2626' : '#64748B',
                    }}>
                      Confidence: {(bm.confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenVerification(bm)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                  >
                    <FileEdit size={13} />
                    Inspect &amp; Verify
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
