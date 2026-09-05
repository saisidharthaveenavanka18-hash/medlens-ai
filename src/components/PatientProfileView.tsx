import React, { useState } from 'react';
import { 
  User, 
  Edit3, 
  Activity, 
  Pill, 
  AlertTriangle, 
  FileText, 
  Database, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X,
  ShieldCheck
} from 'lucide-react';
import { PatientRecord } from '../types';
import { SourceBadge } from './SourceBadge';
import { recentQueryLogs } from '../services/db';

interface PatientProfileViewProps {
  patient: PatientRecord;
  onEdit: () => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patient,
  onEdit,
}) => {
  const [showSqlViewer, setShowSqlViewer] = useState(false);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Patient Information Primary Card */}
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

        {/* Quick Vitals / Core Demographics Bar */}
        <div style={{
          padding: '1rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          background: '#FFFFFF',
          borderBottom: '1px solid #F1F5F9',
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Full Name
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
              {patient.name}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Biological Sex
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
              {patient.sex}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Age at Intake
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
              {patient.age} Years
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Data Provenance
            </span>
            <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 500 }}>
              Patient Intake (Verified)
            </span>
          </div>
        </div>
      </div>

      {/* Main Clinical Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Reported Symptoms */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            marginBottom: '0.875rem',
            borderBottom: '1px solid #F1F5F9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} color="#3B82F6" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                Reported Symptoms
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {patient.symptoms.length} items
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {patient.symptoms.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>No symptoms reported by patient.</p>
            ) : (
              patient.symptoms.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.85rem',
                    borderRadius: '6px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{s.name}</span>
                    {s.duration && (
                      <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.5rem' }}>
                        &bull; {s.duration}
                      </span>
                    )}
                  </div>

                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: s.severity === 'Severe' ? '#FEF2F2' : s.severity === 'Moderate' ? '#FFFBEB' : '#F0FDF4',
                    color: s.severity === 'Severe' ? '#991B1B' : s.severity === 'Moderate' ? '#92400E' : '#166534',
                    border: `1px solid ${s.severity === 'Severe' ? '#FECACA' : s.severity === 'Moderate' ? '#FDE68A' : '#BBF7D0'}`,
                  }}>
                    {s.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Existing Conditions */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            marginBottom: '0.875rem',
            borderBottom: '1px solid #F1F5F9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} color="#3B82F6" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                Existing Chronic Conditions
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {patient.conditions.length} conditions
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {patient.conditions.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>No chronic conditions reported.</p>
            ) : (
              patient.conditions.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.85rem',
                    borderRadius: '6px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{c.name}</span>
                    {c.diagnosedYear && (
                      <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.5rem' }}>
                        &bull; Diagnosed: {c.diagnosedYear}
                      </span>
                    )}
                  </div>

                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: '#EFF6FF',
                    color: '#1E40AF',
                    border: '1px solid #BFDBFE',
                  }}>
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Allergies & Adverse Reactions */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            marginBottom: '0.875rem',
            borderBottom: '1px solid #F1F5F9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} color="#DC2626" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                Allergies &amp; Adverse Reactions
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {patient.allergies.length} allergies
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {patient.allergies.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>No known drug or food allergies.</p>
            ) : (
              patient.allergies.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.85rem',
                    borderRadius: '6px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#991B1B' }}>{a.allergen}</span>
                    <span style={{ color: '#64748B', fontSize: '0.78rem', marginLeft: '0.4rem' }}>
                      &rarr; {a.reaction}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: '#FFFFFF',
                    color: '#991B1B',
                    border: '1px solid #FECACA',
                  }}>
                    {a.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            marginBottom: '0.875rem',
            borderBottom: '1px solid #F1F5F9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Pill size={16} color="#3B82F6" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                Current Medications
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {patient.medications.length} active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {patient.medications.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>No active medications listed.</p>
            ) : (
              patient.medications.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.85rem',
                    borderRadius: '6px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{m.name}</span>
                    <span style={{ color: '#1E40AF', fontSize: '0.78rem', marginLeft: '0.4rem', fontWeight: 500 }}>
                      {m.dosage}
                    </span>
                    <span style={{ color: '#64748B', fontSize: '0.75rem', marginLeft: '0.35rem' }}>
                      ({m.frequency})
                    </span>
                  </div>

                  {m.purpose && (
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      {m.purpose}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Medical History & Patient Notes Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          paddingBottom: '0.75rem',
          marginBottom: '1rem',
          borderBottom: '1px solid #F1F5F9',
        }}>
          <FileText size={16} color="#3B82F6" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
            Medical History &amp; Patient Notes
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div style={{
            background: '#F8FAFC',
            padding: '0.875rem 1rem',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
          }}>
            <strong style={{ color: '#334155', fontSize: '0.8125rem', display: 'block', marginBottom: '0.35rem' }}>
              Past Medical &amp; Family History
            </strong>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              {patient.medicalHistory || 'No past medical history recorded.'}
            </p>
          </div>

          <div style={{
            background: '#F8FAFC',
            padding: '0.875rem 1rem',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
          }}>
            <strong style={{ color: '#334155', fontSize: '0.8125rem', display: 'block', marginBottom: '0.35rem' }}>
              Additional Patient Notes
            </strong>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              {patient.additionalNotes || 'No additional notes provided.'}
            </p>
          </div>
        </div>
      </div>

      {/* SQL Records Inspector Modal */}
      {showSqlViewer && (
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
            maxWidth: '820px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '12px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 0,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          }}>
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Database size={20} color="#3B82F6" />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                    PostgreSQL Live Schema &amp; Execution Audit Log
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                    Embedded relational engine executing queries with provenance tracking
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlViewer(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Relational Tables Map */}
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Relational PostgreSQL Tables:
                </span>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                }}>
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

              {/* Live Executed Query Log */}
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Recent Executed SQL Queries:
                </span>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  maxHeight: '220px',
                  overflowY: 'auto',
                }}>
                  {recentQueryLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: '#F8FAFC',
                        padding: '0.625rem 0.85rem',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.72rem',
                        fontFamily: 'monospace',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', marginBottom: '0.2rem' }}>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span style={{ color: '#3B82F6' }}>{log.durationMs}ms</span>
                      </div>
                      <div style={{ color: '#1E40AF', wordBreak: 'break-all' }}>
                        {log.query}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{
              padding: '0.875rem 1.25rem',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#F8FAFC',
            }}>
              <button
                onClick={() => setShowSqlViewer(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem' }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
