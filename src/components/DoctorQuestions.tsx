import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Printer, 
  Stethoscope, 
  ShieldCheck, 
  HelpCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Info
} from 'lucide-react';
import { DocumentMeta, BiomarkerRecord } from '../types';

interface DoctorQuestionsProps {
  documents: DocumentMeta[];
}

export const DoctorQuestions: React.FC<DoctorQuestionsProps> = ({ documents }) => {
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // Dynamically aggregate all biomarkers across uploaded documents
  const allBiomarkers: { doc: DocumentMeta; bm: BiomarkerRecord }[] = [];
  documents.forEach((doc) => {
    doc.biomarkers.forEach((bm) => {
      allBiomarkers.push({ doc, bm });
    });
  });

  const abnormalItems = allBiomarkers.filter(
    (item) => item.bm.status === 'LOW' || item.bm.status === 'HIGH' || item.bm.referenceRange.isMissingInReport
  );

  // Clinically safe findings grounded strictly in actual uploaded reports
  const keyFindings = abnormalItems.slice(0, 3).map((item) => ({
    title: `${item.bm.canonicalName} (${item.bm.status})`,
    desc: `${item.bm.canonicalName} was measured at ${item.bm.rawValue} ${item.bm.unit} (Printed Ref: ${item.bm.referenceRange.rawText}) in ${item.doc.labName} on ${item.doc.reportDate}.`,
    status: item.bm.status === 'HIGH' ? 'monitor' : item.bm.status === 'LOW' ? 'attention' : 'improving',
  }));

  const abnormalities = abnormalItems.map((item) => ({
    marker: item.bm.canonicalName,
    current: `${item.bm.rawValue} ${item.bm.unit}`,
    range: item.bm.referenceRange.rawText,
    flag: item.bm.status === 'HIGH' ? 'High' : item.bm.status === 'LOW' ? 'Low' : 'Range Unavailable',
    flagType: item.bm.status === 'HIGH' || item.bm.status === 'LOW' ? 'warning' : 'info',
    lab: `${item.doc.labName} (${item.doc.reportDate})`,
  }));

  // Synthesize clinically safe discussion questions grounded strictly in the actual tests
  const synthesizedQuestions = abnormalItems.map((item) => {
    if (item.bm.status === 'HIGH') {
      return {
        topic: `${item.bm.category || 'Laboratory'} Trajectory`,
        marker: item.bm.canonicalName,
        question: `My test for ${item.bm.canonicalName} measured ${item.bm.rawValue} ${item.bm.unit}, which is above the printed lab interval (${item.bm.referenceRange.rawText}). What follow-up steps or lifestyle adjustments do you recommend to monitor this?`,
        rationale: `Directly questions elevated ${item.bm.canonicalName} without guessing underlying pathology.`,
      };
    } else if (item.bm.status === 'LOW') {
      return {
        topic: `${item.bm.category || 'Nutritional/Metabolic'} Evaluation`,
        marker: item.bm.canonicalName,
        question: `My recent test showed ${item.bm.canonicalName} at ${item.bm.rawValue} ${item.bm.unit}, below the normal reference range (${item.bm.referenceRange.rawText}). Do you advise dietary changes, lifestyle modification, or supplementation?`,
        rationale: `Constructive discussion prompt for below-reference result.`,
      };
    } else {
      return {
        topic: 'Reference Interval Clarification',
        marker: item.bm.canonicalName,
        question: `On my report from ${item.doc.labName}, ${item.bm.canonicalName} was measured at ${item.bm.rawValue} ${item.bm.unit}, but no reference range was printed. How does your practice clinically evaluate this measurement?`,
        rationale: `Addresses unprinted laboratory intervals responsibly.`,
      };
    }
  });

  const handleCopy = () => {
    const text = synthesizedQuestions
      .map((q, i) => `${i + 1}. [${q.topic}] ${q.question}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* AI Summary Banner: Very light blue background (#EFF6FF), dark blue text */}
      <div style={{
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '10px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            background: '#DBEAFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1E40AF',
            flexShrink: 0,
          }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
                Clinical AI Summary & Findings
              </h2>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#1E40AF',
                background: '#DBEAFE',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #BFDBFE',
              }}>
                Evidence-Grounded
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#1E40AF', fontWeight: 500, margin: '0.25rem 0 0' }}>
              AI-generated summary — requires clinician verification.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button
            onClick={handleCopy}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
          >
            {copied ? <Check size={14} color="#166534" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Questions'}
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
          >
            <Printer size={14} />
            Print Checklist
          </button>
        </div>
      </div>

      {/* Grid: Key Findings & Significant Abnormalities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Key Findings Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingBottom: '0.75rem',
            marginBottom: '1rem',
            borderBottom: '1px solid #F1F5F9',
          }}>
            <Activity size={17} color="#3B82F6" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
              Key Findings & Longitudinal Trends
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {keyFindings.map((finding, idx) => (
              <div
                key={idx}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                    {finding.title}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: finding.status === 'improving' ? '#F0FDF4' : '#FFFBEB',
                    color: finding.status === 'improving' ? '#166534' : '#92400E',
                    border: `1px solid ${finding.status === 'improving' ? '#BBF7D0' : '#FDE68A'}`,
                  }}>
                    {finding.status === 'improving' ? 'Improving' : 'Monitor'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.45, margin: 0 }}>
                  {finding.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Significant Abnormalities Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingBottom: '0.75rem',
            marginBottom: '1rem',
            borderBottom: '1px solid #F1F5F9',
          }}>
            <AlertCircle size={17} color="#F59E0B" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
              Significant Abnormalities (Lab Assayed)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {abnormalities.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                    {item.marker}
                  </span>
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                    {item.flag}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: '#64748B' }}>
                  <span>Observed: <strong style={{ color: '#334155' }}>{item.current}</strong></span>
                  <span>Ref: {item.range}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                  Source: {item.lab}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Doctor Discussion Guide Questions Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid #F1F5F9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
            }}>
              <Stethoscope size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                Doctor Discussion Guide (Synthesized Questions)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                Objective questions to support meaningful patient-doctor dialogues
              </p>
            </div>
          </div>

          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            {Object.values(checkedItems).filter(Boolean).length} of {synthesizedQuestions.length} checked
          </span>
        </div>

        {/* Questions list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {synthesizedQuestions.map((item, idx) => {
            const isChecked = !!checkedItems[idx];

            return (
              <div
                key={idx}
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: '8px',
                  border: isChecked ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                  background: isChecked ? '#F0FDF4' : '#FFFFFF',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCheck(idx)}
                    style={{
                      marginTop: '0.2rem',
                      width: '16px',
                      height: '16px',
                      accentColor: '#3B82F6',
                      cursor: 'pointer',
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#3B82F6',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}>
                        {item.topic} &bull; {item.marker}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                        Question #{idx + 1}
                      </span>
                    </div>

                    <p style={{
                      fontSize: '0.875rem',
                      color: isChecked ? '#64748B' : '#334155',
                      fontWeight: 500,
                      lineHeight: 1.5,
                      marginBottom: '0.45rem',
                      textDecoration: isChecked ? 'line-through' : 'none',
                    }}>
                      &ldquo;{item.question}&rdquo;
                    </p>

                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748B',
                      background: isChecked ? '#DCFCE7' : '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                    }}>
                      <strong style={{ color: '#334155' }}>Clinical Rationale:</strong> {item.rationale}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
