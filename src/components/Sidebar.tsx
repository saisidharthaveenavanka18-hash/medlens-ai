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
  activePatient: PatientRecord | null;
  onAddPatient?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingReviewCount,
  onOpenSafetyModal,
  activePatient,
  onAddPatient,
}) => {
  // 5 clear, simplified navigation items
  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      isActive: activeTab === 'dashboard',
    },
    {
      id: 'patients' as NavigationTab,
      label: 'Patients',
      icon: <ClipboardList size={18} />,
      isActive: activeTab === 'patients' || activeTab === 'patient-intake',
    },
    {
      id: 'reports' as NavigationTab,
      label: 'Reports',
      icon: <FileText size={18} />,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
      isActive: activeTab === 'reports' || activeTab === 'document-manager' || activeTab === 'dual-pane' || activeTab === 'workflow' || activeTab === 'hitl-queue' || activeTab === 'comparison' || activeTab === 'timeline',
    },
    {
      id: 'ai-assistant' as NavigationTab,
      label: 'AI Assistant',
      icon: <Sparkles size={18} />,
      isActive: activeTab === 'ai-assistant' || activeTab === 'doctor-prep',
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Settings',
      icon: <ShieldCheck size={18} />,
      isActive: activeTab === 'settings',
    },
  ];

  return (
    <aside className="sidebar-container" aria-label="Main Navigation">
      {/* Navigation items */}
      <div className="sidebar-nav-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '0.2rem 0.5rem 0.5rem 0.5rem',
        }}>
          Navigation
        </div>

        {navItems.map((item) => {
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isActive ? '#BAE6FD' : 'transparent',
                backgroundColor: isActive ? '#F0F9FF' : 'transparent',
                color: isActive ? '#0369A1' : '#334155',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ color: isActive ? '#0284C7' : '#64748B', display: 'flex' }}>
                  {item.icon}
                </span>
                <span className="sidebar-label">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span style={{
                  backgroundColor: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FECACA',
                  fontSize: '0.675rem',
                  fontWeight: 600,
                  padding: '0.1rem 0.45rem',
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
          justifyContent: 'space-between',
          gap: '0.45rem',
        }}>
          {activePatient ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
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
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span className="sidebar-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No active patient</span>
              {onAddPatient && (
                <button
                  onClick={onAddPatient}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  + Add
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
