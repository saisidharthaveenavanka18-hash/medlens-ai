import React, { useState } from 'react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  History, 
  Camera,
  CheckCircle2
} from 'lucide-react';
import { BiomarkerRecord, VerificationAudit } from '../types';

interface HitlVerificationModalProps {
  biomarker: BiomarkerRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveVerification: (updatedBiomarker: BiomarkerRecord, auditEntry: VerificationAudit) => void;
}

export const HitlVerificationModal: React.FC<HitlVerificationModalProps> = ({
  biomarker,
  isOpen,
  onClose,
  onSaveVerification,
}) => {
  if (!isOpen || !biomarker) return null;

  const [editValue, setEditValue] = useState(biomarker.rawValue);
  const [editUnit, setEditUnit] = useState(biomarker.unit);
  const [editLower, setEditLower] = useState(biomarker.referenceRange.lower?.toString() || '');
  const [editUpper, setEditUpper] = useState(biomarker.referenceRange.upper?.toString() || '');
  const [reasonCode, setReasonCode] = useState('VERIFIED_PRINTED_MATCH');
  const [auditorNotes, setAuditorNotes] = useState('');

  const isLowConfidence = biomarker.confidence < 0.7;

  const handleConfirmAsIs = () => {
    const auditEntry: VerificationAudit = {
      id: `aud-${Date.now()}`,
      biomarkerId: biomarker.id,
      verifiedBy: 'Clinician Auditor (Active Session)',
      previousValue: biomarker.rawValue,
      correctedValue: biomarker.rawValue,
      timestamp: new Date().toISOString(),
      status: 'VERIFIED_UNCHANGED',
      notes: auditorNotes || 'Human clinician confirmed OCR extraction directly against document patch.',
    };

    const updated: BiomarkerRecord = {
      ...biomarker,
      verificationStatus: 'VERIFIED',
      auditHistory: [auditEntry, ...biomarker.auditHistory],
    };

    onSaveVerification(updated, auditEntry);
    onClose();
  };

  const handleSaveCorrection = () => {
    const parsedNum = parseFloat(editValue);
    const auditEntry: VerificationAudit = {
      id: `aud-${Date.now()}`,
      biomarkerId: biomarker.id,
      verifiedBy: 'Clinician Auditor (Active Session)',
      previousValue: biomarker.rawValue,
      correctedValue: editValue,
      timestamp: new Date().toISOString(),
      status: 'CORRECTED_MANUALLY',
      notes: auditorNotes ? `Reason: ${reasonCode}. ${auditorNotes}` : `Reason: ${reasonCode}`,
    };

    const updated: BiomarkerRecord = {
      ...biomarker,
      rawValue: editValue,
      numericValue: isNaN(parsedNum) ? null : parsedNum,
      unit: editUnit,
      verificationStatus: 'CORRECTED',
      confidence: 1.0, // Human verified
      referenceRange: {
        ...biomarker.referenceRange,
        lower: editLower ? parseFloat(editLower) : null,
        upper: editUpper ? parseFloat(editUpper) : null,
        rawText: `${editLower || '0'} - ${editUpper || '100'}`,
      },
      auditHistory: [auditEntry, ...biomarker.auditHistory],
    };

    onSaveVerification(updated, auditEntry);
    onClose();
  };

  const inputStyle = {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '0.45rem 0.65rem',
    color: '#334155',
    fontSize: '0.8125rem',
    outline: 'none',
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
        maxWidth: '720px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '12px',
        maxHeight: '90vh',
        overflowY: 'auto',
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
            <ShieldCheck size={20} color="#1E40AF" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
                Human-in-the-Loop (HITL) Clinical Verification
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#1E40AF', margin: 0 }}>
                Inspect source crop, verify OCR tokens, and maintain an audit log
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Cropped Source Patch Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Camera size={14} color="#3B82F6" />
                Visual Document Crop (BBox: {biomarker.provenance.bbox.join(', ')})
              </span>
              <span className={isLowConfidence ? "badge badge-critical" : "badge badge-verified"}>
                Confidence: {(biomarker.confidence * 100).toFixed(1)}%
              </span>
            </div>

            {/* High-contrast paper crop simulation */}
            <div style={{
              background: biomarker.confidence < 0.7 ? '#FEF2F2' : '#F8FAFC',
              border: isLowConfidence ? '1px solid #FECACA' : '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '0.875rem 1.15rem',
              color: '#334155',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              fontWeight: 600,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{biomarker.rawLabel}</span>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: isLowConfidence ? '#991B1B' : '#1E40AF',
                  background: isLowConfidence ? '#FEE2E2' : '#DBEAFE',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                }}>
                  {biomarker.rawValue}
                </span>
                <span>{biomarker.unit}</span>
                <span>{biomarker.referenceRange.rawText}</span>
              </div>
            </div>
            {isLowConfidence && (
              <p style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertTriangle size={13} />
                Potential scan smudge detected. Please verify numerical digits and unit against paper report.
              </p>
            )}
          </div>

          {/* Form Controls for Correction */}
          <div style={{
            background: '#F8FAFC',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
          }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', margin: '0 0 0.75rem 0' }}>
              Audited Result Verification
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', marginBottom: '0.25rem' }}>
                  Result Value
                </label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', marginBottom: '0.25rem' }}>
                  Units
                </label>
                <input
                  type="text"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', marginBottom: '0.25rem' }}>
                  Verification Reason
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  style={inputStyle}
                >
                  <option value="VERIFIED_PRINTED_MATCH">Confirmed Matching Paper</option>
                  <option value="CORRECTED_DECIMAL_SMUDGE">Corrected Decimal Smudge</option>
                  <option value="FIXED_DIGIT_MISREAD">Fixed Digit Misread</option>
                  <option value="UPDATED_UNIT">Standardized Lab Unit</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', marginBottom: '0.25rem' }}>
                Clinician Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cross-referenced with patient lab accession..."
                value={auditorNotes}
                onChange={(e) => setAuditorNotes(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Audit History Log */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem', color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>
              <History size={13} />
              <span>Immutable Verification Audit History</span>
            </div>

            <div style={{
              background: '#F8FAFC',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              fontSize: '0.72rem',
            }}>
              {biomarker.auditHistory.length === 0 ? (
                <div style={{ padding: '0.65rem', color: '#94A3B8', textAlign: 'center' }}>
                  No prior human edits recorded. Initial OCR extraction.
                </div>
              ) : (
                biomarker.auditHistory.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1.5fr 2fr',
                      padding: '0.45rem 0.65rem',
                      borderBottom: '1px solid #E2E8F0',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ color: '#334155', fontWeight: 500 }}>{entry.verifiedBy}</div>
                    <div style={{ color: '#1E40AF', fontFamily: 'monospace' }}>
                      {entry.previousValue} &rarr; {entry.correctedValue}
                    </div>
                    <div style={{ color: '#64748B' }}>
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                    <div style={{ color: '#64748B' }}>
                      {entry.notes || entry.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{
          padding: '0.875rem 1.25rem',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC',
        }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem' }}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button
              onClick={handleConfirmAsIs}
              className="btn btn-secondary"
              style={{
                fontSize: '0.8125rem',
                padding: '0.4rem 0.8rem',
                color: '#166534',
                borderColor: '#BBF7D0',
                background: '#F0FDF4',
              }}
            >
              <CheckCircle2 size={14} />
              Confirm As-Is (Verified)
            </button>

            <button
              onClick={handleSaveCorrection}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}
            >
              <Check size={14} />
              Save Audited Correction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
