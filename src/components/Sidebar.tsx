import React from 'react';
import { 
  FileText, 
  ClipboardList, 
  CheckCircle2, 
  Sparkles, 
  FolderArchive, 
  Activity, 
  ShieldCheck, 
  User,
  Layers,
  LayoutDashboard,
  GitCompare,
  Clock
} from 'lucide-react';
import { NavigationTab, PatientRecord } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  pendingReviewCount: number;
  onOpenSafetyModal: () => void;
  activePatient: PatientRecord;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingReviewCount,
  onOpenSafetyModal,
  activePatient,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: <LayoutDashboard size={17} />,
    },
    {
      id: 'patient-intake' as NavigationTab,
      label: 'Patient Overview',
      icon: <ClipboardList size={17} />,
    },
    {
      id: 'document-manager' as NavigationTab,
      label: 'Documents Vault',
      icon: <FolderArchive size={17} />,
    },
    {
      id: 'workflow' as NavigationTab,
      label: 'Core Workflow (Upload & Review)',
      icon: <Layers size={17} />,
    },
    {
      id: 'dual-pane' as NavigationTab,
      label: 'Medical Report Viewer',
      icon: <FileText size={17} />,
    },
    {
      id: 'comparison' as NavigationTab,
      label: 'Report Comparison',
      icon: <GitCompare size={17} />,
    },
    {
      id: 'timeline' as NavigationTab,
      label: 'Chronological Timeline',
      icon: <Clock size={17} />,
    },
    {
      id: 'hitl-queue' as NavigationTab,
      label: 'Review & Verify',
      icon: <CheckCircle2 size={17} />,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
    },
    {
      id: 'doctor-prep' as NavigationTab,
      label: 'AI Summary',
      icon: <Sparkles size={17} />,
    },
  ];

  return (
    <aside className="sidebar-container">
      {/* Navigation items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{
          fontSize: '0.675rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '0.2rem 0.5rem 0.5rem 0.5rem',
        }}>
          Navigation
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: isActive ? '#BFDBFE' : 'transparent',
                backgroundColor: isActive ? 'var(--bg-highlight)' : 'transparent',
                color: isActive ? '#1E40AF' : 'var(--text-main)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.825rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.12s ease',
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: isActive ? '#2563EB' : '#64748B', display: 'flex' }}>
                  {item.icon}
                </span>
                <span className="sidebar-label">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span style={{
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  border: '1px solid #FCA5A5',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  padding: '0.05rem 0.35rem',
                  borderRadius: '9999px',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Information */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
        {/* Safety Notice Link */}
        <button
          onClick={onOpenSafetyModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.65rem',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <ShieldCheck size={15} color="#2563EB" style={{ flexShrink: 0 }} />
          <div className="sidebar-label">
            <span style={{ fontWeight: 500 }}>Safety Notice</span>
          </div>
        </button>

        {/* Patient snapshot */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.55rem 0.65rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}>
            <User size={15} />
          </div>
          <div className="sidebar-label" style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {activePatient.name}
            </div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-secondary)' }}>
              {activePatient.age}Y &bull; {activePatient.sex}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
