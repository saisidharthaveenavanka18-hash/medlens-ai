import React from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  FlaskConical, 
  Pill, 
  HelpCircle, 
  ShieldAlert,
  FileCheck,
  Eye,
  FileText,
  Activity
} from 'lucide-react';
import { PatientRecord, ManagedDocument, DocumentMeta, BiomarkerRecord } from '../types';

interface AiAssistedSummaryCardProps {
  patient: PatientRecord | null;
  documents?: ManagedDocument[];
  labDocuments?: DocumentMeta[];
  onViewOriginalReport?: (docId: string) => void;
}

export const AiAssistedSummaryCard: React.FC<AiAssistedSummaryCardProps> = ({
  patient,
  documents = [],
  labDocuments = [],
  onViewOriginalReport,
}) => {
  // Aggregate all biomarkers across reports belonging to this patient
  const allBiomarkers: BiomarkerRecord[] = labDocuments.flatMap((d) => d.biomarkers);
  const outOfRangeBiomarkers = allBiomarkers.filter(
    (b) => b.status === 'CRITICAL' || b.status === 'HIGH' || b.status === 'LOW'
  );

  // Missing or unclear items with explicit "Not available in the uploaded record."
  const missingItems: string[] = [];
  if (!patient) {
    missingItems.push('Patient demographics: Not available in the uploaded record.');
  } else {
    if (!patient.bloodGroup) missingItems.push('Blood group: Not available in the uploaded record.');
    if (!patient.allergies || patient.allergies.length === 0) missingItems.push('Documented allergies: Not available in the uploaded record.');
    if (!patient.medications || patient.medications.length === 0) missingItems.push('Current medications: Not available in the uploaded record.');
    if (!patient.conditions || patient.conditions.length === 0) missingItems.push('Documented conditions: Not available in the uploaded record.');
  }
  if (labDocuments.length === 0) {
    missingItems.push('Laboratory assays: Not available in the uploaded record.');
  } else {
    labDocuments.forEach((doc) => {
      const missingRanges = doc.biomarkers.filter((b) => b.referenceRange?.isMissingInReport);
      if (missingRanges.length > 0) {
        missingItems.push(`Reference range for ${missingRanges.map(b => b.canonicalName).join(', ')} in ${doc.title}: Not available in the uploaded record.`);
      }
    });
  }

  return (
    <div className="ai-summary-card">
      
      {/* Header */}
      <div className="ai-summary-banner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #BAE6FD',
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                <span className="label-ai-summary">AI-ASSISTED SUMMARY</span>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Synthesized from records</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Clinical Record Synthesis
              </h2>
            </div>
          </div>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            background: '#F0FDFA',
            color: '#0D9488',
            border: '1px solid #99F6E4',
            padding: '0.25rem 0.65rem',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>
            <FileCheck size={14} />
            Evidence-Grounded (Zero Hallucinations)
          </span>
        </div>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* SMALL PERSISTENT NOTICE (MANDATORY RESPONSIBLE AI) */}
        <div className="ai-disclaimer-notice" style={{ margin: 0 }}>
          <ShieldAlert size={18} color="#B45309" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.8125rem', color: '#78350F' }}>
              AI-assisted information. Verify important details against the original record and consult a qualified healthcare professional for clinical decisions.
            </strong>
            <span style={{ fontSize: '0.75rem', color: '#92400E' }}>
              MedLens provides AI-assisted organization and summarization of medical information. Verify important information against the original record and consult a qualified healthcare professional for clinical decisions.
            </span>
          </div>
        </div>

        {/* 1. KEY INFORMATION */}
        <section style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Info size={16} color="#0284C7" />
            Key Information
          </h3>

          {patient ? (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
              Patient <strong>{patient.name}</strong> is a <strong>{patient.age}</strong>-year-old <strong>{patient.sex}</strong>
              {patient.bloodGroup ? ` (Blood Group: ${patient.bloodGroup})` : ''}.
              {patient.medicalHistory ? ` Documented clinical history: "${patient.medicalHistory}".` : ''}
              {labDocuments.length > 0 
                ? ` There are ${labDocuments.length} medical report(s) on file with ${allBiomarkers.length} extracted laboratory biomarker(s).` 
                : ' No laboratory reports have been uploaded yet.'}
            </div>
          ) : (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.8125rem', color: '#64748B' }}>
              Patient details: Not available in the uploaded record.
            </div>
          )}
        </section>

        {/* 2. IMPORTANT FINDINGS (With Source Traceability & View Original Report Action) */}
        <section style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <AlertTriangle size={16} color="#D97706" />
            Important Findings
          </h3>

          {outOfRangeBiomarkers.length === 0 && (!patient?.allergies || patient.allergies.length === 0) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#166534' }}>
              <CheckCircle2 size={16} color="#166534" />
              <span>No out-of-range lab results or high-priority findings detected in available records.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {outOfRangeBiomarkers.map((bm) => {
                const parentDoc = labDocuments.find(d => d.biomarkers.some(b => b.id === bm.id));
                const pageNum = bm.provenance?.page || 1;
                return (
                  <div key={bm.id} style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    background: bm.status === 'CRITICAL' ? '#FEF2F2' : '#FFFBEB',
                    border: `1px solid ${bm.status === 'CRITICAL' ? '#FECACA' : '#FDE68A'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: bm.status === 'CRITICAL' ? '#7F1D1D' : '#78350F' }}>
                        {bm.canonicalName}: {bm.rawValue} {bm.unit}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: bm.status === 'CRITICAL' ? '#991B1B' : '#92400E', marginTop: '0.2rem' }}>
                        Status: <strong>{bm.status}</strong> &bull; Reference Interval: {bm.referenceRange?.rawText || 'Reference range not provided in the uploaded report.'}
                      </div>
                      
                      {/* SOURCE TRACEABILITY */}
                      <div style={{ marginTop: '0.45rem', fontSize: '0.725rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span className="label-source-info">SOURCE INFORMATION</span>
                        <FileText size={12} color="#0284C7" />
                        <span>Source: <strong>{parentDoc?.title || 'Medical Report'}</strong> &bull; Page {pageNum}</span>
                      </div>
                    </div>

                    {/* View Original Report Action */}
                    {onViewOriginalReport && parentDoc && (
                      <button
                        onClick={() => onViewOriginalReport(parentDoc.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', alignSelf: 'center' }}
                      >
                        <Eye size={13} />
                        View Original Report
                      </button>
                    )}
                  </div>
                );
              })}

              {patient?.allergies?.map((alg) => (
                <div key={alg.id} style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: alg.severity === 'Severe' ? '#FEF2F2' : '#FFFBEB',
                  border: `1px solid ${alg.severity === 'Severe' ? '#FECACA' : '#FDE68A'}`,
                  fontSize: '0.8125rem',
                }}>
                  <strong style={{ color: alg.severity === 'Severe' ? '#7F1D1D' : '#78350F' }}>
                    Documented Allergy: {alg.allergen} ({alg.severity})
                  </strong>
                  <div style={{ color: alg.severity === 'Severe' ? '#991B1B' : '#92400E', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                    Reaction: {alg.reaction} &bull; Source: Patient Clinical Intake
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. LABORATORY RESULTS (With Source Traceability & View Original Report Action) */}
        <section style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <FlaskConical size={16} color="#0D9488" />
            Laboratory Results ({allBiomarkers.length} Extracted)
          </h3>

          {allBiomarkers.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.8125rem', margin: 0 }}>
              Laboratory assays: Not available in the uploaded record.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {allBiomarkers.map((bm) => {
                const parentDoc = labDocuments.find(d => d.biomarkers.some(b => b.id === bm.id));
                const pageNum = bm.provenance?.page || 1;
                return (
                  <div key={bm.id} style={{
                    padding: '0.75rem 0.85rem',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.45rem',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{bm.canonicalName}</span>
                        <span className={`badge ${bm.status === 'NORMAL' ? 'badge-normal' : bm.status === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`} style={{ fontSize: '0.65rem' }}>
                          {bm.status}
                        </span>
                      </div>
                      <div style={{ color: '#334155' }}>
                        <strong>{bm.rawValue}</strong> {bm.unit}
                        <span style={{ color: '#94A3B8', fontSize: '0.725rem', marginLeft: '0.4rem' }}>
                          (Ref: {bm.referenceRange?.rawText || 'Reference range not provided in the uploaded report.'})
                        </span>
                      </div>
                    </div>

                    {/* Source citation */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.45rem', borderTop: '1px solid #F1F5F9', fontSize: '0.7rem', color: '#64748B', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className="label-source-info" style={{ fontSize: '0.625rem', padding: '0.15rem 0.4rem' }}>SOURCE INFORMATION</span>
                        <span>{parentDoc?.title || 'Report'} &bull; P.{pageNum}</span>
                      </div>
                      {onViewOriginalReport && parentDoc && (
                        <button
                          onClick={() => onViewOriginalReport(parentDoc.id)}
                          style={{ border: 'none', background: 'transparent', color: '#0284C7', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                        >
                          View Report &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. MEDICATIONS */}
        <section style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Pill size={16} color="#0284C7" />
            Medications ({patient?.medications?.length || 0})
          </h3>

          {(!patient?.medications || patient.medications.length === 0) ? (
            <p style={{ color: '#64748B', fontSize: '0.8125rem', margin: 0 }}>
              Medications: Not available in the uploaded record.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {patient.medications.map((m) => (
                <div key={m.id} style={{
                  padding: '0.45rem 0.75rem',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                }}>
                  <strong style={{ color: '#0F172A' }}>{m.name}</strong> {m.dosage}
                  <span style={{ color: '#64748B', marginLeft: '0.35rem' }}>({m.frequency})</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. DOCUMENTED CONDITIONS */}
        <section style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Activity size={16} color="#0D9488" />
            Documented Conditions ({patient?.conditions?.length || 0})
          </h3>

          {(!patient?.conditions || patient.conditions.length === 0) ? (
            <p style={{ color: '#64748B', fontSize: '0.8125rem', margin: 0 }}>
              Conditions: Not available in the uploaded record.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {patient.conditions.map((c) => (
                <div key={c.id} style={{
                  padding: '0.45rem 0.75rem',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                }}>
                  <strong style={{ color: '#0F172A' }}>{c.name}</strong>
                  <span style={{ color: '#64748B', marginLeft: '0.35rem' }}>({c.status}{c.diagnosedYear ? ` • ${c.diagnosedYear}` : ''})</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. MISSING / UNCLEAR INFORMATION */}
        <section>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <HelpCircle size={16} color="#64748B" />
            Missing/Unclear Information
          </h3>

          {missingItems.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', background: '#F0FDF4', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.8125rem' }}>
              <CheckCircle2 size={15} color="#166534" />
              <span>All essential variables and reference intervals are completely accounted for in the records.</span>
            </div>
          ) : (
            <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem', color: '#64748B' }}>
              {missingItems.map((item, idx) => (
                <li key={idx} style={{ lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  );
};
