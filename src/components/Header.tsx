import React from 'react';
import { 
  Activity, 
  UploadCloud, 
  HelpCircle,
  Stethoscope,
  UserCheck,
  Layers,
  Sparkles
} from 'lucide-react';
import { NavigationTab, UserMode } from '../types';
import { DEMO_PRESETS } from '../data/mockData';

interface HeaderProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  userMode: UserMode;
  onToggleUserMode: (mode: UserMode) => void;
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenUpload: () => void;
  onOpenJudgeTour: () => void;
  onOpenSafetyModal: () => void;
  pendingReviewCount: number;
  onLoadDemoPatient?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  userMode,
  onToggleUserMode,
  activePresetId,
  onSelectPreset,
  onOpenUpload,
  onOpenJudgeTour,
  onOpenSafetyModal,
  onLoadDemoPatient,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                fontSize: '1.1rem', 
                fontWeight: 600, 
                color: 'var(--text-main)',
                letterSpacing: '-0.01em',
              }}>
                MedLens
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 500,
                backgroundColor: '#EFF6FF',
                color: '#1E40AF',
                border: '1px solid #DBEAFE',
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
              }}>
                Clinical Intelligence
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.1 }}>
              AI Clinical Information Intelligence
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Demo Preset Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Preset:</span>
            <select
              value={activePresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              style={{
                backgroundColor: '#FFFFFF',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {DEMO_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.badge}: {p.name}
                </option>
              ))}
            </select>
          </div>

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

          {/* Core Workflow (Upload & Review) */}
          <button
            onClick={() => onSelectTab('workflow')}
            className={`btn btn-sm ${activeTab === 'workflow' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem' }}
          >
            <Layers size={13} />
            Core Workflow
          </button>

          {/* Load Demo Patient */}
          {onLoadDemoPatient && (
            <button
              onClick={onLoadDemoPatient}
              className="btn btn-secondary btn-sm"
              style={{
                borderColor: '#BFDBFE',
                backgroundColor: '#EFF6FF',
                color: '#1E40AF',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
              title="Reset & Load complete fictional demo patient Eleanor Vance"
            >
              <Sparkles size={13} color="#2563EB" />
              Load Demo
            </button>
          )}

          {/* Hackathon Judge Guide */}
          <button
            onClick={onOpenJudgeTour}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: '#FDE68A',
              backgroundColor: '#FFFBEB',
              color: '#92400E',
            }}
          >
            Judge Guide
          </button>

          {/* Primary Action: Upload Lab PDF */}
          <button
            onClick={onOpenUpload}
            className="btn btn-primary btn-sm"
          >
            <UploadCloud size={15} />
            Upload Lab PDF
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
