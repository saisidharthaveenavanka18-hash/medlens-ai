import React, { useState } from 'react';
import { 
  Search, 
  Crosshair, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle, 
  FileEdit, 
  Info,
  Stethoscope,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { BiomarkerRecord, UserMode } from '../types';
import { SourceBadge } from './SourceBadge';

interface BiomarkerPanelProps {
  biomarkers: BiomarkerRecord[];
  selectedBiomarkerId: string | null;
  onSelectBiomarker: (id: string) => void;
  onOpenVerification: (biomarker: BiomarkerRecord) => void;
  userMode: UserMode;
}

export const BiomarkerPanel: React.FC<BiomarkerPanelProps> = ({
  biomarkers,
  selectedBiomarkerId,
  onSelectBiomarker,
  onOpenVerification,
  userMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const categories = ['All', 'Metabolic', 'Lipid', 'Renal', 'Hepatic', 'Other'];

  const filteredBiomarkers = biomarkers.filter((bm) => {
    const matchesSearch = 
      bm.canonicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bm.rawLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || bm.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#ffffff',
      overflow: 'hidden',
    }}>
      {/* Top Header & Search Filter */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              Structured Laboratory Results
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {biomarkers.length} entities extracted and grounded with visual coordinates
            </p>
          </div>

          <SourceBadge source="AI_EXTRACTED" size="sm" />
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }} />
          <input
            type="text"
            placeholder="Search laboratory tests (e.g. Glucose, ALT, Creatinine)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.45rem 0.75rem 0.45rem 2.2rem',
              color: 'var(--text-primary)',
              fontSize: '0.825rem',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          />
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                backgroundColor: selectedCategory === cat ? 'var(--color-primary-light)' : '#f8fafc',
                border: selectedCategory === cat ? '1px solid var(--color-primary-border)' : '1px solid var(--border-subtle)',
                color: selectedCategory === cat ? 'var(--color-primary)' : 'var(--text-secondary)',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.725rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Biomarkers List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {filteredBiomarkers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Info size={28} style={{ margin: '0 auto 0.5rem auto', color: '#94a3b8' }} />
            <p style={{ fontSize: '0.85rem' }}>No laboratory tests match the current filter.</p>
          </div>
        ) : (
          filteredBiomarkers.map((bm) => {
            const isSelected = bm.id === selectedBiomarkerId;
            const isExpanded = !!expandedCards[bm.id];
            const isLowConfidence = bm.confidence < 0.7;
            const isMissingRange = bm.referenceRange.isMissingInReport;

            return (
              <div
                key={bm.id}
                onClick={() => onSelectBiomarker(bm.id)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: isSelected
                    ? '1.5px solid var(--color-primary)'
                    : isLowConfidence
                    ? '1px solid #fca5a5'
                    : '1px solid var(--border-card)',
                  backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                  boxShadow: isSelected ? '0 2px 8px rgba(29, 78, 216, 0.08)' : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                }}
              >
                {/* Top Row: Name, Status Pill, and Value */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {bm.canonicalName}
                      </h4>
                      {bm.verificationStatus === 'VERIFIED' && (
                        <SourceBadge source="HUMAN_VERIFIED" size="sm" />
                      )}
                      {bm.verificationStatus === 'PENDING' && (
                        <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>
                          Needs Review
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Report label: <code style={{ color: 'var(--text-secondary)' }}>{bm.rawLabel}</code>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: bm.status === 'HIGH' ? '#b45309' : bm.status === 'LOW' ? '#1e40af' : 'var(--text-primary)',
                      }}>
                        {bm.rawValue}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {bm.unit}
                      </span>
                    </div>

                    {/* Distinct Status Indicator (Never rely on color alone) */}
                    <div style={{ marginTop: '0.15rem' }}>
                      {bm.status === 'NORMAL' && (
                        <span className="badge badge-normal">
                          <CheckCircle2 size={10} /> Normal
                        </span>
                      )}
                      {bm.status === 'HIGH' && (
                        <span className="badge badge-high">
                          <ArrowUpRight size={10} /> High
                        </span>
                      )}
                      {bm.status === 'LOW' && (
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                          <ArrowDownRight size={10} /> Low
                        </span>
                      )}
                      {bm.status === 'CRITICAL' && (
                        <span className="badge badge-critical">
                          <AlertTriangle size={10} /> Critical
                        </span>
                      )}
                      {bm.status === 'UNSPECIFIED' && (
                        <span className="badge badge-unspecified">
                          No Lab Range
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reference Range Strip (Displayed beside/under value) */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px',
                  marginBottom: '0.5rem',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.725rem',
                }}>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Reference Range: <strong style={{ color: 'var(--text-primary)' }}>{bm.referenceRange.rawText}</strong> <span style={{ color: 'var(--text-muted)' }}>{bm.unit}</span>
                  </div>

                  {isMissingRange ? (
                    <span style={{ fontSize: '0.675rem', color: '#6b7280', fontStyle: 'italic' }}>
                      Not provided by lab (Not invented)
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                      {bm.referenceRange.conditionQualifier || bm.referenceRange.sourceCitation}
                    </span>
                  )}
                </div>

                {/* Action Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.35rem',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '0.725rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBiomarker(bm.id);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                      title="Locate coordinates on document sheet"
                    >
                      <Crosshair size={11} color="var(--color-primary)" />
                      Locate on PDF
                    </button>

                    {userMode === 'clinician' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenVerification(bm);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                      >
                        <FileEdit size={11} />
                        Verify
                      </button>
                    )}

                    <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                      Confidence: {(bm.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <button
                    onClick={(e) => toggleExpand(bm.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>{isExpanded ? 'Hide Context' : 'Clinical Context'}</span>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                {/* Educational Context Drawer */}
                {isExpanded && (
                  <div style={{
                    marginTop: '0.65rem',
                    paddingTop: '0.65rem',
                    borderTop: '1px dashed #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                  }}>
                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                    }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.72rem', display: 'block', marginBottom: '0.15rem' }}>
                        Biomarker Role:
                      </strong>
                      <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {bm.educationalNote}
                      </p>
                    </div>

                    {bm.clinicalQuestions.length > 0 && (
                      <div style={{
                        backgroundColor: '#eff6ff',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe',
                      }}>
                        <strong style={{ color: '#1e40af', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                          <Stethoscope size={12} /> Discussion Question for Doctor:
                        </strong>
                        <p style={{ fontSize: '0.72rem', color: '#1e3a8a', lineHeight: 1.45 }}>
                          &ldquo;{bm.clinicalQuestions[0]}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
