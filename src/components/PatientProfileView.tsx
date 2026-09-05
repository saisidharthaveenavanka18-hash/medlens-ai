import React, { useState } from 'react';
import { 
  User, 
  Edit3, 
  Activity, 
  Pill, 
  AlertTriangle, 
  FileText, 
  Database, 
  Search,
  UserPlus,
  Trash2,
  CheckCircle2, 
  X,
  Users,
  ShieldCheck
} from 'lucide-react';
import { PatientRecord } from '../types';
import { SourceBadge } from './SourceBadge';
import { recentQueryLogs } from '../services/db';

interface PatientProfileViewProps {
  patient: PatientRecord | null;
  allPatients?: PatientRecord[];
  onSelectPatient?: (patientId: string) => void;
  onAddPatient?: () => void;
  onDeletePatient?: (patientId: string) => Promise<void>;
  onEdit: () => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patient,
  allPatients = [],
  onSelectPatient,
  onAddPatient,
  onDeletePatient,
  onEdit,
}) => {
  const [showSqlViewer, setShowSqlViewer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Patient Directory & Search Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#2563EB" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
              Patient Directory ({allPatients.length})
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '0.35rem 0.65rem',
              gap: '0.4rem',
              width: '240px',
            }}>
              <Search size={14} color="#64748B" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.78rem',
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
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem' }}
              >
                <UserPlus size={14} />
                + Add Patient
              </button>
            )}
          </div>
        </div>

        {/* Patients Grid / Empty States */}
        {allPatients.length === 0 ? (
          <div style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.625rem',
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <UserPlus size={22} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', margin: 0 }}>
              No patients yet
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', maxWidth: '380px', margin: 0 }}>
              Add a patient to begin organizing medical information.
            </p>
            {onAddPatient && (
              <button
                onClick={onAddPatient}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem', marginTop: '0.5rem' }}
              >
                <UserPlus size={14} />
                + Add Patient
              </button>
            )}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B' }}>
            <Search size={24} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: '0 0 0.25rem 0' }}>
              No patients found
            </h4>
            <p style={{ fontSize: '0.78rem', margin: 0 }}>
              No patient records matched &ldquo;{searchQuery}&rdquo;.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {filteredPatients.map((p) => {
              const isActive = patient?.id === p.id;
              return (
                <div
                  key={p.id}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    border: isActive ? '1.5px solid #3B82F6' : '1px solid #E2E8F0',
                    background: isActive ? '#EFF6FF' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ fontSize: '0.875rem', color: '#1E293B' }}>
                        {p.name}
                      </strong>
                      {isActive && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          background: '#DBEAFE',
                          color: '#1E40AF',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                        }}>
                          Active
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>
                      {p.age}Y &bull; {p.sex} &bull; ID: {p.id}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {onSelectPatient && !isActive && (
                      <button
                        onClick={() => onSelectPatient(p.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                      >
                        Open Patient
                      </button>
                    )}
                    {onDeletePatient && (
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={deletingId === p.id}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.45rem', color: '#DC2626' }}
                        title="Delete patient from database"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Patient Information Primary Card */}
      {patient ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Soft blue section header */}
          <div style={{
            background: '#EFF6FF',
            borderBottom: '1px solid #BFDBFE',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                <User size={22} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
                    {patient.name}
                  </h2>
                  <SourceBadge source="USER_PROVIDED" size="sm" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', fontSize: '0.8125rem', color: '#64748B' }}>
                  <span>Patient ID: <strong style={{ color: '#334155' }}>{patient.id}</strong></span>
                  <span>&bull;</span>
                  <span>Age: <strong style={{ color: '#334155' }}>{patient.age} yrs</strong></span>
                  <span>&bull;</span>
                  <span>Sex: <strong style={{ color: '#334155' }}>{patient.sex}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button
                onClick={() => setShowSqlViewer(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
              >
                <Database size={14} color="#3B82F6" />
                PostgreSQL Schema
              </button>

              <button
                onClick={onEdit}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
              >
                <Edit3 size={14} />
                Edit Intake Form
              </button>
            </div>
          </div>

          {/* Core Content Grid */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Symptoms Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Activity size={16} color="#3B82F6" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                  Reported Symptoms ({patient.symptoms.length})
                </h4>
              </div>
              {patient.symptoms.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>No symptoms recorded.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {patient.symptoms.map((s) => (
                    <div key={s.id} style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#334155', display: 'block' }}>{s.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Severity: {s.severity} {s.duration && `• Duration: ${s.duration}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conditions Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <FileText size={16} color="#3B82F6" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                  Known Medical Conditions ({patient.conditions.length})
                </h4>
              </div>
              {patient.conditions.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>No medical conditions recorded.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {patient.conditions.map((c) => (
                    <div key={c.id} style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#334155', display: 'block' }}>{c.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Status: {c.status} {c.diagnosedYear && `• Diagnosed: ${c.diagnosedYear}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Allergies Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertTriangle size={16} color="#D97706" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                  Documented Allergies ({patient.allergies.length})
                </h4>
              </div>
              {patient.allergies.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>No known allergies recorded.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {patient.allergies.map((a) => (
                    <div key={a.id} style={{ background: '#FFFBEB', padding: '0.75rem', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#92400E', display: 'block' }}>{a.allergen}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#B45309' }}>Reaction: {a.reaction} • Severity: {a.severity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medications Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Pill size={16} color="#166534" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                  Active Medications ({patient.medications.length})
                </h4>
              </div>
              {patient.medications.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>No medications recorded.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {patient.medications.map((m) => (
                    <div key={m.id} style={{ background: '#F0FDF4', padding: '0.75rem', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#166534', display: 'block' }}>{m.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#15803D' }}>{m.dosage} • {m.frequency} {m.purpose && `• ${m.purpose}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medical History & Notes */}
            {(patient.medicalHistory || patient.additionalNotes) && (
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8125rem', color: '#334155' }}>
                {patient.medicalHistory && (
                  <div style={{ marginBottom: patient.additionalNotes ? '0.75rem' : 0 }}>
                    <strong style={{ color: '#475569', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                      Medical History:
                    </strong>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>{patient.medicalHistory}</p>
                  </div>
                )}
                {patient.additionalNotes && (
                  <div>
                    <strong style={{ color: '#475569', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                      Additional Notes:
                    </strong>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>{patient.additionalNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* PostgreSQL Inspector Modal */}
      {showSqlViewer && patient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: '680px', width: '100%', background: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#EFF6FF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={18} color="#1E40AF" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
                  PostgreSQL Relational Tables Inspection
                </h3>
              </div>
              <button onClick={() => setShowSqlViewer(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
                MedLens persists patient health profiles into normalized relational tables inside in-browser PostgreSQL (PGlite).
              </p>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  Patient Graph Record Counts:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <strong style={{ color: '#334155', display: 'block' }}>patients</strong>
                    <span style={{ color: '#3B82F6' }}>1 record</span>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <strong style={{ color: '#334155', display: 'block' }}>patient_symptoms</strong>
                    <span style={{ color: '#166534' }}>{patient.symptoms.length} records</span>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <strong style={{ color: '#334155', display: 'block' }}>patient_conditions</strong>
                    <span style={{ color: '#166534' }}>{patient.conditions.length} records</span>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <strong style={{ color: '#334155', display: 'block' }}>patient_allergies</strong>
                    <span style={{ color: '#166534' }}>{patient.allergies.length} records</span>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <strong style={{ color: '#334155', display: 'block' }}>patient_medications</strong>
                    <span style={{ color: '#166534' }}>{patient.medications.length} records</span>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Recent SQL Queries:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {recentQueryLogs.map((log) => (
                    <div key={log.id} style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', marginBottom: '0.2rem' }}>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span style={{ color: '#3B82F6' }}>{log.durationMs}ms</span>
                      </div>
                      <div style={{ color: '#1E40AF', wordBreak: 'break-all' }}>{log.query}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', background: '#F8FAFC' }}>
              <button onClick={() => setShowSqlViewer(false)} className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
