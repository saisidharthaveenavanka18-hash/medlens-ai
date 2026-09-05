import React from 'react';
import { 
  UserPlus, 
  UploadCloud, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  ArrowRight,
  ShieldCheck,
  Activity,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { NavigationTab, PatientRecord, ManagedDocument, DocumentMeta } from '../types';
import { detectPotentialConflicts } from '../services/conflicts';

interface DashboardViewProps {
  patient: PatientRecord | null;
  allPatients?: PatientRecord[];
  patientCount: number;
  documents: ManagedDocument[];
  labDocuments?: DocumentMeta[];
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenUpload: () => void;
  onAddPatient: () => void;
  onSelectPatient?: (patient: PatientRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patient,
  allPatients = [],
  documents = [],
  labDocuments = [],
  onNavigateTab,
  onOpenUpload,
  onAddPatient,
  onSelectPatient,
}) => {
  // Real data calculations - Zero fake numbers
  const recentPatients = allPatients.slice(0, 5);
  const recentReports = documents.slice(0, 5);

  // Reports awaiting human review
  const reportsAwaitingReview = documents.filter(
    (d) => d.verificationStatus === 'Needs Verification' || d.verificationStatus === 'Pending'
  );

  // Derive genuine clinical observations from actual patient data & lab documents
  const observations: { id: string; title: string; subtitle: string; severity: 'high' | 'warning' | 'info'; date?: string }[] = [];

  // Out-of-range biomarkers from uploaded lab documents
  labDocuments.forEach((doc) => {
    doc.biomarkers.forEach((bm) => {
      if (bm.status === 'CRITICAL' || bm.status === 'HIGH' || bm.status === 'LOW') {
        observations.push({
          id: `bm-${bm.id}`,
          title: `${bm.canonicalName}: ${bm.rawValue} ${bm.unit} (${bm.status})`,
          subtitle: `Reference: ${bm.referenceRange?.rawText || 'Standard'} • Report: ${doc.title}`,
          severity: bm.status === 'CRITICAL' ? 'high' : 'warning',
          date: doc.reportDate,
        });
      }
    });
  });

  // Patient drug & condition alerts
  if (patient) {
    if (patient.allergies && patient.allergies.length > 0) {
      patient.allergies.forEach((alg) => {
        observations.push({
          id: `alg-${alg.id}`,
          title: `Documented Allergy: ${alg.allergen} (${alg.severity})`,
          subtitle: `Reaction: ${alg.reaction} • Patient: ${patient.name}`,
          severity: alg.severity === 'Severe' ? 'high' : 'warning',
        });
      });
    }

    // Check potential conflicts
    const conflicts = detectPotentialConflicts(patient, documents);
    conflicts.forEach((cf) => {
      observations.push({
        id: `conf-${cf.id}`,
        title: `Clinical Cross-Reference: ${cf.title}`,
        subtitle: cf.instruction,
        severity: cf.category === 'ALLERGY' ? 'high' : 'warning',
      });
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Hero Welcome Card: Trustworthy, Clean Healthcare Style */}
      <section 
        className="card" 
        style={{
          padding: '2.25rem 2rem',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: '1px solid #E2E8F0',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ maxWidth: '780px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.2rem 0.65rem', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '20px', color: '#0369A1', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.85rem' }}>
            <Activity size={14} />
            Clinical Information Intelligence
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            MedLens
          </h1>
          
          <p style={{ fontSize: '1.125rem', color: 'var(--text-body)', fontWeight: 500, lineHeight: 1.45, marginBottom: '0.75rem' }}>
            Organize medical information and review it intelligently.
          </p>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.5rem', maxWidth: '640px' }}>
            MedLens unifies clinical reports, structures laboratory biomarkers with exact report provenance, and assists clinicians and patients in safe record review.
          </p>

          <p style={{ fontSize: '0.95rem', color: '#0369A1', fontWeight: 600, marginBottom: '1.25rem' }}>
            Start by adding a patient or uploading a medical report.
          </p>

          {/* 3-Step Instant Onboarding Guide for First Impression */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '1.75rem',
            padding: '0.65rem 0.95rem',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            color: '#475569',
          }}>
            <span style={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={14} color="#0284C7" /> Getting Started:
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#0284C7', color: '#fff', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</span>
              Add Patient
            </span>
            <ArrowRight size={12} color="#94A3B8" />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#0D9488', color: '#fff', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</span>
              Upload Report
            </span>
            <ArrowRight size={12} color="#94A3B8" />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#6366F1', color: '#fff', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</span>
              AI Summary &amp; Q&amp;A
            </span>
          </div>
        </div>

        {/* Visually Dominant Primary Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <button
            id="btn-add-patient-primary"
            onClick={onAddPatient}
            className="btn btn-primary btn-prominent"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem' }}
          >
            <UserPlus size={19} />
            <span>+ Add Patient</span>
          </button>

          <button
            id="btn-upload-report-primary"
            onClick={onOpenUpload}
            className="btn btn-teal btn-prominent"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem' }}
          >
            <UploadCloud size={19} />
            <span>Upload Medical Report</span>
          </button>

          {patient && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              background: '#F1F5F9',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #CBD5E1',
              fontSize: '0.8125rem',
              color: '#334155',
            }}>
              <Users size={15} color="#0284C7" />
              <span>Active Patient: <strong>{patient.name}</strong> ({patient.age}Y &bull; {patient.sex}{patient.bloodGroup ? ` &bull; Blood Group ${patient.bloodGroup}` : ''})</span>
            </div>
          )}
        </div>
      </section>

      {/* 4 Useful Real-Data Sections Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Section 1: Recent Patients */}
        <section className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <Users size={18} color="#0284C7" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Recent Patients
              </h2>
            </div>
            <button 
              onClick={() => onNavigateTab('patients')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
            >
              View All ({allPatients.length})
            </button>
          </div>

          {recentPatients.length === 0 ? (
            <div className="empty-state-box" style={{ padding: '2.5rem 1rem', margin: 'auto 0' }}>
              <div className="empty-state-icon" style={{ width: 48, height: 48, borderRadius: 12 }}>
                <UserPlus size={22} />
              </div>
              <h3 className="empty-state-title" style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>No patients yet.</h3>
              <p className="empty-state-desc" style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Add your first patient to begin.
              </p>
              <button onClick={onAddPatient} className="btn btn-primary btn-sm">
                <UserPlus size={14} />
                + Add Patient
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentPatients.map((pt) => {
                const isCurrent = patient?.id === pt.id;
                return (
                  <div
                    key={pt.id}
                    onClick={() => {
                      if (onSelectPatient) onSelectPatient(pt);
                      onNavigateTab('patients');
                    }}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isCurrent ? '#F0F9FF' : '#FFFFFF',
                      border: `1px solid ${isCurrent ? '#BAE6FD' : '#E2E8F0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
                        {pt.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                        {pt.age} yrs &bull; {pt.sex} {pt.bloodGroup ? `• Blood Group: ${pt.bloodGroup}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isCurrent && (
                        <span style={{ fontSize: '0.7rem', color: '#0369A1', fontWeight: 600, background: '#E0F2FE', padding: '0.15rem 0.45rem', borderRadius: 4 }}>
                          Active
                        </span>
                      )}
                      <ArrowRight size={14} color="#94A3B8" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Recent Reports */}
        <section className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <FileText size={18} color="#0D9488" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Recent Reports
              </h2>
            </div>
            <button 
              onClick={() => onNavigateTab('reports')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
            >
              View All ({documents.length})
            </button>
          </div>

          {recentReports.length === 0 ? (
            <div className="empty-state-box" style={{ padding: '2.5rem 1rem', margin: 'auto 0' }}>
              <div className="empty-state-icon" style={{ width: 48, height: 48, borderRadius: 12, background: '#F0FDFA', color: '#0D9488', borderColor: '#99F6E4' }}>
                <UploadCloud size={22} />
              </div>
              <h3 className="empty-state-title" style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>No medical reports uploaded yet.</h3>
              <p className="empty-state-desc" style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Upload a PDF or image of a medical report to organize and review its information.
              </p>
              <button onClick={onOpenUpload} className="btn btn-teal btn-sm">
                <UploadCloud size={14} />
                Upload Report
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentReports.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onNavigateTab('reports')}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {doc.filename}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                      {doc.documentCategory} &bull; {new Date(doc.uploadTimestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 4,
                      background: doc.verificationStatus === 'Verified' ? '#F0FDF4' : '#FFFBEB',
                      color: doc.verificationStatus === 'Verified' ? '#14532D' : '#78350F',
                      border: `1px solid ${doc.verificationStatus === 'Verified' ? '#BBF7D0' : '#FDE68A'}`,
                      fontWeight: 500,
                    }}>
                      {doc.verificationStatus}
                    </span>
                    <ArrowRight size={14} color="#94A3B8" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Important Observations */}
        <section className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <HeartPulse size={18} color="#E11D48" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Important Observations
              </h2>
            </div>
            {observations.length > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991B1B', background: '#FEF2F2', padding: '0.15rem 0.5rem', borderRadius: 9999 }}>
                {observations.length} active
              </span>
            )}
          </div>

          {observations.length === 0 ? (
            <div className="empty-state-box" style={{ padding: '2.5rem 1rem', margin: 'auto 0' }}>
              <div className="empty-state-icon" style={{ width: 48, height: 48, borderRadius: 12, background: '#F0FDFA', color: '#0D9488', borderColor: '#99F6E4' }}>
                <CheckCircle2 size={22} />
              </div>
              <h3 className="empty-state-title" style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>No important observations.</h3>
              <p className="empty-state-desc" style={{ fontSize: '0.875rem', marginBottom: 0 }}>
                No abnormal findings or clinical flags identified in currently ingested records. Upload medical reports to organize and review observations.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '280px', overflowY: 'auto' }}>
              {observations.slice(0, 6).map((obs) => (
                <div
                  key={obs.id}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: obs.severity === 'high' ? '#FEF2F2' : '#FFFBEB',
                    border: `1px solid ${obs.severity === 'high' ? '#FECACA' : '#FDE68A'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.55rem',
                  }}
                >
                  <AlertTriangle size={15} color={obs.severity === 'high' ? '#B91C1C' : '#B45309'} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: obs.severity === 'high' ? '#7F1D1D' : '#78350F' }}>
                      {obs.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: obs.severity === 'high' ? '#991B1B' : '#92400E', marginTop: '0.15rem' }}>
                      {obs.subtitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 4: Reports Awaiting Review */}
        <section className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <Clock size={18} color="#D97706" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Reports Awaiting Review
              </h2>
            </div>
            {reportsAwaitingReview.length > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E', background: '#FEF3C7', padding: '0.15rem 0.5rem', borderRadius: 9999 }}>
                {reportsAwaitingReview.length} pending
              </span>
            )}
          </div>

          {reportsAwaitingReview.length === 0 ? (
            <div className="empty-state-box" style={{ padding: '2rem 1rem', margin: 'auto 0' }}>
              <div className="empty-state-icon" style={{ width: 44, height: 44, borderRadius: 10, background: '#F0FDF4', color: '#166534', borderColor: '#BBF7D0' }}>
                <ShieldCheck size={20} />
              </div>
              <h3 className="empty-state-title" style={{ fontSize: '0.95rem' }}>All Reports Verified</h3>
              <p className="empty-state-desc" style={{ fontSize: '0.8125rem', marginBottom: 0 }}>
                There are no pending documents awaiting human clinical review. Uploaded reports requiring verification will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {reportsAwaitingReview.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onNavigateTab('reports')}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#78350F' }}>
                      {doc.filename}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#92400E', marginTop: '0.15rem' }}>
                      Requires verification against original document
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateTab('reports');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', borderColor: '#FCD34D' }}
                  >
                    Review Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
