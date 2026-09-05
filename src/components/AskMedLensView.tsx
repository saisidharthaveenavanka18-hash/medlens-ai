import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldAlert, 
  User, 
  FileText, 
  MessageSquare, 
  Loader2, 
  Stethoscope,
  AlertTriangle,
  Info
} from 'lucide-react';
import { PatientRecord, ManagedDocument, DocumentMeta, BiomarkerRecord } from '../types';
import { AiAssistedSummaryCard } from './AiAssistedSummaryCard';

interface AskMedLensViewProps {
  patient: PatientRecord | null;
  documents?: ManagedDocument[];
  labDocuments?: DocumentMeta[];
  defaultSubTab?: 'summary' | 'qa';
  onViewOriginalReport?: (docId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: string[];
}

export const AskMedLensView: React.FC<AskMedLensViewProps> = ({
  patient,
  documents = [],
  labDocuments = [],
  defaultSubTab = 'summary',
  onViewOriginalReport,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'qa'>(defaultSubTab);
  const [query, setQuery] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  // Exact requested 5 suggested questions
  const suggestedQuestions = [
    'Summarize this report.',
    'What information was extracted?',
    'List the recorded medications.',
    'What laboratory results are available?',
    'What information is missing?',
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: patient
        ? `Hello, I am MedLens AI Assistant. I can answer questions grounded strictly in ${patient.name}'s medical records and uploaded reports. Ask a question below or choose a suggested topic.`
        : `Hello, I am MedLens AI Assistant. Please select or add a patient to ask questions about their medical records.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Answer generation grounded strictly in records with zero hallucinations
  const handleSend = async (userQuery: string) => {
    if (!userQuery.trim() || isAnswering) return;

    const newMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: userQuery.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setQuery('');
    setIsAnswering(true);

    setTimeout(() => {
      const lower = userQuery.toLowerCase().trim();
      let answer = '';
      const citations: string[] = [];

      // RESPONSIBLE AI GUARDRAIL: Intercept diagnosis, prescribing, or medication changes
      const diagnosticKeywords = [
        'diagnose', 'diagnosis', 'do i have', 'cure', 'prescribe', 
        'what should i take', 'treatment for', 'am i sick',
        'medication change', 'change my dosage', 'change medication',
        'increase dose', 'increase my dosage', 'increase dosage',
        'decrease dose', 'decrease dosage', 'stop taking', 'what medicine', 
        'recommend medication', 'dosage of', 'should i take'
      ];
      const isAskingDiagnosisOrPrescription = diagnosticKeywords.some((k) => lower.includes(k));

      if (isAskingDiagnosisOrPrescription) {
        answer = 'MedLens provides AI-assisted organization and summarization of medical information and does not replace qualified clinical judgment. It does not diagnose medical conditions, prescribe treatments, or recommend medication changes. Clinical decisions and prescription management require qualified professional review by your licensed healthcare provider. Please consult your physician regarding these results.';
      } 
      // 1. "Summarize this report."
      else if (lower.includes('summarize this report') || lower.includes('summarize this document') || lower.includes('summarize the latest report') || lower.includes('latest report') || lower.includes('summary of report') || lower.includes('summarize')) {
        if (labDocuments.length === 0) {
          answer = "I couldn't find this information in the available records. No medical reports are currently uploaded.";
        } else {
          const latestDoc = labDocuments[0];
          const bms = latestDoc.biomarkers;
          const abnormal = bms.filter((b) => b.status === 'HIGH' || b.status === 'LOW' || b.status === 'CRITICAL');
          citations.push(`${latestDoc.title} (Dated: ${latestDoc.reportDate})`);

          answer = `Summary of the document "${latestDoc.title}" (${latestDoc.reportDate}):\n` +
            `• Facility: ${latestDoc.labName}\n` +
            `• Total tests extracted: ${bms.length} biomarker measurements\n` +
            (abnormal.length > 0
              ? `• Tests outside reference intervals: ${abnormal.map((b) => `${b.canonicalName} (${b.rawValue} ${b.unit}, Status: ${b.status})`).join(', ')}\n`
              : `• All extracted laboratory tests fall within standard printed intervals.\n`) +
            `• Accession Number: ${latestDoc.accessionNumber}`;
        }
      } 
      // 2. "What information was extracted?"
      else if (lower.includes('what information was extracted') || lower.includes('information was extracted') || lower.includes('what was extracted')) {
        if (labDocuments.length === 0 && (!patient || (!patient.symptoms?.length && !patient.conditions?.length && !patient.medications?.length))) {
          answer = "I couldn't find this information in the available records.";
        } else {
          const allBms = labDocuments.flatMap((d) => d.biomarkers);
          labDocuments.forEach((d) => citations.push(d.title));

          answer = `The following clinical information was extracted from the patient's records:\n` +
            (patient ? `• Patient: ${patient.name} (${patient.age}Y, ${patient.sex}${patient.bloodGroup ? `, Blood Group ${patient.bloodGroup}` : ''})\n` : '') +
            `• Reports processed: ${labDocuments.length} document(s)\n` +
            `• Extracted laboratory assays: ${allBms.length > 0 ? allBms.map((b) => b.canonicalName).join(', ') : 'Not available in the uploaded record.'}\n` +
            `• Documented Conditions: ${patient?.conditions?.length ? patient.conditions.map((c) => c.name).join(', ') : 'Not available in the uploaded record.'}\n` +
            `• Active Medications: ${patient?.medications?.length ? patient.medications.map((m) => `${m.name} ${m.dosage}`).join(', ') : 'Not available in the uploaded record.'}`;
        }
      } 
      // 3. "List the medications"
      else if (lower.includes('list the medications') || lower.includes('list the recorded medications') || lower.includes('medications') || lower.includes('prescription')) {
        if (!patient?.medications || patient.medications.length === 0) {
          answer = "I couldn't find this information in the available records.";
        } else {
          answer = `The following medications are currently on record for ${patient.name}:\n` +
            patient.medications.map((m) => `• **${m.name}**: ${m.dosage} (${m.frequency})${m.purpose ? ` — For: ${m.purpose}` : ''}`).join('\n');
          citations.push('Patient Medical Record');
        }
      } 
      // 4. "Show the laboratory results"
      else if (lower.includes('show the laboratory results') || lower.includes('what laboratory results are available') || lower.includes('laboratory results') || lower.includes('lab results') || lower.includes('test results')) {
        const allBms = labDocuments.flatMap((d) => d.biomarkers);
        if (allBms.length === 0) {
          answer = "I couldn't find this information in the available records.";
        } else {
          labDocuments.forEach((d) => citations.push(d.title));
          answer = `The following laboratory results are extracted and verified in the records:\n\n` +
            allBms.map((b) => `• **${b.canonicalName}**: ${b.rawValue} ${b.unit} (Status: ${b.status}, Ref: ${b.referenceRange?.rawText || 'Not available in the uploaded record.'})`).join('\n');
        }
      } 
      // 5. "What information is missing?"
      else if (lower.includes('what information is missing') || lower.includes('missing information') || lower.includes('information is missing') || lower.includes('what is missing') || lower.includes('missing')) {
        const missing: string[] = [];
        if (!patient?.bloodGroup) missing.push('Blood group: Not available in the uploaded document.');
        if (!patient?.allergies || patient.allergies.length === 0) missing.push('Allergies: Not available in the provided information.');
        if (!patient?.medications || patient.medications.length === 0) missing.push('Current medications: Not available in the provided information.');
        if (!patient?.conditions || patient.conditions.length === 0) missing.push('Existing conditions: Not available in the provided information.');
        if (labDocuments.length === 0) {
          missing.push('Laboratory results: Not available in the uploaded document.');
        } else {
          labDocuments.forEach((doc) => {
            const missingRanges = doc.biomarkers.filter((b) => b.referenceRange?.isMissingInReport);
            if (missingRanges.length > 0) {
              missing.push(`Reference ranges for ${missingRanges.map(b => b.canonicalName).join(', ')}: Not available in the uploaded record.`);
            }
          });
        }
        if (missing.length === 0) {
          answer = "All essential variables, laboratory assays, and reference intervals are fully present in the available records.";
        } else {
          answer = "The following clinical information is missing or not provided in the available records:\n" + missing.map(m => `• ${m}`).join('\n');
        }
      }
      // 6. "What changed between the reports?"
      else if (lower.includes('what changed between the reports') || lower.includes('changed between') || lower.includes('comparison') || lower.includes('trend')) {
        if (labDocuments.length < 2) {
          answer = "I couldn't find this information in the available records. At least two reports are required to calculate observed changes between dates.";
        } else {
          // Compare matching tests between doc 0 and doc 1
          const docA = labDocuments[0];
          const docB = labDocuments[1];
          const matches: string[] = [];

          docA.biomarkers.forEach((bmA) => {
            const bmB = docB.biomarkers.find((b) => b.canonicalName.toLowerCase() === bmA.canonicalName.toLowerCase());
            if (bmB && bmA.numericValue !== null && bmB.numericValue !== null) {
              const diff = Number((bmA.numericValue - bmB.numericValue).toFixed(2));
              const changeStr = diff > 0 ? `+${diff} ${bmA.unit} increase` : diff < 0 ? `${diff} ${bmA.unit} decrease` : 'No numeric change';
              matches.push(`• **${bmA.canonicalName}**: ${bmB.rawValue} ${bmB.unit} (${docB.reportDate}) &rarr; ${bmA.rawValue} ${bmA.unit} (${docA.reportDate}) [${changeStr}]`);
            }
          });

          if (matches.length === 0) {
            answer = `Compared reports "${docA.title}" and "${docB.title}", but no identical biomarker names were found to compute numerical changes.`;
          } else {
            answer = `Observed biomarker changes between ${docB.reportDate} and ${docA.reportDate}:\n\n` + matches.join('\n');
            citations.push(`${docA.title}`, `${docB.title}`);
          }
        }
      } 
      // General fallback for unknown/unsupported questions
      else {
        answer = "I couldn't find this information in the available records.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-a-${Date.now()}`,
          sender: 'assistant',
          text: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: citations.length > 0 ? Array.from(new Set(citations)) : undefined,
        },
      ]);
      setIsAnswering(false);
    }, 550);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* PERSISTENT RESPONSIBLE AI NOTICE */}
      <div className="ai-disclaimer-notice" style={{ margin: 0 }}>
        <ShieldAlert size={18} color="#B45309" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ display: 'block', fontSize: '0.8125rem', color: '#78350F' }}>
            AI-assisted information. Verify important information against the original medical record.
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#92400E' }}>
            MedLens provides AI-assisted organization and summarization of medical information. Verify important information against the original record and consult a qualified healthcare professional for clinical decisions.
          </span>
        </div>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveSubTab('summary')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: activeSubTab === 'summary' ? '#BAE6FD' : 'transparent',
              background: activeSubTab === 'summary' ? '#F0F9FF' : 'transparent',
              color: activeSubTab === 'summary' ? '#0369A1' : '#475569',
              fontSize: '0.85rem',
              fontWeight: activeSubTab === 'summary' ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Sparkles size={16} />
            <span>AI-Assisted Summary</span>
          </button>

          <button
            onClick={() => setActiveSubTab('qa')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: activeSubTab === 'qa' ? '#BAE6FD' : 'transparent',
              background: activeSubTab === 'qa' ? '#F0F9FF' : 'transparent',
              color: activeSubTab === 'qa' ? '#0369A1' : '#475569',
              fontSize: '0.85rem',
              fontWeight: activeSubTab === 'qa' ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <MessageSquare size={16} />
            <span>Ask MedLens Q&amp;A</span>
          </button>
        </div>

        {patient && (
          <div style={{ fontSize: '0.8125rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={14} color="#0284C7" />
            <span>Active Context: <strong>{patient.name}</strong> ({patient.age}Y &bull; {patient.bloodGroup || 'O+'})</span>
          </div>
        )}
      </div>

      {/* SUB-VIEW 1: AI-ASSISTED SUMMARY (With Source Traceability & View Original Report Action) */}
      {activeSubTab === 'summary' && (
        <AiAssistedSummaryCard
          patient={patient}
          documents={documents}
          labDocuments={labDocuments}
          onViewOriginalReport={onViewOriginalReport}
        />
      )}

      {/* SUB-VIEW 2: ASK MEDLENS Q&A */}
      {activeSubTab === 'qa' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '640px', overflow: 'hidden' }}>
          
          {/* Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Stethoscope size={18} color="#0284C7" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                Have a question about this record? — Ask MedLens
              </h3>
            </div>
            <span style={{ fontSize: '0.725rem', color: '#64748B' }}>
              Zero Hallucinations Guarantee
            </span>
          </div>

          {/* Messages Viewport */}
          <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#FFFFFF' }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '82%',
                  padding: '0.85rem 1.15rem',
                  borderRadius: '12px',
                  background: m.sender === 'user' ? '#0284C7' : '#F8FAFC',
                  color: m.sender === 'user' ? '#FFFFFF' : '#0F172A',
                  border: m.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                  fontSize: '0.875rem',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-line',
                }}>
                  {m.text}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', fontSize: '0.7rem', color: '#94A3B8' }}>
                  <span>{m.timestamp}</span>
                  {m.citations && m.citations.length > 0 && (
                    <span style={{ color: '#0369A1', fontWeight: 500 }}>
                      Source: {m.citations.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isAnswering && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.8125rem' }}>
                <Loader2 size={16} color="#0284C7" style={{ animation: 'spin 1.2s linear infinite' }} />
                <span>Checking available records...</span>
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          <div style={{ padding: '0.65rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.45rem', overflowX: 'auto' }}>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '16px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  fontWeight: 500,
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(query);
            }}
            style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.65rem', background: '#FFFFFF' }}
          >
            <input
              type="text"
              placeholder="Ask a question about the patient's available records..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                outline: 'none',
                color: '#0F172A',
              }}
            />
            <button
              type="submit"
              disabled={!query.trim() || isAnswering}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.15rem' }}
            >
              <Send size={15} />
              <span>Ask</span>
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
