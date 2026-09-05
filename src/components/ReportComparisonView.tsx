import React, { useState } from 'react';
import { 
  GitCompare, 
  ArrowRight, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { DocumentMeta, BiomarkerRecord } from '../types';

interface ReportComparisonViewProps {
  documents: DocumentMeta[];
}

export const ReportComparisonView: React.FC<ReportComparisonViewProps> = ({
  documents,
}) => {
  // Ensure we have at least 2 reports to compare
  const [reportAId, setReportAId] = useState<string>(documents[0]?.id || '');
  const [reportBId, setReportBId] = useState<string>(documents[1]?.id || documents[0]?.id || '');

  const reportA = documents.find((d) => d.id === reportAId) || documents[0];
  const reportB = documents.find((d) => d.id === reportBId) || documents[1] || documents[0];

  // Match laboratory tests between report A and report B by canonical name
  const matchingTests = (reportA && reportB) ? reportA.biomarkers.map((bmA) => {
    const bmB = reportB.biomarkers.find((b) => b.canonicalName === bmA.canonicalName);
    
    let observedChange: string = 'N/A';
    let numericDiff: number | null = null;

    if (bmA.numericValue !== null && bmB && bmB.numericValue !== null) {
      numericDiff = Number((bmB.numericValue - bmA.numericValue).toFixed(2));
      observedChange = numericDiff > 0 ? `+${numericDiff}` : `${numericDiff}`;
    }

    return {
      testName: bmA.canonicalName,
      unit: bmA.unit,
      referenceRange: bmA.referenceRange.rawText,
      previousValue: bmA.rawValue,
      previousNumeric: bmA.numericValue,
      currentValue: bmB ? bmB.rawValue : 'Not Measured in Report B',
      currentNumeric: bmB ? bmB.numericValue : null,
      observedChange,
      numericDiff,
    };
  }) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Top Banner */}
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
              Report Comparison &amp; Observed Change Analysis
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#1E40AF', margin: '0.2rem 0 0' }}>
              Side-by-side comparison of matching laboratory tests across clinical encounters
            </p>
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#1E40AF', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} />
          <span>Factual Numerical Changes Only &bull; Zero Speculative Diagnosis</span>
        </div>
      </div>

      {documents.length < 2 ? (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: '#FFFFFF' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
          }}>
            <GitCompare size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.4rem' }}>
            At least two reports required for comparison
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', maxWidth: '440px', margin: '0 auto' }}>
            Upload two or more laboratory reports to view side-by-side numerical differences and trend comparisons.
          </p>
        </div>
      ) : (
        <>
          {/* Selectors Bar */}
          <div className="card" style={{
            padding: '1.15rem 1.25rem',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '1rem',
            background: '#FFFFFF',
          }}>
        {/* Previous Report Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
            Previous Report (Baseline):
          </label>
          <select
            value={reportAId}
            onChange={(e) => setReportAId(e.target.value)}
            style={{
              width: '100%',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '0.45rem 0.65rem',
              color: '#334155',
              fontSize: '0.8125rem',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.reportDate} &bull; {d.title} ({d.labName})
              </option>
            ))}
          </select>
        </div>

        <div style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '1.2rem' }}>
          <ArrowRight size={20} />
        </div>

        {/* Current Report Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
            Current Report (Follow-Up):
          </label>
          <select
            value={reportBId}
            onChange={(e) => setReportBId(e.target.value)}
            style={{
              width: '100%',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '0.45rem 0.65rem',
              color: '#334155',
              fontSize: '0.8125rem',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.reportDate} &bull; {d.title} ({d.labName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
            Matching Laboratory Test Comparison
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            {matchingTests.length} tests evaluated
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569' }}>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Test Name</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Reference Range</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Previous ({reportA.reportDate})</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Current ({reportB.reportDate})</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>Observed Change</th>
            </tr>
          </thead>
          <tbody>
            {matchingTests.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid #F1F5F9',
                  background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                }}
              >
                <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: '#334155' }}>
                  {row.testName}
                </td>

                <td style={{ padding: '0.75rem 0.85rem', color: '#64748B' }}>
                  {row.referenceRange} {row.unit}
                </td>

                <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: '#334155' }}>
                  {row.previousValue} {row.unit}
                </td>

                <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: '#334155' }}>
                  {row.currentValue} {row.currentNumeric !== null ? row.unit : ''}
                </td>

                <td style={{ padding: '0.75rem 0.85rem' }}>
                  {row.numericDiff !== null ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 700,
                      color: row.numericDiff > 0 ? '#1E40AF' : row.numericDiff < 0 ? '#166534' : '#64748B',
                    }}>
                      {row.numericDiff > 0 ? <TrendingUp size={14} /> : row.numericDiff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                      <span>{row.observedChange} {row.unit}</span>
                    </div>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Safety Notice (Zero Medical Interpretation) */}
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.78rem',
        color: '#64748B',
      }}>
        <Info size={15} color="#3B82F6" style={{ flexShrink: 0 }} />
        <span>
          <strong>Clinical Safety Guideline:</strong> Only observed numerical changes are shown. MedLens does not medically interpret variations or infer clinical conditions from delta values.
        </span>
      </div>
      </>
      )}

    </div>
  );
};
