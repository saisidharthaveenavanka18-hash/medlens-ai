import React, { useState } from 'react';
import { 
  FolderArchive, 
  FlaskConical, 
  AlertTriangle, 
  UserPlus, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  FileText, 
  FileCheck, 
  Sparkles, 
  Users,
  Info,
  Check
} from 'lucide-react';
import { NavigationTab, PatientRecord, ManagedDocument } from '../types';
import { ExtractedLabRecord } from '../services/extractor';
import { PotentialConflict, detectPotentialConflicts } from '../services/conflicts';
import { generateSafeAiSummary } from '../services/summary';

interface DashboardViewProps {
  patient: PatientRecord | null;
  patientCount: number;
  documents: ManagedDocument[];
  records: ExtractedLabRecord[];
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenUpload: () => void;
  onAddPatient: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patient,
  patientCount,
  documents,
  records,
  onNavigateTab,
  onOpenUpload,
  onAddPatient,
}) => {
  const [resolvedConflicts, setResolvedConflicts] = useState<Record<string, boolean>>({});

  const conflicts = detectPotentialConflicts(patient, documents);
  const activeConflictsCount = conflicts.filter((c) => !resolvedConflicts[c.id]).length;

  const safeSummary = generateSafeAiSummary(records, documents, patient);
  const needsReviewCount = records.filter((r) => !r.isHumanVerified || r.confidence < 0.7).length;

  const handleResolveConflict = (conflictId: string) => {
    setResolvedConflicts((prev) => ({ ...prev, [conflictId]: true }));
  };

  // Dynamically compute real activity from actual records
  const realActivity: { id: string; title: string; time: string; icon: React.ReactNode }[] = [];
  if (patient) {
    realActivity.push({
      id: 'act-patient',
      title: `Patient record active: ${patient.name}`,
      time: 'Current Session',
      icon: <UserPlus size={14} color="#2563EB" />,
    });
  }
  documents.slice(0, 3).forEach((doc, idx) => {
    realActivity.push({
      id: `act-doc-${doc.id || idx}`,
      title: `Report Ingested: ${doc.filename}`,
      time: new Date(doc.uploadTimestamp).toLocaleDateString(),
      icon: <FileText size={14} color="#3B82F6" />,
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1240px', margin: '0 auto' }}>
      
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
              Clinical Dashboard
            </h2>
            {patient && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#1E40AF',
                background: '#DBEAFE',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
              }}>
                Active Patient: {patient.name} ({patient.age}Y / {patient.sex})
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#1E40AF', margin: '0.2rem 0 0' }}>
            Overview of ingested medical records, structured lab tests, verification alerts, and potential conflicts
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button
            onClick={onAddPatient}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
          >
            <UserPlus size={14} />
            + Add Patient
          </button>

          {patient && (
            <>
              <button
                onClick={onOpenUpload}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
              >
                <UploadCloud size={14} />
                Upload Document
              </button>

              <button
                onClick={() => onNavigateTab('workflow')}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
              >
                <CheckCircle2 size={14} />
                Review Information
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Metrics Cards - Factual Non-Fabricated Values */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* Metric 0: Patients */}
        <div 
          onClick={() => onNavigateTab('patient-intake')}
          className="card" 
          style={{ padding: '1.15rem', cursor: 'pointer', transition: 'transform 0.1s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Patients
            </span>
            <div style={{ width: 32, height: 32, borderRadius: '6px', background: '#F8FAFC', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#334155' }}>
            {patientCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            Registered patients on file
          </div>
        </div>

        {/* Metric 1: Documents */}
        <div 
          onClick={() => onNavigateTab('document-manager')}
          className="card" 
          style={{ padding: '1.15rem', cursor: 'pointer', transition: 'transform 0.1s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Documents
            </span>
            <div style={{ width: 32, height: 32, borderRadius: '6px', background: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderArchive size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#334155' }}>
            {documents.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            Ingested medical records in vault
          </div>
        </div>

        {/* Metric 2: Lab Results */}
        <div 
          onClick={() => onNavigateTab('workflow')}
          className="card" 
          style={{ padding: '1.15rem', cursor: 'pointer', transition: 'transform 0.1s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Results
            </span>
            <div style={{ width: 32, height: 32, borderRadius: '6px', background: '#F0FDF4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#334155' }}>
            {records.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            Structured extracted measurements
          </div>
        </div>

        {/* Metric 3: Needs Review */}
        <div 
          onClick={() => onNavigateTab('hitl-queue')}
          className="card" 
          style={{ padding: '1.15rem', cursor: 'pointer', transition: 'transform 0.1s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Needs Review
            </span>
            <div style={{ width: 32, height: 32, borderRadius: '6px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#92400E' }}>
            {needsReviewCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            Awaiting clinician verification
          </div>
        </div>
      </div>

      {/* When no patient exists, show required clean empty state */}
      {!patient ? (
        <div className="card" style={{
          padding: '3.5rem 1.5rem',
          textAlign: 'center',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem',
          }}>
            <UserPlus size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1E293B', margin: 0 }}>
            No patients yet
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '420px', margin: '0 0 1rem 0' }}>
            Add a patient to begin organizing medical information.
          </p>
          <button
            onClick={onAddPatient}
            className="btn btn-primary"
            style={{ fontSize: '0.875rem', padding: '0.55rem 1.25rem' }}
          >
            <UserPlus size={16} />
            + Add Patient
          </button>
        </div>
      ) : (
        <>
          {/* Conflict Section */}
          {activeConflictsCount > 0 && (
            <div className="card" style={{ padding: '1.25rem', border: '1px solid #FDE68A', background: '#FFFDF5' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} color="#D97706" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#92400E', margin: 0 }}>
                    &ldquo;&Delta; Potential Conflict Detected&rdquo;
                  </h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 500 }}>
                  {activeConflictsCount} Discrepancy Alert(s)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {conflicts.filter((c) => !resolvedConflicts[c.id]).map((conflict) => (
                  <div
                    key={conflict.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #FDE68A',
                      borderRadius: '8px',
                      padding: '0.875rem 1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400E' }}>
                        {conflict.title}
                      </span>
                      <button
                        onClick={() => handleResolveConflict(conflict.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                      >
                        <Check size={12} />
                        Mark Acknowledged
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>{conflict.sourceA.label}:</span>
                        <strong style={{ fontSize: '0.8125rem', color: '#334155', display: 'block' }}>{conflict.sourceA.value}</strong>
                        <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Source: {conflict.sourceA.sourceName}</span>
                      </div>

                      <div style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>{conflict.sourceB.label}:</span>
                        <strong style={{ fontSize: '0.8125rem', color: '#334155', display: 'block' }}>{conflict.sourceB.value}</strong>
                        <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Source: {conflict.sourceB.sourceName}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#92400E', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Info size={13} />
                      <span>&ldquo;{conflict.instruction}&rdquo;</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid: Safe AI Summary + Recent Documents & Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            
            {/* Safe AI Summary Card */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.625rem' }}>
                  <Sparkles size={17} color="#3B82F6" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                    Safe AI Summary (Structured Evidence-Only)
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
                  <p style={{ margin: 0 }}>
                    {safeSummary.summaryText}
                  </p>

                  {safeSummary.outsideRangeTests.length > 0 && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.65rem 0.75rem', marginTop: '0.25rem' }}>
                      <strong style={{ fontSize: '0.75rem', color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                        Tests Outside Printed Reference Ranges:
                      </strong>
                      <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                        {safeSummary.outsideRangeTests.map((t, idx) => (
                          <li key={idx}>
                            <strong>{t.testName}</strong>: {t.value} {t.unit} (Printed Ref: {t.range}) &bull; <span style={{ color: t.status === 'HIGH' ? '#92400E' : '#1E40AF' }}>{t.status}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                marginTop: '1rem',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '6px',
                padding: '0.55rem 0.75rem',
                fontSize: '0.72rem',
                color: '#1E40AF',
              }}>
                <strong>Mandatory Safety Notice:</strong> &ldquo;{safeSummary.disclaimer}&rdquo;
              </div>
            </div>

            {/* Right Column: Recent Documents + Recent Activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Recent Documents Card */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FileText size={16} color="#3B82F6" />
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                      Recent Documents
                    </h4>
                  </div>
                  <button
                    onClick={() => onNavigateTab('document-manager')}
                    style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    View Vault &rarr;
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {documents.length === 0 ? (
                    <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0.5rem 0' }}>
                      No medical documents ingested yet. Upload a report to begin.
                    </p>
                  ) : (
                    documents.slice(0, 3).map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileCheck size={14} color="#3B82F6" />
                          <div>
                            <strong style={{ color: '#334155' }}>{doc.filename}</strong>
                            <span style={{ color: '#64748B', marginLeft: '0.35rem', fontSize: '0.72rem' }}>
                              ({doc.documentCategory})
                            </span>
                          </div>
                        </div>
                        <span className="badge badge-normal" style={{ fontSize: '0.65rem' }}>
                          {doc.verificationStatus}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                  <Clock size={16} color="#3B82F6" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                    Recent Activity
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {realActivity.length === 0 ? (
                    <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0.5rem 0' }}>
                      No recent activity recorded yet.
                    </p>
                  ) : (
                    realActivity.map((act) => (
                      <div
                        key={act.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          padding: '0.35rem 0',
                          borderBottom: '1px solid #F8FAFC',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {act.icon}
                          <span style={{ color: '#334155' }}>{act.title}</span>
                        </div>
                        <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>{act.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
};
