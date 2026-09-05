import React, { useState, useEffect } from 'react';
import { 
  NavigationTab, 
  UserMode, 
  DocumentMeta, 
  BiomarkerRecord, 
  VerificationAudit,
  PatientRecord,
  ManagedDocument,
  DocumentCategory
} from './types';
import { MOCK_DOCUMENTS, MOCK_CONFLICTS, DEMO_PRESETS } from './data/mockData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SafetyDisclaimerBanner, SafetyModal } from './components/SafetyDisclaimer';
import { DocumentCanvas } from './components/DocumentCanvas';
import { BiomarkerPanel } from './components/BiomarkerPanel';
import { LongitudinalComparison } from './components/LongitudinalComparison';
import { HitlVerificationModal } from './components/HitlVerificationModal';
import { HitlQueueView } from './components/HitlQueueView';
import { DoctorQuestions } from './components/DoctorQuestions';
import { UploadModal } from './components/UploadModal';
import { JudgeWalkthroughModal } from './components/JudgeWalkthroughModal';
import { PatientIntakeForm } from './components/PatientIntakeForm';
import { PatientProfileView } from './components/PatientProfileView';
import { DocumentManagerView } from './components/DocumentManagerView';
import { CoreWorkflowView } from './components/CoreWorkflowView';
import { DashboardView } from './components/DashboardView';
import { ReportComparisonView } from './components/ReportComparisonView';
import { TimelineView } from './components/TimelineView';
import { FICTIONAL_DEMO_PATIENT } from './services/extractor';
import { 
  INITIAL_DEMO_PATIENT, 
  INITIAL_DEMO_DOCUMENTS,
  savePatientToPostgres, 
  getPatientFromPostgres, 
  getPgDatabase,
  saveDocumentToPostgres,
  getDocumentsByPatientFromPostgres,
  deleteDocumentFromPostgres,
  updateDocumentStatusInPostgres
} from './services/db';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [userMode, setUserMode] = useState<UserMode>('patient');
  const [activePresetId, setActivePresetId] = useState<string>('preset-provenance');
  const [documents, setDocuments] = useState<DocumentMeta[]>(MOCK_DOCUMENTS);
  const [activeDocId, setActiveDocId] = useState<string>('doc-quest-2024-01');
  const [selectedBiomarkerId, setSelectedBiomarkerId] = useState<string | null>('bm-chol-2024');

  // Patient Intake State (SOURCE = USER_PROVIDED)
  const [activePatient, setActivePatient] = useState<PatientRecord>(INITIAL_DEMO_PATIENT);
  const [isIntakeEditing, setIsIntakeEditing] = useState<boolean>(false);

  // Managed Medical Documents Vault State (PostgreSQL backed)
  const [managedDocs, setManagedDocs] = useState<ManagedDocument[]>(INITIAL_DEMO_DOCUMENTS);
  
  // Modals state
  const [verifyingBiomarker, setVerifyingBiomarker] = useState<BiomarkerRecord | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isJudgeTourOpen, setIsJudgeTourOpen] = useState<boolean>(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState<boolean>(false);

  // Initialize PostgreSQL and load persisted patient & document records
  useEffect(() => {
    async function initDb() {
      try {
        await getPgDatabase();
        const savedId = localStorage.getItem('medlens_active_patient_id') || INITIAL_DEMO_PATIENT.id;
        const loadedPatient = await getPatientFromPostgres(savedId);
        if (loadedPatient) {
          setActivePatient(loadedPatient);
        }

        const loadedDocs = await getDocumentsByPatientFromPostgres(savedId);
        if (loadedDocs && loadedDocs.length > 0) {
          setManagedDocs(loadedDocs);
        }
      } catch (err) {
        console.warn('PostgreSQL initialization notice', err);
      }
    }
    initDb();
  }, []);

  // Active document for dual-pane
  const activeDocument = documents.find((d) => d.id === activeDocId) || documents[0];

  // Count pending reviews across all documents
  const pendingReviewCount = documents.reduce((acc, doc) => {
    return acc + doc.biomarkers.filter((b) => b.verificationStatus === 'PENDING' || b.confidence < 0.7).length;
  }, 0);

  // Handle Preset Switching
  const handleSelectPreset = (presetId: string) => {
    const preset = DEMO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setActivePresetId(presetId);
    setActiveTab(preset.defaultView);

    if (preset.documentIds.length > 0) {
      setActiveDocId(preset.documentIds[0]);
    }

    if (preset.highlightBiomarkerId) {
      setSelectedBiomarkerId(preset.highlightBiomarkerId);
    }

    // If HITL preset, automatically open verification modal on the smudged item in clinician mode
    if (preset.id === 'preset-hitl') {
      setUserMode('clinician');
      const targetDoc = documents.find((d) => d.id === 'doc-hospital-2025-02');
      const targetBm = targetDoc?.biomarkers.find((b) => b.id === 'bm-creat-2025-02');
      if (targetBm) {
        setVerifyingBiomarker(targetBm);
      }
    }
  };

  // Handle Biomarker Selection (Bi-directional sync)
  const handleSelectBiomarker = (biomarkerId: string) => {
    setSelectedBiomarkerId(biomarkerId);
  };

  // Handle Verification Mutation
  const handleSaveVerification = (updatedBiomarker: BiomarkerRecord) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => ({
        ...doc,
        biomarkers: doc.biomarkers.map((bm) =>
          bm.id === updatedBiomarker.id ? updatedBiomarker : bm
        ),
      }))
    );
  };

  // Handle Patient Intake Save (persists to PostgreSQL)
  const handleSavePatientIntake = async (patient: PatientRecord) => {
    await savePatientToPostgres(patient);
    setActivePatient(patient);
    setIsIntakeEditing(false);
  };

  // Handle Multi-Document Upload with Validation & PostgreSQL Persistence
  const handleUploadDocuments = async (files: File[], defaultCategory: DocumentCategory) => {
    const newManagedDocs: ManagedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = (file.name.split('.').pop()?.toLowerCase() || 'pdf') as ManagedDocument['fileType'];
      
      const docItem: ManagedDocument = {
        id: `doc-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        patientId: activePatient.id,
        filename: file.name,
        fileType: ext,
        fileSize: file.size,
        documentCategory: defaultCategory,
        uploadTimestamp: new Date().toISOString(),
        processingStatus: 'Processed',
        extractionStatus: 'Extracted',
        verificationStatus: 'Needs Verification',
        fileHash: `hash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        previewSnippet: `Uploaded via secure portal: ${file.name} (${ext.toUpperCase()})`,
        linkedLabReportId: defaultCategory === 'Laboratory Report' ? 'doc-quest-2024-01' : undefined,
      };

      await saveDocumentToPostgres(docItem);
      newManagedDocs.push(docItem);
    }

    setManagedDocs((prev) => [...newManagedDocs, ...prev]);
  };

  // Delete Document
  const handleDeleteDocument = async (docId: string) => {
    await deleteDocumentFromPostgres(docId);
    setManagedDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  // Update Document Category
  const handleUpdateDocumentCategory = async (docId: string, category: DocumentCategory) => {
    await updateDocumentStatusInPostgres(docId, { category });
    setManagedDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, documentCategory: category } : d))
    );
  };

  // Open Document in Dual-Pane Viewer
  const handleOpenInDualPane = (linkedLabReportId?: string) => {
    if (linkedLabReportId) {
      setActiveDocId(linkedLabReportId);
    }
    setActiveTab('dual-pane');
  };

  // Batch approve high confidence
  const handleBatchApprove = () => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => ({
        ...doc,
        biomarkers: doc.biomarkers.map((bm) => {
          if (bm.confidence >= 0.9 && bm.verificationStatus === 'PENDING') {
            const audit: VerificationAudit = {
              id: `aud-batch-${Date.now()}`,
              biomarkerId: bm.id,
              verifiedBy: 'Batch Clinical Audit Routine',
              previousValue: bm.rawValue,
              correctedValue: bm.rawValue,
              timestamp: new Date().toISOString(),
              status: 'VERIFIED_UNCHANGED',
              notes: 'High-confidence extraction batch-verified.',
            };
            return {
              ...bm,
              verificationStatus: 'VERIFIED',
              auditHistory: [audit, ...bm.auditHistory],
            };
          }
          return bm;
        }),
      }))
    );
  };

  // Handle Upload Success from Modal
  const handleUploadSuccess = (newDoc: DocumentMeta) => {
    if (!documents.some((d) => d.id === newDoc.id)) {
      setDocuments([newDoc, ...documents]);
    }
    setActiveDocId(newDoc.id);
    if (newDoc.biomarkers.length > 0) {
      setSelectedBiomarkerId(newDoc.biomarkers[0].id);
    }
    setActiveTab('dual-pane');
  };

  // Handle Loading Complete Fictional Demo Patient
  const handleLoadDemoPatient = () => {
    setActivePatient(INITIAL_DEMO_PATIENT);
    setDocuments(MOCK_DOCUMENTS);
    setManagedDocs(INITIAL_DEMO_DOCUMENTS);
    setActiveDocId('doc-quest-2024-01');
    setSelectedBiomarkerId('bm-chol-2024');
    setActiveTab('dashboard');
  };

  return (
    <div className="app-container">
      {/* Global Header (White background, outline icons, preset selector, user toggle) */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userMode={userMode}
        onToggleUserMode={setUserMode}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenJudgeTour={() => setIsJudgeTourOpen(true)}
        onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
        pendingReviewCount={pendingReviewCount}
        onLoadDemoPatient={handleLoadDemoPatient}
      />

      {/* Safety Notice Banner */}
      <SafetyDisclaimerBanner onLearnMore={() => setIsSafetyModalOpen(true)} />

      {/* App Body: Left Navigation Sidebar + Main Content Viewport */}
      <div className="app-body">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingReviewCount={pendingReviewCount}
          onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
          activePatient={activePatient}
        />

        <main className="main-viewport">
          {/* Document Selector Strip (when on Dual-Pane View) */}
          {activeTab === 'dual-pane' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              padding: '0.625rem 1rem',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              boxShadow: 'var(--shadow-card)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Viewing Report:</span>
                <select
                  value={activeDocId}
                  onChange={(e) => {
                    setActiveDocId(e.target.value);
                    const targetDoc = documents.find((d) => d.id === e.target.value);
                    if (targetDoc && targetDoc.biomarkers.length > 0) {
                      setSelectedBiomarkerId(targetDoc.biomarkers[0].id);
                    }
                  }}
                  style={{
                    background: '#F8FAFC',
                    color: '#334155',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.reportDate} - {d.title} ({d.labName})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748B' }}>
                  Patient: <strong style={{ color: '#334155' }}>{activePatient.name}</strong> ({activePatient.age}Y / {activePatient.sex})
                </span>
                <span style={{ color: '#64748B' }}>
                  Accession: <code style={{ color: '#1E40AF', background: '#EFF6FF', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid #BFDBFE' }}>{activeDocument.accessionNumber}</code>
                </span>
              </div>
            </div>
          )}

          {/* Tab: Integrated High-Value Dashboard */}
          {activeTab === 'dashboard' && (
            <DashboardView
              patient={activePatient}
              documents={managedDocs}
              records={FICTIONAL_DEMO_PATIENT.records}
              onNavigateTab={setActiveTab}
              onOpenUpload={() => setIsUploadOpen(true)}
              onAddPatient={() => {
                setIsIntakeEditing(true);
                setActiveTab('patient-intake');
              }}
              onLoadDemoPatient={handleLoadDemoPatient}
            />
          )}

          {/* Tab: Report Comparison (Observed Numerical Changes Only) */}
          {activeTab === 'comparison' && (
            <ReportComparisonView documents={documents} />
          )}

          {/* Tab: Chronological Timeline (Date -> Document -> Extracted info) */}
          {activeTab === 'timeline' && (
            <TimelineView documents={documents} />
          )}

          {/* Tab 0: Core Medical Document Workflow (Upload -> Extract -> Structure -> Range -> Provenance -> Review) */}
          {activeTab === 'workflow' && (
            <CoreWorkflowView
              onOpenDualPaneWithDoc={(docId) => {
                setActiveDocId(docId);
                setActiveTab('dual-pane');
              }}
            />
          )}

          {/* Tab 1: Hero Dual-Pane Viewer */}
          {activeTab === 'dual-pane' && (
            <div className="dual-pane-grid">
              {/* Left Pane: Interactive Document Canvas & Bounding Boxes */}
              <DocumentCanvas
                document={activeDocument}
                selectedBiomarkerId={selectedBiomarkerId}
                onSelectBiomarker={handleSelectBiomarker}
                userMode={userMode}
              />

              {/* Right Pane: Categorized Biomarkers, Reference Ranges & Context */}
              <BiomarkerPanel
                biomarkers={activeDocument.biomarkers}
                selectedBiomarkerId={selectedBiomarkerId}
                onSelectBiomarker={handleSelectBiomarker}
                onOpenVerification={(bm) => setVerifyingBiomarker(bm)}
                userMode={userMode}
              />
            </div>
          )}

          {/* Tab 2: Longitudinal Comparison & Conflict Matrix */}
          {activeTab === 'longitudinal' && (
            <LongitudinalComparison
              documents={documents}
              conflicts={MOCK_CONFLICTS}
              onSelectBiomarkerForProvenance={(docId, bmId) => {
                setActiveDocId(docId);
                setSelectedBiomarkerId(bmId);
                setActiveTab('dual-pane');
              }}
            />
          )}

          {/* Tab 3: Human-in-the-Loop Verification Queue */}
          {activeTab === 'hitl-queue' && (
            <HitlQueueView
              documents={documents}
              onOpenVerification={(bm) => setVerifyingBiomarker(bm)}
              onBatchApproveHighConfidence={handleBatchApprove}
            />
          )}

          {/* Tab 4: AI Summary & Clinician Discussion Guide */}
          {activeTab === 'doctor-prep' && (
            <DoctorQuestions documents={documents} />
          )}

          {/* Tab 5: Patient Intake & Profile (SOURCE = USER_PROVIDED in PostgreSQL) */}
          {activeTab === 'patient-intake' && (
            isIntakeEditing ? (
              <PatientIntakeForm
                initialPatient={activePatient}
                onSavePatient={handleSavePatientIntake}
                onCancel={() => setIsIntakeEditing(false)}
              />
            ) : (
              <PatientProfileView
                patient={activePatient}
                onEdit={() => setIsIntakeEditing(true)}
              />
            )
          )}

          {/* Tab 6: Medical Document Management & Ingestion Vault */}
          {activeTab === 'document-manager' && (
            <DocumentManagerView
              documents={managedDocs}
              activePatient={activePatient}
              onUploadDocuments={handleUploadDocuments}
              onDeleteDocument={handleDeleteDocument}
              onUpdateDocumentCategory={handleUpdateDocumentCategory}
              onOpenInDualPane={handleOpenInDualPane}
            />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <HitlVerificationModal
        biomarker={verifyingBiomarker}
        isOpen={!!verifyingBiomarker}
        onClose={() => setVerifyingBiomarker(null)}
        onSaveVerification={handleSaveVerification}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        availableSamples={documents}
      />

      <JudgeWalkthroughModal
        isOpen={isJudgeTourOpen}
        onClose={() => setIsJudgeTourOpen(false)}
        onNavigateToTab={setActiveTab}
        onSelectPreset={handleSelectPreset}
      />

      <SafetyModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
      />
    </div>
  );
};

export default App;
