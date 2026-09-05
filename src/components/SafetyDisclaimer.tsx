import React from 'react';
import { ShieldCheck, X, Check, Lock, Stethoscope, Info } from 'lucide-react';

interface SafetyDisclaimerBannerProps {
  onLearnMore: () => void;
}

export const SafetyDisclaimerBanner: React.FC<SafetyDisclaimerBannerProps> = ({ onLearnMore }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-highlight)',
      borderBottom: '1px solid #DBEAFE',
      padding: '0.4rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '0.78rem',
      color: '#1E40AF',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldCheck size={16} color="#3B82F6" style={{ flexShrink: 0 }} />
        <span>
          <strong>AI-assisted information.</strong> Verify important details against the original record and consult a qualified healthcare professional for clinical decisions.
        </span>
      </div>

      <button
        onClick={onLearnMore}
        style={{
          background: 'none',
          border: 'none',
          color: '#2563EB',
          cursor: 'pointer',
          textDecoration: 'underline',
          fontWeight: 500,
          fontSize: '0.75rem',
        }}
      >
        Safety Policy
      </button>
    </div>
  );
};

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.35)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      padding: '1.5rem',
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="#3B82F6" />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
              Responsible AI &amp; Clinical Safety
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: 'var(--bg-highlight)',
            border: '1px solid #BFDBFE',
            borderRadius: '6px',
            padding: '0.85rem',
            display: 'flex',
            gap: '0.65rem',
          }}>
            <Info size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ color: '#1E40AF', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                Scope of Information
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#1E3A8A', lineHeight: 1.45 }}>
                MedLens organizes and summarizes clinical information with 100% visual document provenance. It does not diagnose diseases, prescribe medication changes, or replace licensed physician judgment.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '0.85rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <Lock size={14} color="#3B82F6" />
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  In-Report Ranges Only
                </span>
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                Medical reference intervals are parsed strictly from the laboratory report. If omitted, MedLens states &quot;Not Provided&quot; rather than hallucinating ranges.
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '0.85rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <Stethoscope size={14} color="#3B82F6" />
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  Doctor Discussion Prep
                </span>
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                Synthesizes safe, high-yield consultation questions for patient-physician partnership instead of automated diagnoses.
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '0.85rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <Check size={14} color="#166534" />
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  100% Visual Grounding
                </span>
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                Every data entity is anchored to exact pixel coordinates on the source document to eliminate hallucinations.
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '0.85rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <ShieldCheck size={14} color="#D97706" />
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  Human-in-the-Loop
                </span>
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                Low-confidence scans and character smudges are flagged to an audit queue for clinician verification before finalizing records.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#FFFFFF',
        }}>
          <button
            onClick={onClose}
            className="btn btn-primary btn-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
