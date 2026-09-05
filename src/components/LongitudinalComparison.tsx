import React, { useState } from 'react';
import { 
  GitCompare, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { DocumentMeta, ConflictRecord } from '../types';

interface LongitudinalComparisonProps {
  documents: DocumentMeta[];
  conflicts: ConflictRecord[];
  onSelectBiomarkerForProvenance?: (docId: string, biomarkerId: string) => void;
}

export const LongitudinalComparison: React.FC<LongitudinalComparisonProps> = ({
  documents,
  conflicts,
}) => {
  const [activeMetric, setActiveMetric] = useState<string>('Total Cholesterol');

  // Biomarkers tracked longitudinally across reports
  const trackedBiomarkers = [
    { canonical: 'Total Cholesterol', unit: 'mg/dL', category: 'Lipid' },
    { canonical: 'LDL Cholesterol (Calculated)', unit: 'mg/dL', category: 'Lipid' },
    { canonical: 'HDL Cholesterol', unit: 'mg/dL', category: 'Lipid' },
    { canonical: 'Triglycerides', unit: 'mg/dL', category: 'Lipid' },
    { canonical: 'Fasting Blood Glucose', unit: 'mg/dL', category: 'Metabolic' },
    { canonical: 'Creatinine', unit: 'mg/dL', category: 'Renal' },
    { canonical: 'ALT (Alanine Aminotransferase)', unit: 'U/L', category: 'Hepatic' },
    { canonical: 'AST (Aspartate Aminotransferase)', unit: 'U/L', category: 'Hepatic' },
  ];

  // Helper to extract series data for selected metric
  const getSeriesForMetric = (metricName: string) => {
    return documents.map((doc) => {
      const match = doc.biomarkers.find((b) => b.canonicalName === metricName);
      return {
        date: doc.reportDate,
        lab: doc.labName,
        value: match ? match.numericValue : null,
        rawValue: match ? match.rawValue : 'N/A',
        status: match ? match.status : 'UNSPECIFIED',
        rangeText: match ? match.referenceRange.rawText : 'N/A',
        lower: match ? match.referenceRange.lower : null,
        upper: match ? match.referenceRange.upper : null,
        unit: match ? match.unit : '',
      };
    }).filter((pt) => pt.value !== null);
  };

  const currentSeries = getSeriesForMetric(activeMetric);

  // Calculate delta between oldest and newest point
  const firstVal = currentSeries[0]?.value ?? null;
  const lastVal = currentSeries[currentSeries.length - 1]?.value ?? null;
  let percentChange: number | null = null;
  let absChange: number | null = null;

  if (firstVal !== null && lastVal !== null && firstVal > 0) {
    absChange = Number((lastVal - firstVal).toFixed(1));
    percentChange = Number((((lastVal - firstVal) / firstVal) * 100).toFixed(1));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* Top Banner: Overview */}
      <div className="card" style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '8px',
            background: '#DBEAFE',
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <GitCompare size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
              Multi-Report Longitudinal Health Matrix
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#1E40AF', margin: '0.2rem 0 0' }}>
              Tracking {documents.length} verified laboratory reports across time
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem' }}>
          <div style={{ background: '#FFFFFF', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Harmonized Tests</span>
            <strong style={{ color: '#334155', fontSize: '0.925rem' }}>8 Biomarkers</strong>
          </div>
          <div style={{ background: '#FFFFFF', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #FDE68A' }}>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>Discrepancies</span>
            <strong style={{ color: '#92400E', fontSize: '0.925rem' }}>{conflicts.length} Flagged</strong>
          </div>
        </div>
      </div>

      {/* Cross-Lab Conflict Alerts Section */}
      {conflicts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
            <AlertTriangle size={15} />
            Cross-Laboratory Variance &amp; Reference Interval Conflicts
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {conflicts.map((c) => (
              <div
                key={c.id}
                className="card"
                style={{
                  padding: '1rem',
                  border: c.severity === 'ALERT' ? '1px solid #FECACA' : '1px solid #FDE68A',
                  background: c.severity === 'ALERT' ? '#FEF2F2' : '#FFFBEB',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: c.severity === 'ALERT' ? '#991B1B' : '#92400E' }}>
                    {c.description}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: '#FFFFFF',
                    color: c.severity === 'ALERT' ? '#991B1B' : '#92400E',
                    border: `1px solid ${c.severity === 'ALERT' ? '#FECACA' : '#FDE68A'}`,
                  }}>
                    {c.type}
                  </span>
                </div>

                <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45, marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>
                  {c.details}
                </p>

                <div style={{
                  background: '#FFFFFF',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#1E40AF',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}>
                  <ShieldCheck size={14} style={{ flexShrink: 0 }} />
                  <span>{c.resolutionHint}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Interactive Matrix Table */}
      <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginBottom: '0.875rem' }}>
          Longitudinal Biomarker Progression Matrix
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', background: '#F8FAFC' }}>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Biomarker / Panel</th>
              {documents.map((d) => (
                <th key={d.id} style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#334155' }}>
                    <Calendar size={13} color="#3B82F6" />
                    {d.reportDate}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 400 }}>
                    {d.labName.split(' ')[0]} Lab
                  </div>
                </th>
              ))}
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Trajectory Delta</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {trackedBiomarkers.map((bmMeta) => {
              const pts = documents.map((doc) => doc.biomarkers.find((b) => b.canonicalName === bmMeta.canonical));
              const first = pts[0]?.numericValue ?? null;
              const latest = pts[pts.length - 1]?.numericValue ?? null;
              const hasDiff = first !== null && latest !== null;
              const deltaPct = hasDiff && first! > 0 ? (((latest! - first!) / first!) * 100).toFixed(1) : null;
              const isSelected = activeMetric === bmMeta.canonical;

              return (
                <tr
                  key={bmMeta.canonical}
                  onClick={() => setActiveMetric(bmMeta.canonical)}
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    background: isSelected ? '#EFF6FF' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <div style={{ fontWeight: 600, color: '#334155' }}>{bmMeta.canonical}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      Unit: {bmMeta.unit} ({bmMeta.category})
                    </div>
                  </td>

                  {/* Document date values */}
                  {pts.map((pt, idx) => (
                    <td key={idx} style={{ padding: '0.75rem 0.85rem' }}>
                      {pt ? (
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '0.3rem',
                            fontWeight: 600,
                            color: '#334155',
                          }}>
                            <span>{pt.rawValue}</span>
                            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{pt.unit}</span>
                            {pt.status === 'HIGH' && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>High</span>}
                            {pt.status === 'LOW' && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Low</span>}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            Ref: {pt.referenceRange.rawText}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>--</span>
                      )}
                    </td>
                  ))}

                  {/* Delta trajectory column */}
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    {hasDiff && deltaPct !== null ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontWeight: 600,
                        color: parseFloat(deltaPct) < 0 ? '#166534' : parseFloat(deltaPct) > 0 ? '#92400E' : '#64748B',
                      }}>
                        {parseFloat(deltaPct) < 0 ? <TrendingDown size={14} /> : parseFloat(deltaPct) > 0 ? <TrendingUp size={14} /> : <Minus size={14} />}
                        <span>{parseFloat(deltaPct) > 0 ? `+${deltaPct}%` : `${deltaPct}%`}</span>
                      </div>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Single point</span>
                    )}
                  </td>

                  {/* Action */}
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <button
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                    >
                      {isSelected ? 'Viewing' : 'View Trend'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Trend Curve with Lab Reference Corridor */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', margin: 0 }}>{activeMetric}</h3>
              <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>
                Time-Series Plot
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0' }}>
              Historical readings across reports with normal reference corridor
            </p>
          </div>

          {percentChange !== null && (
            <div style={{
              background: '#F8FAFC',
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              textAlign: 'right',
            }}>
              <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Net Change</span>
              <strong style={{
                color: percentChange < 0 ? '#166534' : '#92400E',
                fontSize: '0.925rem',
              }}>
                {percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`} ({absChange !== null && absChange > 0 ? `+${absChange}` : (absChange ?? 0)})
              </strong>
            </div>
          )}
        </div>

        {/* SVG Sparkline & Reference Area Chart */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          padding: '1.25rem',
          position: 'relative',
        }}>
          <svg viewBox="0 0 800 200" style={{ width: '100%', height: '200px', overflow: 'visible' }}>
            <defs>
              <linearGradient id="corridorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#86EFAC" stopOpacity="0.15" />
              </linearGradient>
            </defs>

            {/* Shaded Normal Corridor */}
            <rect x="50" y="55" width="700" height="80" fill="url(#corridorGrad)" rx="6" />
            <text x="60" y="72" fill="#166534" fontSize="11" fontWeight="600">
              Laboratory Normal Reference Range Corridor
            </text>

            {/* Baseline Grid lines */}
            <line x1="50" y1="160" x2="750" y2="160" stroke="#E2E8F0" strokeDasharray="4,4" />
            <line x1="50" y1="95" x2="750" y2="95" stroke="#E2E8F0" strokeDasharray="4,4" />

            {/* Connecting curve */}
            {currentSeries.length >= 2 && (
              <path
                d={`M 150,${180 - (currentSeries[0]?.value || 100) * 0.65} 
                    L 400,${180 - (currentSeries[1]?.value || 100) * 0.65} 
                    ${currentSeries[2] ? `L 650,${180 - (currentSeries[2]?.value || 100) * 0.65}` : ''}`}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {currentSeries.map((pt, i) => {
              const cx = 150 + i * 250;
              const cy = Math.max(30, Math.min(170, 180 - (pt.value || 100) * 0.65));
              const isHigh = pt.status === 'HIGH';

              return (
                <g key={i}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r="6"
                    fill={isHigh ? '#F59E0B' : '#3B82F6'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  {/* Tooltip value */}
                  <text
                    x={cx}
                    y={cy - 12}
                    textAnchor="middle"
                    fill="#334155"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {pt.rawValue} {pt.unit}
                  </text>
                  {/* Date and lab below */}
                  <text
                    x={cx}
                    y={180}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {pt.date}
                  </text>
                  <text
                    x={cx}
                    y={193}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="9"
                  >
                    {pt.lab.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Responsible AI note */}
        <div style={{
          marginTop: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.75rem',
          color: '#64748B',
        }}>
          <Info size={14} color="#3B82F6" />
          <span>
            <strong>Clinical Context Note:</strong> Historical trends reflect observed values from discrete tests. Clinical interpretation requires factoring assay methodologies and physiological state.
          </span>
        </div>
      </div>
    </div>
  );
};
