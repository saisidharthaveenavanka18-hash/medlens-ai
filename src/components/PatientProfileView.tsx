import React, { useState } from 'react';
import { 
  User, 
  Edit3, 
  Activity, 
  Pill, 
  AlertTriangle, 
  FileText, 
  Search, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  X, 
  Users, 
  Clock, 
  FlaskConical, 
  UploadCloud,
  ChevronRight,
  Eye,
  Check,
  ShieldAlert,
  HeartPulse,
  Sparkles,
  MessageSquare,
  HelpCircle,
  Info
} from 'lucide-react';
import { PatientRecord, ManagedDocument, DocumentMeta, BiomarkerRecord, PatientConflict } from '../types';
import { SourceBadge } from './SourceBadge';

interface PatientProfileViewProps {
  patient: PatientRecord | null;
  allPatients?: PatientRecord[];
  documents?: ManagedDocument[];
  labDocuments?: DocumentMeta[];
  onSelectPatient?: (patientId: string) => void;
  onAddPatient?: () => void;
  onDeletePatient?: (patientId: string) => Promise<void>;
  onEdit: () => void;
  onOpenUpload?: () => void;
  onViewReport?: (reportId: string) => void;
  onResolveConflict?: (conflictId: string, choice: 'user' | 'document') => void;
  onOpenAskMedLens?: () => void;
  saveSuccessNotification?: boolean;
}

const biomarkerGlossary: Record<string, string> = {
  'fasting blood glucose': 'Measures blood sugar level after an overnight fast. It helps evaluate how your body processes glucose.',
  'blood glucose': 'Measures the concentration of glucose (sugar) present in the bloodstream.',
  'glucose': 'Measures blood sugar levels to help evaluate glucose metabolism.',
  'hemoglobin a1c': 'Reflects average blood sugar levels over the past 2 to 3 months by measuring glycated hemoglobin.',
  'hba1c': 'Reflects average blood sugar levels over the past 2 to 3 months.',
  'serum creatinine': 'A waste product produced by muscles that healthy kidneys filter out. It helps assess kidney function.',
  'creatinine': 'A waste product from normal muscle activity filtered by the kidneys to evaluate renal function.',
  'total cholesterol': 'Measures the overall amount of cholesterol in the blood, including LDL and HDL.',
  'ldl cholesterol': 'Often called "bad" cholesterol because elevated levels can build up in arterial walls.',
  'hdl cholesterol': 'Often called "good" cholesterol because it helps transport cholesterol away from arteries.',
  'triglycerides': 'A common type of fat stored in the body that circulates in the bloodstream.',
  'thyroid stimulating hormone': 'Produced by the pituitary gland to regulate the thyroid gland and metabolism.',
  'tsh': 'Produced by the pituitary gland to stimulate thyroid hormone production and regulate metabolism.',
  'hemoglobin': 'The iron-rich protein in red blood cells that carries oxygen from the lungs throughout the body.',
  'white blood cell count': 'Measures immune cells that help protect the body against infections and inflammation.',
  'wbc': 'Measures circulating immune cells that respond to infections.',
  'platelet count': 'Measures blood cell fragments that help the blood clot and prevent bleeding.',
  'blood urea nitrogen': 'Measures the amount of urea nitrogen in the blood to evaluate kidney and liver function.',
  'bun': 'A waste product filtered by the kidneys, used to evaluate kidney performance.',
};

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patient,
  allPatients = [],
  documents = [],
  labDocuments = [],
  onSelectPatient,
  onAddPatient,
  onDeletePatient,
  onEdit,
  onOpenUpload,
  onViewReport,
  onResolveConflict,
  onOpenAskMedLens,
  saveSuccessNotification = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [explainingBiomarker, setExplainingBiomarker] = useState<BiomarkerRecord | null>(null);

  const filteredPatients = allPatients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete patient "${name}"? All linked records and documents will be permanently removed.`)) {
      setDeletingId(id);
      try {
        if (onDeletePatient) {
          await onDeletePatient(id);
        }
      } finally {
        setDeletingId(null);
      }
    }
  };

  // STRICT PATIENT ISOLATION: Only reports and lab documents belonging to this patient
  const patientDocs = patient 
    ? documents.filter((d) => d.patientId === patient.id) 
    : [];

  const patientLabDocs = patient 
    ? labDocuments.filter((d) => d.patientIdentifier === patient.id) 
    : [];
  
  // Aggregate biomarkers strictly belonging to this patient
  const allBiomarkers = patientLabDocs.flatMap((d) => d.biomarkers);
  const outOfRangeBiomarkers = allBiomarkers.filter(
    (b) => b.status === 'CRITICAL' || b.status === 'HIGH' || b.status === 'LOW'
  );

  // Latest report date if available, else registration date
  const latestReportDate = patientLabDocs.length > 0 && patientLabDocs[0].reportDate
    ? patientLabDocs[0].reportDate
    : (patient ? new Date(patient.createdAt).toLocaleDateString() : 'Not available in the provided information.');

  // Missing or unclear items
  const missingItems: string[] = [];
  if (!patient) {
    missingItems.push('Patient demographics: Not available in the provided information.');
  } else {
    if (!patient.bloodGroup) {
      missingItems.push('Blood group: Not available in the uploaded document.');
    }
    if (!patient.allergies || patient.allergies.length === 0) {
      missingItems.push('Allergies: Not available in the provided information.');
    }
    if (!patient.medications || patient.medications.length === 0) {
      missingItems.push('Current medications: Not available in the provided information.');
    }
    if (!patient.conditions || patient.conditions.length === 0) {
      missingItems.push('Existing conditions: Not available in the provided information.');
    }
    if (!patient.symptoms || patient.symptoms.length === 0) {
      missingItems.push('Symptoms: Not available in the provided information.');
    }
  }
  if (patientLabDocs.length === 0) {
    missingItems.push('Laboratory results: Not available in the uploaded document.');
  } else {
    patientLabDocs.forEach((doc) => {
      const missingRanges = doc.biomarkers.filter((b) => b.referenceRange?.isMissingInReport);
      if (missingRanges.length > 0) {
        missingItems.push(`Reference range for ${missingRanges.map(b => b.canonicalName).join(', ')} in ${doc.title}: Not available in the uploaded record.`);
      }
    });
  }

  // 1. EMPTY STATE: When there are no patients
  if (allPatients.length === 0 && !patient) {
    return (
      <div className="empty-state-box" style={{ padding: '4rem 2rem' }}>
        <div className="empty-state-icon" style={{ width: 56, height: 56 }}>
          <UserPlus size={26} />
        </div>
        <h2 className="empty-state-title" style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>
          No patients yet.
        </h2>
        <p className="empty-state-desc" style={{ fontSize: '0.9375rem', marginBottom: '1.75rem' }}>
          Add your first patient to begin.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onAddPatient && (
            <button onClick={onAddPatient} className="btn btn-primary btn-prominent">
              <UserPlus size={18} />
              + Add Patient
            </button>
          )}
          {onOpenUpload && (
            <button onClick={onOpenUpload} className="btn btn-teal">
              <UploadCloud size={18} />
              Upload Medical Document
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Patient Directory Strip */}
      <div className="card" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Users size={18} color="#0284C7" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Patients ({allPatients.length})
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '0.35rem 0.65rem',
              gap: '0.4rem',
              width: '220px',
            }}>
              <Search size={14} color="#64748B" />
              <input
                type="text"
                placeholder="Search patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.8125rem',
                  color: '#334155',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {onAddPatient && (
              <button
                onClick={onAddPatient}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.8125rem' }}
              >
                <UserPlus size={14} />
                + Add Patient
              </button>
            )}
          </div>
        </div>

        {allPatients.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9' }}>
            {filteredPatients.map((p) => {
              const isSelected = patient?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPatient && onSelectPatient(p.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    border: isSelected ? '1.5px solid #0284C7' : '1px solid #E2E8F0',
                    background: isSelected ? '#F0F9FF' : '#FFFFFF',
                    color: isSelected ? '#0369A1' : '#334155',
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <User size={13} color={isSelected ? '#0284C7' : '#64748B'} />
                  <span>{p.name}</span>
                  <span style={{ fontSize: '0.725rem', color: '#94A3B8' }}>({p.age}Y)</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Success Confirmation Banner */}
      {saveSuccessNotification && (
        <div style={{
          background: '#F0FDF4',
          border: '1.5px solid #86EFAC',
          borderRadius: '8px',
          padding: '0.85rem 1.25rem',
          color: '#15803D',
          fontSize: '0.9rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <CheckCircle2 size={18} color="#16A34A" />
          <span>Patient information saved successfully.</span>
        </div>
      )}

      {/* CONFLICT RESOLUTION BANNER (When User Input & Document Extraction Differ) */}
      {patient?.conflicts && patient.conflicts.length > 0 && (
        <div className="card" style={{
          background: '#FFFBEB',
          border: '1.5px solid #FCD34D',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400E', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={18} color="#D97706" />
            <span>Different information was found between the existing record and uploaded document. Please review.</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#78350F', margin: '0 0 0.85rem 0' }}>
            MedLens does not silently overwrite information. Choose which value to retain in the patient's record:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {patient.conflicts.map((c) => (
              <div key={c.id} style={{
                background: '#FFFFFF',
                border: '1px solid #FDE68A',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}>
                <div>
                  <strong style={{ color: '#0F172A', fontSize: '0.875rem' }}>Field: {c.field}</strong>
                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.2rem' }}>
                    Entered by user: <strong style={{ color: '#166534' }}>{c.userValue}</strong> &bull; Extracted from document ({c.sourceDocName}): <strong style={{ color: '#1E40AF' }}>{c.documentValue}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => onResolveConflict && onResolveConflict(c.id, 'user')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Keep User Record ({c.userValue})
                  </button>
                  <button
                    onClick={() => onResolveConflict && onResolveConflict(c.id, 'document')}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Accept Document Record ({c.documentValue})
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory Safety Notice */}
      <div className="ai-disclaimer-notice" style={{ margin: 0 }}>
        <ShieldAlert size={18} color="#B45309" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ display: 'block', fontSize: '0.8125rem', color: '#78350F' }}>
            AI-assisted information. Verify important details against the original record and consult a qualified healthcare professional for clinical decisions.
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#92400E' }}>
            MedLens provides information organization and summarization. It does not diagnose, prescribe, or replace healthcare professionals.
          </span>
        </div>
      </div>

      {!patient ? (
        <div className="empty-state-box">
          <div className="empty-state-icon">
            <User size={24} />
          </div>
          <h3 className="empty-state-title">Select a Patient</h3>
          <p className="empty-state-desc">
            Please choose a patient from the list above or add a new patient to view their structured record.
          </p>
        </div>
      ) : (
        <>
          {/* ================================================== */}
          {/* 1. PATIENT OVERVIEW                                */}
          {/* ================================================== */}
          <section className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={20} color="#0284C7" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  PATIENT OVERVIEW
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                {onOpenUpload && (
                  <button
                    onClick={onOpenUpload}
                    className="btn btn-teal btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8125rem' }}
                  >
                    <UploadCloud size={15} />
                    <span>Upload Document</span>
                  </button>
                )}

                <button
                  onClick={onEdit}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.8125rem' }}
                >
                  <Edit3 size={14} />
                  <span>Edit</span>
                </button>

                {onDeletePatient && (
                  <button
                    onClick={() => handleDelete(patient.id, patient.name)}
                    disabled={deletingId === patient.id}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                    title="Delete Patient Record"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Name</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.15rem' }}>
                  {patient.name}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Age</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.15rem' }}>
                  {patient.age} years
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Sex</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.15rem' }}>
                  {patient.sex}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Report Date</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.15rem' }}>
                  {latestReportDate}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Blood Group</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: patient.bloodGroup ? '#0F172A' : '#64748B', marginTop: '0.15rem' }}>
                  {patient.bloodGroup || 'Not available in the provided information.'}
                </div>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* 2. IMPORTANT INFORMATION & OBSERVATIONS            */}
          {/* ================================================== */}
          <section className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartPulse size={20} color="#DC2626" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  IMPORTANT INFORMATION &amp; OBSERVATIONS
                </h2>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>
                Observations are distinguished from clinical diagnoses
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Clinical Observations from documents/labs */}
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Important Observations
                </h3>

                {outOfRangeBiomarkers.length === 0 && (!patient.allergies || patient.allergies.length === 0) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#166534' }}>
                    <CheckCircle2 size={16} color="#166534" />
                    <span>All documented laboratory measurements fall within standard printed intervals; no critical observations found.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {outOfRangeBiomarkers.map((bm) => (
                      <div key={bm.id} style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        background: bm.status === 'CRITICAL' ? '#FEF2F2' : '#FFFBEB',
                        border: `1px solid ${bm.status === 'CRITICAL' ? '#FECACA' : '#FDE68A'}`,
                        fontSize: '0.8125rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <div>
                          <strong style={{ color: bm.status === 'CRITICAL' ? '#991B1B' : '#92400E' }}>
                            • Observation: {bm.canonicalName} is {bm.status} ({bm.rawValue} {bm.unit})
                          </strong>
                          <span style={{ color: '#64748B', marginLeft: '0.4rem' }}>
                            (Ref: {bm.referenceRange?.rawText || 'Reference range not provided in the uploaded report.'})
                          </span>
                        </div>
                        <span className={`badge ${bm.status === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`} style={{ fontSize: '0.7rem' }}>
                          {bm.status}
                        </span>
                      </div>
                    ))}

                    {patient.allergies?.filter(a => a.severity === 'Severe' || a.severity === 'Anaphylactic').map(a => (
                      <div key={a.id} style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        fontSize: '0.8125rem',
                      }}>
                        <strong style={{ color: '#991B1B' }}>
                          • High-Priority Observation: Severe allergy to {a.allergen} ({a.reaction})
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Distinction reminder */}
              <div style={{ fontSize: '0.75rem', color: '#64748B', background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <Info size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: '#0284C7' }} />
                <span>Observations represent measured biomarker findings and documented reactions, distinct from formal clinical diagnoses made by an attending clinician.</span>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* 3. AI-ASSISTED SUMMARY                             */}
          {/* ================================================== */}
          <section className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#0284C7" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  🧠 AI-ASSISTED SUMMARY
                </h2>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0D9488', background: '#F0FDFA', border: '1px solid #99F6E4', padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
                Short &amp; Scannable
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: '#334155' }}>
              
              {/* Bulleted Section 1: Patient Overview */}
              <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A', display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  Patient Overview
                </strong>
                <p style={{ margin: 0, lineHeight: 1.5 }}>
                  {patient.age}-year-old {patient.sex} patient ({patient.name}). 
                  {patientLabDocs.length > 0 
                    ? ` The records contain information from ${patientLabDocs.length} medical document(s) with ${allBiomarkers.length} organized laboratory biomarker assay(s).` 
                    : ' The record reflects information saved during clinical intake.'}
                  {patient.medicalHistory ? ` Medical history on file: "${patient.medicalHistory}".` : ''}
                </p>
              </div>

              {/* Bulleted Section 2: Key Findings */}
              <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A', display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Key Findings
                </strong>
                {outOfRangeBiomarkers.length > 0 || (patient.allergies && patient.allergies.length > 0) || (patient.conditions && patient.conditions.length > 0) ? (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {outOfRangeBiomarkers.map(b => (
                      <li key={b.id}>
                        Measured <strong>{b.canonicalName}</strong> at <strong>{b.rawValue} {b.unit}</strong> (Status: <strong style={{ color: b.status === 'CRITICAL' ? '#DC2626' : '#D97706' }}>{b.status}</strong>).
                      </li>
                    ))}
                    {patient.conditions?.map(c => (
                      <li key={c.id}>
                        Documented condition: <strong>{c.name}</strong> ({c.status}{c.diagnosedYear ? `, ${c.diagnosedYear}` : ''}).
                      </li>
                    ))}
                    {patient.allergies?.map(a => (
                      <li key={a.id}>
                        Allergy to <strong>{a.allergen}</strong> (Reaction: {a.reaction}, Severity: {a.severity}).
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: '#166534' }}>• No acute findings or out-of-range lab results identified in available records.</p>
                )}
              </div>

              {/* Bulleted Section 3: Laboratory Results */}
              <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A', display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Laboratory Results
                </strong>
                {allBiomarkers.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {allBiomarkers.slice(0, 5).map(b => (
                      <li key={b.id}>
                        <strong>{b.canonicalName}</strong>: {b.rawValue} {b.unit} 
                        {b.referenceRange?.rawText ? ` (Reference: ${b.referenceRange.rawText})` : ''}
                      </li>
                    ))}
                    {allBiomarkers.length > 5 && (
                      <li style={{ color: '#64748B' }}>
                        ...and {allBiomarkers.length - 5} additional lab results detailed below.
                      </li>
                    )}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: '#64748B' }}>• Laboratory results: Not available in the uploaded document.</p>
                )}
              </div>

              {/* Bulleted Section 4: Medications */}
              <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A', display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Medications
                </strong>
                {patient.medications && patient.medications.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {patient.medications.map(m => (
                      <li key={m.id}>
                        <strong>{m.name}</strong> — {m.dosage} ({m.frequency}){m.purpose ? ` for ${m.purpose}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: '#64748B' }}>• Medications: Not available in the provided information.</p>
                )}
              </div>

              {/* Bulleted Section 5: Missing Information */}
              <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A', display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Missing Information
                </strong>
                {missingItems.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#64748B' }}>
                    {missingItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: '#166534' }}>• All core variables and reference intervals are completely accounted for in the records.</p>
                )}
              </div>

            </div>
          </section>

          {/* ================================================== */}
          {/* 4. LABORATORY RESULTS                              */}
          {/* ================================================== */}
          <section className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FlaskConical size={20} color="#0D9488" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  LABORATORY RESULTS
                </h2>
              </div>
              <SourceBadge source="AI_EXTRACTED" size="sm" />
            </div>

            {allBiomarkers.length === 0 ? (
              <div className="empty-state-box" style={{ padding: '2rem 1rem', margin: '0 auto' }}>
                <div className="empty-state-icon" style={{ width: 44, height: 44, background: '#F0FDFA', color: '#0D9488', borderColor: '#99F6E4' }}>
                  <FlaskConical size={20} />
                </div>
                <h3 className="empty-state-title" style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>
                  Laboratory results: Not available in the uploaded document.
                </h3>
                <p className="empty-state-desc" style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>
                  Upload a PDF, JPG, or PNG report to extract structured laboratory test measurements.
                </p>
                {onOpenUpload && (
                  <button onClick={onOpenUpload} className="btn btn-teal btn-sm">
                    <UploadCloud size={14} />
                    Upload Document
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Test</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Value</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Unit</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Reference Range</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Source</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBiomarkers.map((bm) => {
                      const parentDoc = patientLabDocs.find(d => d.biomarkers.some(b => b.id === bm.id));
                      const reportDate = parentDoc?.reportDate || latestReportDate;
                      const pageNum = bm.provenance?.page || 1;

                      return (
                        <tr key={bm.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0F172A' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>{bm.canonicalName}</span>
                              <button
                                onClick={() => setExplainingBiomarker(bm)}
                                style={{
                                  border: 'none',
                                  background: '#EFF6FF',
                                  color: '#0284C7',
                                  borderRadius: '4px',
                                  padding: '0.15rem 0.35rem',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                }}
                                title="Learn what this test measures"
                              >
                                What is this?
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0F172A' }}>
                            {bm.rawValue}
                          </td>
                          <td style={{ padding: '0.75rem', color: '#475569' }}>
                            {bm.unit || '—'}
                          </td>
                          <td style={{ padding: '0.75rem', color: '#64748B' }}>
                            {reportDate}
                          </td>
                          <td style={{ padding: '0.75rem', color: bm.referenceRange?.rawText ? '#334155' : '#94A3B8' }}>
                            {/* Rule: Show reference range ONLY if it exists in the uploaded document */}
                            {bm.referenceRange?.rawText || 'Reference range not provided in the uploaded report.'}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span className={`badge ${
                              bm.status === 'NORMAL' ? 'badge-normal' :
                              bm.status === 'CRITICAL' ? 'badge-critical' :
                              bm.status === 'HIGH' ? 'badge-high' : 'badge-unspecified'
                            }`} style={{ fontSize: '0.7rem' }}>
                              {bm.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', color: '#64748B', fontSize: '0.75rem' }}>
                            {parentDoc?.title || 'Lab Report'} — Page {pageNum}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            {onViewReport && parentDoc && (
                              <button
                                onClick={() => onViewReport(parentDoc.id)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                              >
                                <Eye size={12} />
                                View Original Document
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ================================================== */}
          {/* 5. MEDICATIONS                                     */}
          {/* ================================================== */}
          <section className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pill size={20} color="#0D9488" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  MEDICATIONS
                </h2>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {patient.medications?.length || 0} recorded
              </span>
            </div>

            {(!patient.medications || patient.medications.length === 0) ? (
              <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                Medications: Not available in the provided information.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {patient.medications.map((m) => (
                  <div key={m.id} style={{
                    padding: '0.85rem 1rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.4rem',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{m.name}</strong>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0D9488', background: '#F0FDFA', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #99F6E4' }}>
                          {m.dosage}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        Frequency: <strong>{m.frequency}</strong>
                        {m.purpose && <span> &bull; Purpose: {m.purpose}</span>}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <SourceBadge source={m.source === 'DOCUMENT_EXTRACTED' ? 'DOCUMENT_EXTRACTED' : 'USER_PROVIDED'} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ================================================== */}
          {/* 6. CONDITIONS & SYMPTOMS                           */}
          {/* ================================================== */}
          <section className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} color="#0284C7" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  CONDITIONS &amp; SYMPTOMS
                </h2>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Existing Conditions */}
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Conditions
                </h3>
                {(!patient.conditions || patient.conditions.length === 0) ? (
                  <p style={{ color: '#64748B', fontSize: '0.8125rem', margin: 0 }}>
                    Conditions: Not available in the provided information.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.5rem' }}>
                    {patient.conditions.map((c) => (
                      <div key={c.id} style={{
                        padding: '0.65rem 0.85rem',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <div>
                          <strong style={{ color: '#0F172A', fontSize: '0.85rem' }}>{c.name}</strong>
                          <span style={{ fontSize: '0.725rem', color: '#64748B', marginLeft: '0.4rem' }}>
                            ({c.status}{c.diagnosedYear ? `, ${c.diagnosedYear}` : ''})
                          </span>
                        </div>
                        <SourceBadge source={c.source === 'DOCUMENT_EXTRACTED' ? 'DOCUMENT_EXTRACTED' : 'USER_PROVIDED'} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Symptoms */}
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Symptoms
                </h3>
                {(!patient.symptoms || patient.symptoms.length === 0) ? (
                  <p style={{ color: '#64748B', fontSize: '0.8125rem', margin: 0 }}>
                    Symptoms: Not available in the provided information.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {patient.symptoms.map((s) => (
                      <div key={s.id} style={{
                        padding: '0.45rem 0.75rem',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8125rem',
                      }}>
                        <span>
                          <strong>{s.name}</strong> <span style={{ color: '#64748B' }}>({s.severity}{s.duration ? ` • ${s.duration}` : ''})</span>
                        </span>
                        <SourceBadge source={s.source === 'DOCUMENT_EXTRACTED' ? 'DOCUMENT_EXTRACTED' : 'USER_PROVIDED'} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documented Allergies */}
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Allergies
                </h3>
                {(!patient.allergies || patient.allergies.length === 0) ? (
                  <p style={{ color: '#64748B', fontSize: '0.8125rem', margin: 0 }}>
                    Allergies: Not available in the provided information.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.5rem' }}>
                    {patient.allergies.map((a) => (
                      <div key={a.id} style={{
                        padding: '0.65rem 0.85rem',
                        background: a.severity === 'Severe' || a.severity === 'Anaphylactic' ? '#FEF2F2' : '#F8FAFC',
                        border: `1px solid ${a.severity === 'Severe' || a.severity === 'Anaphylactic' ? '#FECACA' : '#E2E8F0'}`,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <div>
                          <strong style={{ color: a.severity === 'Severe' || a.severity === 'Anaphylactic' ? '#991B1B' : '#0F172A', fontSize: '0.85rem' }}>
                            {a.allergen}
                          </strong>
                          <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                            Reaction: {a.reaction} &bull; Severity: {a.severity}
                          </div>
                        </div>
                        <SourceBadge source={a.source === 'DOCUMENT_EXTRACTED' ? 'DOCUMENT_EXTRACTED' : 'USER_PROVIDED'} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* 7. MISSING / UNCLEAR INFORMATION                   */}
          {/* ================================================== */}
          <section className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <HelpCircle size={20} color="#64748B" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                MISSING / UNCLEAR INFORMATION
              </h2>
            </div>

            {missingItems.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} color="#166534" />
                <span>All essential fields, laboratory values, and in-report reference intervals are accounted for.</span>
              </div>
            ) : (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem 1.25rem' }}>
                <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0 0 0.65rem 0', fontWeight: 600 }}>
                  The following variables were not found in the uploaded documents or intake forms (MedLens never invents missing information):
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem', color: '#64748B' }}>
                  {missingItems.map((item, idx) => (
                    <li key={idx} style={{ lineHeight: 1.5 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* ================================================== */}
          {/* 8. SOURCE DOCUMENTS                                */}
          {/* ================================================== */}
          <section className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="#0284C7" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  SOURCE DOCUMENTS ({patientDocs.length})
                </h2>
              </div>
              {onOpenUpload && (
                <button onClick={onOpenUpload} className="btn btn-teal btn-sm" style={{ fontSize: '0.78rem' }}>
                  <UploadCloud size={14} />
                  Upload Document
                </button>
              )}
            </div>

            {patientDocs.length === 0 ? (
              <div className="empty-state-box" style={{ padding: '2rem 1rem', margin: '0 auto' }}>
                <div className="empty-state-icon" style={{ width: 44, height: 44 }}>
                  <FileText size={20} />
                </div>
                <h3 className="empty-state-title" style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>
                  No medical reports uploaded yet.
                </h3>
                <p className="empty-state-desc" style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>
                  Upload a PDF, JPG, or PNG report to compare organized data with original source documents.
                </p>
                {onOpenUpload && (
                  <button onClick={onOpenUpload} className="btn btn-teal btn-sm">
                    <UploadCloud size={14} />
                    Upload Document
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>Document Name</th>
                      <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>Processing Status</th>
                      <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientDocs.map((doc) => (
                      <tr key={doc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0F172A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <FileText size={16} color="#0284C7" />
                            <span>{doc.filename}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#64748B' }}>
                          {new Date(doc.uploadTimestamp).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#334155' }}>
                          {doc.documentCategory}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            fontSize: '0.725rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 4,
                            background: '#F0F9FF',
                            color: '#0369A1',
                            border: '1px solid #BAE6FD',
                            fontWeight: 500,
                          }}>
                            {doc.processingStatus}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          {onViewReport && (
                            <button
                              onClick={() => onViewReport(doc.linkedLabReportId || doc.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            >
                              <Eye size={13} />
                              View Original Document
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ================================================== */}
          {/* 10. ASK MEDLENS CALLOUT                            */}
          {/* ================================================== */}
          <section className="card" style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
            border: '1.5px solid #BAE6FD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284C7',
                border: '1px solid #BAE6FD',
              }}>
                <Sparkles size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0369A1', margin: 0 }}>
                  Have a question about this record?
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#0C4A6E', margin: '0.2rem 0 0' }}>
                  Ask MedLens to summarize the document, list medications, explain extracted labs, or identify missing information.
                </p>
              </div>
            </div>

            {onOpenAskMedLens && (
              <button
                onClick={onOpenAskMedLens}
                className="btn btn-primary"
                style={{ fontSize: '0.875rem', padding: '0.55rem 1.25rem' }}
              >
                <MessageSquare size={16} />
                <span>Ask MedLens</span>
              </button>
            )}
          </section>
        </>
      )}

      {/* "What is this?" Educational Modal */}
      {explainingBiomarker && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem',
        }}>
          <div className="card" style={{
            maxWidth: '500px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FlaskConical size={18} color="#0284C7" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  What is this? — {explainingBiomarker.canonicalName}
                </h3>
              </div>
              <button
                onClick={() => setExplainingBiomarker(null)}
                style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              <p style={{ margin: '0 0 0.75rem 0' }}>
                {biomarkerGlossary[explainingBiomarker.canonicalName.toLowerCase()] ||
                 `The "${explainingBiomarker.canonicalName}" assay is a clinical test recorded in your documentation to measure biological indicators in blood or tissue samples.`}
              </p>
              <div style={{ background: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
                Observed measurement: <strong>{explainingBiomarker.rawValue} {explainingBiomarker.unit}</strong>
                {explainingBiomarker.referenceRange?.rawText && (
                  <div>Reference range in report: {explainingBiomarker.referenceRange.rawText}</div>
                )}
              </div>
            </div>

            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              padding: '0.65rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              marginBottom: '1rem',
            }}>
              <ShieldAlert size={15} color="#D97706" style={{ flexShrink: 0 }} />
              <span>
                This explanation is provided for general health literacy only and is not personalized clinical advice. Consult your doctor for medical decisions.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setExplainingBiomarker(null)}
                className="btn btn-primary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
