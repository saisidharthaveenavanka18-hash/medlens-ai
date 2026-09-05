import React from 'react';
import { 
  Calendar, 
  FileText, 
  ArrowDown, 
  Clock, 
  CheckCircle2, 
  Activity,
  Layers,
  ChevronDown
} from 'lucide-react';
import { DocumentMeta } from '../types';

interface TimelineViewProps {
  documents: DocumentMeta[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ documents }) => {
  // Sort documents chronologically by date
  const sortedDocs = [...documents].sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Header Banner */}
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
            <Clock size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
              Chronological Health Timeline
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#1E40AF', margin: '0.2rem 0 0' }}>
              Date &rarr; Document &rarr; Extracted Information Progression
            </p>
          </div>
        </div>

        <span style={{ fontSize: '0.78rem', color: '#1E40AF', fontWeight: 500 }}>
          {sortedDocs.length} Encounters Ordered Chronologically
        </span>
      </div>

      {sortedDocs.length === 0 ? (
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
            <Clock size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.4rem' }}>
            No timeline events yet
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', maxWidth: '420px', margin: '0 auto' }}>
            Upload medical reports to build an interactive chronological health progression.
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Continuous timeline line */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            bottom: '1rem',
            left: '27px',
            width: '2px',
            background: '#E2E8F0',
            zIndex: 0,
          }} />

          {sortedDocs.map((doc, idx) => (
          <div key={doc.id} style={{ position: 'relative', zIndex: 1 }}>
            
            {/* Step 1: Date Node */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: '#3B82F6',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                boxShadow: '0 0 0 4px #EFF6FF',
              }}>
                {idx + 1}
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#FFFFFF',
                border: '1px solid #BFDBFE',
                borderRadius: '6px',
                padding: '0.25rem 0.65rem',
                color: '#1E40AF',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}>
                <Calendar size={13} />
                <span>{doc.reportDate}</span>
              </div>
            </div>

            {/* Step 2: Document Card */}
            <div style={{ marginLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="card" style={{ padding: '1rem 1.25rem', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} color="#3B82F6" />
                    <strong style={{ fontSize: '0.925rem', color: '#334155' }}>{doc.title}</strong>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    {doc.labName}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Accession: <code>{doc.accessionNumber}</code> &bull; Page Count: {doc.pageCount} &bull; Overall Confidence: {(doc.overallConfidence * 100).toFixed(0)}%
                </div>
              </div>

              {/* Step 3: Extracted Information Cards */}
              <div className="card" style={{ padding: '1rem 1.25rem', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  <Activity size={13} color="#3B82F6" />
                  <span>Extracted Laboratory Tests &amp; Observations:</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                  {doc.biomarkers.map((bm) => (
                    <div
                      key={bm.id}
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        padding: '0.65rem 0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                          {bm.canonicalName}
                        </span>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          background: bm.status === 'HIGH' ? '#FFFBEB' : bm.status === 'LOW' ? '#EFF6FF' : '#F0FDF4',
                          color: bm.status === 'HIGH' ? '#92400E' : bm.status === 'LOW' ? '#1E40AF' : '#166534',
                          border: `1px solid ${bm.status === 'HIGH' ? '#FDE68A' : bm.status === 'LOW' ? '#BFDBFE' : '#BBF7D0'}`,
                        }}>
                          {bm.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                        {bm.rawValue} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>{bm.unit}</span>
                      </div>

                      <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem' }}>
                        Ref: {bm.referenceRange.rawText}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

    </div>
  );
};
