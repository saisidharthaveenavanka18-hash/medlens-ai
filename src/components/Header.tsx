import React from 'react';
import { 
  Activity, 
  UploadCloud, 
  HelpCircle,
  Stethoscope, 
  UserCheck,
  Layers,
  User,
  UserPlus
} from 'lucide-react';
import { NavigationTab, UserMode, PatientRecord } from '../types';

interface HeaderProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  userMode: UserMode;
  onToggleUserMode: (mode: UserMode) => void;
  onOpenUpload: () => void;
  onOpenSafetyModal: () => void;
  pendingReviewCount: number;
  activePatient: PatientRecord | null;
  allPatients?: PatientRecord[];
  onSelectPatient?: (patientId: string) => void;
  onAddPatient?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  userMode,
  onToggleUserMode,
  onOpenUpload,
  onOpenSafetyModal,
  activePatient,
  allPatients = [],
  onSelectPatient,
  onAddPatient,
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: '#FFFFFF',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '60px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        height: '100%',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        {/* Brand Logo & Subtitle */}
        <div 
          onClick={() => onSelectTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
        >
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '6px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
          }}>
            <Activity size={18} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ 
                fontFamily: 'var(--font-sans)', 
                fontSize: '1.15rem', 
                fontWeight: 700, 
                color: 'var(--text-main)',
                letterSpacing: '-0.015em',
              }}>
                MedLens
              </span>
              <span style={{
                fontSize: '0.675rem',
                fontWeight: 600,
                backgroundColor: '#F0F9FF',
                color: '#0369A1',
                border: '1px solid #BAE6FD',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
              }}>
                Clinical Intelligence
              </span>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: 1.1, margin: 0 }}>
              Organize medical information and review it intelligently.
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Active Patient Switcher / Indicator */}
          {allPatients.length > 1 && onSelectPatient ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Patient:</span>
              <select
                value={activePatient?.id || ''}
                onChange={(e) => onSelectPatient(e.target.value)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {allPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.age}Y)
                  </option>
                ))}
              </select>
            </div>
          ) : activePatient ? (
            <div 
              onClick={() => onSelectTab('patient-intake')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.25rem 0.6rem',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
              title="Click to view patient profile"
            >
              <User size={13} color="#2563EB" />
              <span style={{ fontWeight: 600, color: '#334155' }}>{activePatient.name}</span>
              <span style={{ color: '#64748B' }}>({activePatient.age}Y)</span>
            </div>
          ) : (
            onAddPatient && (
              <button
                onClick={onAddPatient}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
              >
                <UserPlus size={13} />
                + Add Patient
              </button>
            )
          )}

          {/* Clean Segmented Control: Patient View / Clinician Auditor */}
          <div style={{ 
            display: 'flex', 
            backgroundColor: 'var(--bg-secondary)', 
            padding: '2px', 
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}>
            <button
              onClick={() => onToggleUserMode('patient')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.2rem 0.55rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: userMode === 'patient' ? '#FFFFFF' : 'transparent',
                color: userMode === 'patient' ? '#2563EB' : 'var(--text-secondary)',
                boxShadow: userMode === 'patient' ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.1s ease',
              }}
            >
              <UserCheck size={13} />
              Patient View
            </button>

            <button
              onClick={() => onToggleUserMode('clinician')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.2rem 0.55rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: userMode === 'clinician' ? '#FFFFFF' : 'transparent',
                color: userMode === 'clinician' ? '#2563EB' : 'var(--text-secondary)',
                boxShadow: userMode === 'clinician' ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.1s ease',
              }}
            >
              <Stethoscope size={13} />
              Clinician Auditor
            </button>
          </div>

          {/* Core Workflow */}
          <button
            onClick={() => onSelectTab('workflow')}
            className={`btn btn-sm ${activeTab === 'workflow' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem' }}
          >
            <Layers size={13} />
            Core Workflow
          </button>

          {/* Upload Lab PDF */}
          <button
            onClick={onOpenUpload}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.75rem' }}
          >
            <UploadCloud size={14} />
            Upload Report
          </button>

          {/* Help Icon */}
          <button
            onClick={onOpenSafetyModal}
            title="MedLens Clinical Safety & Information Policy"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.2rem',
            }}
          >
            <HelpCircle size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};
