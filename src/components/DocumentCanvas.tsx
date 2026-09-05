import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, FileText, CheckCircle2 } from 'lucide-react';
import { DocumentMeta, UserMode } from '../types';

interface DocumentCanvasProps {
  document: DocumentMeta;
  selectedBiomarkerId: string | null;
  onSelectBiomarker: (biomarkerId: string) => void;
  userMode: UserMode;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  document,
  selectedBiomarkerId,
  onSelectBiomarker,
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedBoxRef = useRef<SVGRectElement | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.7));
  const handleResetZoom = () => setZoom(1.0);

  // Auto-scroll to selected bounding box when selection changes
  useEffect(() => {
    if (!selectedBiomarkerId || !containerRef.current) return;
    const selectedMarker = document.biomarkers.find((b) => b.id === selectedBiomarkerId);
    if (!selectedMarker) return;

    const [ymin, , ymax] = selectedMarker.provenance.bbox;
    const midY = (ymin + ymax) / 2;
    const containerHeight = containerRef.current.clientHeight;
    const scrollTarget = (midY / 1000) * (containerRef.current.scrollHeight) - (containerHeight / 2);

    containerRef.current.scrollTo({
      top: Math.max(0, scrollTarget),
      behavior: 'smooth',
    });
  }, [selectedBiomarkerId, document]);

  const isFax = document.paperTheme === 'fax';

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: '#ffffff',
    }}>
      {/* Canvas Toolbar */}
      <div style={{
        padding: '0.65rem 1rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        fontSize: '0.78rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)', fontWeight: 600 }}>
            <FileText size={16} color="var(--color-primary)" />
            <span>Source Laboratory Document</span>
          </div>
          <span className="badge" style={{
            backgroundColor: isFax ? '#fffbeb' : '#eff6ff',
            color: isFax ? '#b45309' : 'var(--color-primary)',
            border: isFax ? '1px solid #fde68a' : '1px solid #bfdbfe',
          }}>
            {isFax ? 'Scanned Document' : 'Vector PDF'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>Page 1 of {document.pageCount}</span>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.25rem 0.45rem' }}
          >
            <ZoomOut size={13} />
          </button>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            minWidth: '40px',
            textAlign: 'center',
          }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.25rem 0.45rem' }}
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.25rem 0.45rem' }}
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Viewport Scroll Area */}
      <div
        ref={containerRef}
        className="document-viewport"
        style={{
          position: 'relative',
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {/* Rendered Document Sheet */}
        <div
          className={`paper-sheet ${isFax ? 'fax' : ''}`}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
            border: '1px solid #e2e8f0',
            padding: '2.25rem 1.75rem',
            position: 'relative',
            fontSize: '0.78rem',
            fontFamily: isFax ? '"Courier New", monospace' : 'var(--font-sans)',
            color: '#1e293b',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Header of Simulated Lab Sheet */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '0.65rem',
            marginBottom: '0.85rem',
          }}>
            <div>
              <h2 style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
              }}>
                {document.labName}
              </h2>
              <p style={{ fontSize: '0.68rem', color: '#64748b' }}>
                CLIA # 39D0928172 | CAP Accredited Clinical Laboratory | Medical Director: R. Sterling, MD
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a' }}>
                {document.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Report Date: {document.reportDate}
              </div>
            </div>
          </div>

          {/* Patient Details Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            backgroundColor: '#f8fafc',
            padding: '0.55rem 0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid #e2e8f0',
            fontSize: '0.72rem',
          }}>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Patient ID</span>
              <strong style={{ color: '#0f172a' }}>{document.patientIdentifier}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Age / Gender</span>
              <strong style={{ color: '#0f172a' }}>{document.patientAgeGender}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Accession #</span>
              <strong style={{ color: '#0f172a' }}>{document.accessionNumber}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Status</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>FINAL REPORT</span>
            </div>
          </div>

          {/* Visual Lab Results Table */}
          <div style={{ width: '100%', borderCollapse: 'collapse' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2.5fr 1fr 1fr 1.5fr 1fr',
              padding: '0.4rem 0.5rem',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              borderRadius: '3px 3px 0 0',
            }}>
              <div>Test Name</div>
              <div>In-Lab Result</div>
              <div>Units</div>
              <div>Reference Interval</div>
              <div>Flag</div>
            </div>

            {/* Document table rows */}
            {document.biomarkers.map((bm, index) => {
              const isSelected = bm.id === selectedBiomarkerId;
              const isSmudged = bm.confidence < 0.7;

              return (
                <div
                  key={bm.id}
                  onClick={() => onSelectBiomarker(bm.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 1fr 1fr 1.5fr 1fr',
                    padding: '0.45rem 0.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: isSelected
                      ? 'rgba(239, 246, 255, 0.9)'
                      : index % 2 === 0
                      ? 'transparent'
                      : '#f8fafc',
                    fontSize: '0.73rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {bm.rawLabel}
                  </div>
                  <div style={{
                    fontWeight: 700,
                    color: bm.status === 'HIGH' || bm.status === 'CRITICAL' ? '#b45309' : '#0f172a',
                    filter: isSmudged ? 'blur(0.5px)' : 'none',
                  }}>
                    {bm.rawValue} {bm.status === 'HIGH' ? '*' : ''}
                  </div>
                  <div style={{ color: '#475569' }}>
                    {bm.unit}
                  </div>
                  <div style={{ color: '#475569' }}>
                    {bm.referenceRange.rawText}
                  </div>
                  <div>
                    {bm.status === 'HIGH' && (
                      <span style={{
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                      }}>
                        HIGH
                      </span>
                    )}
                    {bm.status === 'LOW' && (
                      <span style={{
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                      }}>
                        LOW
                      </span>
                    )}
                    {bm.status === 'NORMAL' && (
                      <span style={{ color: '#059669', fontSize: '0.65rem', fontWeight: 600 }}>
                        NORMAL
                      </span>
                    )}
                    {bm.status === 'UNSPECIFIED' && (
                      <span style={{ color: '#64748b', fontSize: '0.65rem' }}>
                        --
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '0.65rem',
            borderTop: '1px solid #e2e8f0',
            fontSize: '0.62rem',
            color: '#64748b',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <div>
              * Reported values with asterisks fall outside this specific laboratory&apos;s established reference interval.<br />
              Tests performed under certified CLIA conditions. Electronic signature on file.
            </div>
            <div style={{ textAlign: 'right' }}>
              SHA-256: {document.fileHash.slice(0, 16)}...
            </div>
          </div>

          {/* SVG Bounding Boxes Overlay */}
          <svg
            viewBox="0 0 1000 1000"
            className="svg-overlay-layer"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {document.biomarkers.map((bm) => {
              const [ymin, xmin, ymax, xmax] = bm.provenance.bbox;
              const isSelected = bm.id === selectedBiomarkerId;
              const isLowConfidence = bm.confidence < 0.7;

              let strokeColor = 'rgba(5, 150, 105, 0.7)';
              let fillColor = 'rgba(5, 150, 105, 0.05)';

              if (bm.status === 'HIGH' || bm.status === 'LOW') {
                strokeColor = 'rgba(217, 119, 6, 0.8)';
                fillColor = 'rgba(217, 119, 6, 0.08)';
              } else if (isLowConfidence) {
                strokeColor = 'rgba(220, 38, 38, 0.85)';
                fillColor = 'rgba(220, 38, 38, 0.08)';
              }

              if (isSelected) {
                strokeColor = '#1d4ed8';
                fillColor = 'rgba(29, 78, 216, 0.15)';
              }

              return (
                <g key={bm.id} style={{ pointerEvents: 'auto' }}>
                  <rect
                    ref={isSelected ? selectedBoxRef : null}
                    x={xmin}
                    y={ymin}
                    width={xmax - xmin}
                    height={ymax - ymin}
                    rx="3"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={isLowConfidence ? '4,2' : 'none'}
                    className={`bbox-rect ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBiomarker(bm.id);
                    }}
                  >
                    <title>{`${bm.canonicalName}: ${bm.rawValue} ${bm.unit} (Confidence: ${(bm.confidence * 100).toFixed(0)}%)`}</title>
                  </rect>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Grounding Legend Bar */}
      <div style={{
        padding: '0.45rem 1rem',
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: '#ecfdf5', border: '1px solid #059669' }} />
            In Range
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: '#fffbeb', border: '1px solid #d97706' }} />
            Out of Range
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: '#eff6ff', border: '1.5px solid #1d4ed8' }} />
            Active Selection
          </span>
        </div>

        <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
          Click paper boxes or table cards to synchronize
        </span>
      </div>
    </div>
  );
};
