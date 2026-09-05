import React from 'react';
import { User, Zap, Sparkles, ShieldCheck } from 'lucide-react';
import { SourceLabel } from '../types';

interface SourceBadgeProps {
  source: SourceLabel;
  size?: 'sm' | 'md';
  showExplanation?: boolean;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ 
  source, 
  size = 'md',
  showExplanation = false,
}) => {
  const isSm = size === 'sm';

  const badgeConfigs = {
    USER_PROVIDED: {
      label: 'Patient Provided',
      internalKey: 'SOURCE = USER_PROVIDED',
      icon: <User size={isSm ? 10 : 12} />,
      color: '#065f46',
      bg: '#ecfdf5',
      border: '1px solid #a7f3d0',
      tooltip: 'Self-reported by patient during clinical intake form (Unverified history)',
    },
    AI_EXTRACTED: {
      label: 'Extracted from Report',
      internalKey: 'SOURCE = AI_EXTRACTED',
      icon: <Zap size={isSm ? 10 : 12} />,
      color: '#1e40af',
      bg: '#eff6ff',
      border: '1px solid #bfdbfe',
      tooltip: 'Extracted directly from laboratory document using vector stream & OCR',
    },
    AI_GENERATED: {
      label: 'AI-Generated',
      internalKey: 'SOURCE = AI_GENERATED',
      icon: <Sparkles size={isSm ? 10 : 12} />,
      color: '#5b21b6',
      bg: '#f5f3ff',
      border: '1px solid #ddd6fe',
      tooltip: 'Synthesized clinical consultation questions & educational summaries',
    },
    HUMAN_VERIFIED: {
      label: 'Clinician Verified',
      internalKey: 'SOURCE = HUMAN_VERIFIED',
      icon: <ShieldCheck size={isSm ? 10 : 12} />,
      color: '#115e59',
      bg: '#f0fdfa',
      border: '1px solid #99f6e4',
      tooltip: 'Clinically audited & verified by healthcare provider',
    },
  };

  const config = badgeConfigs[source] || badgeConfigs.USER_PROVIDED;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
      <span
        title={`${config.internalKey}: ${config.tooltip}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: isSm ? '0.2rem' : '0.35rem',
          padding: isSm ? '0.12rem 0.4rem' : '0.2rem 0.55rem',
          borderRadius: '9999px',
          backgroundColor: config.bg,
          border: config.border,
          color: config.color,
          fontSize: isSm ? '0.675rem' : '0.725rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
          cursor: 'help',
          lineHeight: 1.2,
        }}
      >
        {config.icon}
        <span>{config.label}</span>
      </span>

      {showExplanation && (
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          ({config.internalKey})
        </span>
      )}
    </div>
  );
};
