import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  CheckCircle2, 
  ShieldAlert, 
  GitCompare, 
  Stethoscope, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight,
  Sparkles,
  ClipboardList,
  FolderArchive,
  FileText,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { NavigationTab } from '../types';

interface JudgeWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: NavigationTab) => void;
  onSelectPreset: (presetId: string) => void;
}

export const JudgeWalkthroughModal: React.FC<JudgeWalkthroughModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      badge: 'Step 1 of 12',
      title: '1. Load Demo Patient & Dashboard',
      icon: <Sparkles size={20} color="#2563EB" />,
      description: 'Initializes fictional patient Eleanor Vance (52Y / Female) with 2 clinical panels and baseline health metrics. The dashboard highlights document count, structured lab tests, verification alerts, and cross-record conflict notices.',
      actionTab: 'dashboard' as NavigationTab,
      presetId: 'preset-provenance',
      actionLabel: 'Open Clinical Dashboard',
    },
    {
      badge: 'Step 2 of 12',
      title: '2. Patient Overview & Intake Profile',
      icon: <ClipboardList size={20} color="#2563EB" />,
      description: 'Review Eleanor Vance’s symptoms, existing conditions, known allergies, and current medications. All intake values are strictly stamped SOURCE = USER_PROVIDED in the underlying PostgreSQL database.',
      actionTab: 'patient-intake' as NavigationTab,
      presetId: 'preset-provenance',
      actionLabel: 'View Patient Intake Profile',
    },
    {
      badge: 'Step 3 of 12',
      title: '3. Documents Vault',
      icon: <FolderArchive size={20} color="#2563EB" />,
      description: 'View ingested documents with category classification (Laboratory Report, Prescription, Medical Record, Other), file format tags (PDF/PNG), and explicit lifecycle states (Uploaded, Processing, Extracted, Needs Verification).',
      actionTab: 'document-manager' as NavigationTab,
      presetId: 'preset-provenance',
      actionLabel: 'Open Document Vault',
    },
    {
      badge: 'Step 4 of 12',
      title: '4. Open Medical Report',
      icon: <FileText size={20} color="#2563EB" />,
      description: 'Open the dual-pane medical viewer displaying the authentic document canvas alongside extracted biomarker cards with synchronized selection and viewport centering.',
      actionTab: 'dual-pane' as NavigationTab,
      presetId: 'preset-provenance',
      actionLabel: 'Open Medical Report Canvas',
    },
    {
      badge: 'Step 5 of 12',
      title: '5. AI Extraction & Bounding Boxes',
      icon: <Layers size={20} color="#2563EB" />,
      description: 'MedLens captures pixel-exact bounding-box coordinates for each test item. Hovering over a card highlights its exact visual location on the report with optical OCR confidence scores.',
      actionTab: 'dual-pane' as NavigationTab,
      presetId: 'preset-provenance',
      actionLabel: 'Inspect Optical Bounding Boxes',
    },
    {
      badge: 'Step 6 of 12',
      title: '6. Structured Medical Results',
      icon: <Layers size={20} color="#166534" />,
      description: 'Structured laboratory results table showing canonical test names, observed values, standard units, and clinical observations with no conversational chatbot fluff.',
      actionTab: 'workflow' as NavigationTab,
      presetId: 'preset-provenance',
      actionLabel: 'View Structured Results Table',
    },
    {
      badge: 'Step 7 of 12',
      title: '7. Reference Range Status (Zero Hallucination)',
      icon: <ShieldAlert size={20} color="#D97706" />,
      description: 'Reference ranges vary by laboratory equipment. MedLens calculates LOW/NORMAL/HIGH ONLY if printed on the report. If omitted (e.g. hs-CRP), it displays REFERENCE RANGE UNAVAILABLE rather than hallucinating external population averages.',
      actionTab: 'workflow' as NavigationTab,
      presetId: 'preset-hitl',
      actionLabel: 'Inspect Reference Range Status',
    },
    {
      badge: 'Step 8 of 12',
      title: '8. Source Document & Provenance',
      icon: <CheckCircle2 size={20} color="#2563EB" />,
      description: 'Every extracted row explicitly displays its origin: "AI Extracted", source filename, and page number. Nothing is anonymous or ungrounded.',
      actionTab: 'workflow' as NavigationTab,
      presetId: 'preset-provenance',
      actionLabel: 'View Provenance Badges',
    },
    {
      badge: 'Step 9 of 12',
      title: '9. Edit & Verify (Human-in-the-Loop)',
      icon: <CheckCircle2 size={20} color="#166534" />,
      description: 'When image quality or character confidence drops, MedLens flags "Needs Verification". Clinicians inspect side-by-side, correct values if needed, and stamp an immutable "✓ Human Verified" audit record.',
      actionTab: 'hitl-queue' as NavigationTab,
      presetId: 'preset-hitl',
      actionLabel: 'Open Verification Drawer',
    },
    {
      badge: 'Step 10 of 12',
      title: '10. Potential Conflict Detection',
      icon: <AlertTriangle size={20} color="#DC2626" />,
      description: 'Scans for discrepancies between patient intake and uploaded reports (e.g. Penicillin allergy vs NKDA; Atorvastatin vs Simvastatin). Shows both sources with "Please verify this information." without diagnostic safety claims.',
      actionTab: 'dashboard' as NavigationTab,
      presetId: 'preset-provenance',
      actionLabel: 'View Potential Conflicts on Dashboard',
    },
    {
      badge: 'Step 11 of 12',
      title: '11. Report Comparison (Numerical Changes Only)',
      icon: <GitCompare size={20} color="#2563EB" />,
      description: 'Align matching laboratory tests across baseline and follow-up reports. Displays observed numerical differences (e.g. Hemoglobin: 12.1 → 13.2, Change: +1.1) with zero medical interpretation.',
      actionTab: 'comparison' as NavigationTab,
      presetId: 'preset-longitudinal',
      actionLabel: 'Open Report Comparison',
    },
    {
      badge: 'Step 12 of 12',
      title: '12. Chronological Timeline & Safe AI Summary',
      icon: <Clock size={20} color="#2563EB" />,
      description: 'View chronological progression (Date ↓ Document ↓ Extracted info) and a strictly bounded AI summary ending with: "This summary organizes information from the available records and is not a medical diagnosis or treatment recommendation."',
      actionTab: 'timeline' as NavigationTab,
      presetId: 'preset-longitudinal',
      actionLabel: 'Open Chronological Timeline',
    },
  ];

  const step = steps[currentStep];

  const handleAction = () => {
    onSelectPreset(step.presetId);
    onNavigateToTab(step.actionTab);
    onClose();
  };

  return (
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
        maxWidth: '620px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '12px',
        overflow: 'hidden',
        padding: 0,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.15rem 1.25rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#EFF6FF',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              background: '#DBEAFE',
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {step.icon}
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {step.badge}
              </span>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
                {step.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.55, margin: 0 }}>
            {step.description}
          </p>

          {/* Quick jump to step action */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0.875rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>
                Recommended Action:
              </span>
              <strong style={{ fontSize: '0.825rem', color: '#334155' }}>
                {step.actionLabel}
              </strong>
            </div>

            <button
              onClick={handleAction}
              className="btn btn-primary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
            >
              <span>Explore</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div style={{
          padding: '0.875rem 1.25rem',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC',
        }}>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                style={{
                  width: idx === currentStep ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentStep ? '#3B82F6' : '#CBD5E1',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
            >
              <ChevronLeft size={14} /> Prev
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
