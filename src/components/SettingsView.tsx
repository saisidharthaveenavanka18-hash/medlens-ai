import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Database, 
  Trash2, 
  Download, 
  ShieldCheck, 
  Check, 
  AlertTriangle, 
  Cpu, 
  Lock,
  Save,
  RefreshCw
} from 'lucide-react';
import { PatientRecord, ManagedDocument, DocumentMeta } from '../types';

interface SettingsViewProps {
  patients: PatientRecord[];
  documents: ManagedDocument[];
  labDocuments: DocumentMeta[];
  onResetDatabase?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  patients,
  documents,
  labDocuments,
  onResetDatabase,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key') || '';
    setApiKey(saved);
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleExportData = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      patients,
      documents,
      labDocuments,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medlens-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all data? This will clear all local patients, documents, and biomarkers from the browser database.')) {
      setIsResetting(true);
      try {
        if (onResetDatabase) {
          await onResetDatabase();
        } else {
          localStorage.clear();
          window.location.reload();
        }
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          Settings &amp; Data Configuration
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Manage your AI extraction credentials, embedded PostgreSQL storage, and clinical privacy parameters.
        </p>
      </div>

      {/* 1. AI ENGINE (Gemini API Configuration) */}
      <section className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#F0F9FF', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #BAE6FD' }}>
            <Key size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Gemini AI Integration
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Configured model: Google Gemini 1.5 Flash with fallback to local deterministic regex parsing
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <label className="form-label" htmlFor="api-key-input">
            Gemini API Key (Optional)
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              id="api-key-input"
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="form-input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            />
            <button
              onClick={handleSaveApiKey}
              className="btn btn-primary"
              style={{ whiteSpace: 'nowrap', padding: '0.55rem 1.25rem' }}
            >
              {isSaved ? <Check size={16} /> : <Save size={16} />}
              <span>{isSaved ? 'Saved!' : 'Save Key'}</span>
            </button>
          </div>
          <p className="form-hint">
            If no API key is provided, MedLens operates entirely in offline deterministic mode using high-precision local regex extraction and standard reference intervals.
          </p>
        </div>
      </section>

      {/* 2. POSTGRESQL EMBEDDED DATABASE */}
      <section className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#F0FDFA', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #99F6E4' }}>
            <Database size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Embedded PostgreSQL Relational Database (PGlite)
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              WASM-compiled PostgreSQL running directly in client browser memory
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Patients in Database</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>
              {patients.length}
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Medical Documents</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>
              {documents.length}
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Extracted Lab Biomarkers</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>
              {labDocuments.reduce((acc, d) => acc + d.biomarkers.length, 0)}
            </div>
          </div>
        </div>

        {/* Database actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportData}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem' }}
          >
            <Download size={15} />
            <span>Export Database Snapshot (JSON)</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="btn btn-secondary"
            style={{ color: '#DC2626', borderColor: '#FECACA', fontSize: '0.8125rem' }}
          >
            <Trash2 size={15} />
            <span>Clear Local Database</span>
          </button>
        </div>
      </section>

      {/* 3. PRIVACY & SAFETY ASSURANCE */}
      <section className="card" style={{ padding: '1.5rem', background: '#F8FAFC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Lock size={16} color="#0284C7" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
            Client-Side Privacy Architecture
          </h3>
        </div>
        <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
          MedLens is engineered for strict clinical compliance. All ingested medical documents, extracted lab records, and human-in-the-loop verification audits are stored directly in your local browser sandbox via PGlite WebAssembly. Patient records are never sold, rented, or sent to third-party tracking services.
        </p>
      </section>

    </div>
  );
};
