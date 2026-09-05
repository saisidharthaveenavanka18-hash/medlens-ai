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
import { PatientIntakeForm } from './components/PatientIntakeForm';
import { PatientProfileView } from './components/PatientProfileView';
import { DocumentManagerView } from './components/DocumentManagerView';
import { CoreWorkflowView } from './components/CoreWorkflowView';
import { DashboardView } from './components/DashboardView';
import { ReportComparisonView } from './components/ReportComparisonView';
import { TimelineView } from './components/TimelineView';
import { 
  getAllPatientsFromPostgres,
  savePatientToPostgres, 
  getPatientFromPostgres, 
  deletePatientFromPostgres,
  getPgDatabase,
  saveDocumentToPostgres,
  getDocumentsByPatientFromPostgres,
  deleteDocumentFromPostgres,
  updateDocumentStatusInPostgres
} from './services/db';
import { FileText, UploadCloud, UserPlus } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [userMode, setUserMode] = useState<UserMode>('patient');
  
  // Real Patient state - starts empty with zero fake records
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [activePatient, setActivePatient] = useState<PatientRecord | null>(null);
  const [isIntakeEditing, setIsIntakeEditing] = useState<boolean>(false);

  // Real Documents state - starts empty
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [managedDocs, setManagedDocs] = useState<ManagedDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>('');
  const [selectedBiomarkerId, setSelectedBiomarkerId] = useState<string | null>(null);

  // Modals state
  const [verifyingBiomarker, setVerifyingBiomarker] = useState<BiomarkerRecord | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState<boolean>(false);

  // Initialize PostgreSQL and load persisted real patient & document records
  useEffect(() => {
    async function initDb() {
      try {
        await getPgDatabase();
        const allPts = await getAllPatientsFromPostgres();
        setPatients(allPts);

        const savedId = localStorage.getItem('medlens_active_patient_id');
        const matched = savedId ? allPts.find((p) => p.id === savedId) : null;
        const current = matched || (allPts.length > 0 ? allPts[0] : null);

        setActivePatient(current);

        if (current) {
          const loadedDocs = await getDocumentsByPatientFromPostgres(current.id);
          setManagedDocs(loadedDocs || []);
        } else {
          setManagedDocs([]);
        }
      } catch (err) {
        console.warn('PostgreSQL initialization notice', err);
      }
    }
    initDb();
  }, []);

  // Active document for dual-pane
  const activeDocument = documents.find((d) => d.id === activeDocId) || (documents.length > 0 ? documents[0] : null);

  // Count pending reviews across all documents
  const pendingReviewCount = documents.reduce((acc, doc) => {
    return acc + doc.biomarkers.filter((b) => b.verificationStatus === 'PENDING' || b.confidence < 0.7).length;
  }, 0);

  // Switch active patient
  const handleSelectPatient = async (patient: PatientRecord) => {
    setActivePatient(patient);
    localStorage.setItem('medlens_active_patient_id', patient.id);
    setIsIntakeEditing(false);

    try {
      const loadedDocs = await getDocumentsByPatientFromPostgres(patient.id);
      setManagedDocs(loadedDocs || []);
    } catch (err) {
      console.warn('Failed to load patient documents', err);
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
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === patient.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = patient;
        return updated;
      }
      return [...prev, patient];
    });
    setActivePatient(patient);
    localStorage.setItem('medlens_active_patient_id', patient.id);
    setIsIntakeEditing(false);
    setActiveTab('patient-intake');
  };

  // Delete Patient and associated records
  const handleDeletePatient = async (patientId: string) => {
    await deletePatientFromPostgres(patientId);
    const remaining = patients.filter((p) => p.id !== patientId);
    setPatients(remaining);

    if (activePatient?.id === patientId) {
      const next = remaining.length > 0 ? remaining[0] : null;
      setActivePatient(next);
      if (next) {
        localStorage.setItem('medlens_active_patient_id', next.id);
        const loadedDocs = await getDocumentsByPatientFromPostgres(next.id);
        setManagedDocs(loadedDocs || []);
      } else {
        localStorage.removeItem('medlens_active_patient_id');
        setManagedDocs([]);
      }
    }
  };

  // Handle Multi-Document Upload with Validation & PostgreSQL Persistence
  const handleUploadDocuments = async (files: File[], defaultCategory: DocumentCategory) => {
    const newManagedDocs: ManagedDocument[] = [];
    const patientId = activePatient ? activePatient.id : 'unassigned';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = (file.name.split('.').pop()?.toLowerCase() || 'pdf') as ManagedDocument['fileType'];
      const docId = `doc-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
      
      const docItem: ManagedDocument = {
        id: docId,
        patientId,
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
        linkedLabReportId: docId,
      };

      if (activePatient) {
        await saveDocumentToPostgres(docItem);
      }
      newManagedDocs.push(docItem);
    }

    setManagedDocs((prev) => [...newManagedDocs, ...prev]);
  };

  // Delete Document
  const handleDeleteDocument = async (docId: string) => {
    await deleteDocumentFromPostgres(docId);
    setManagedDocs((prev) => prev.filter((d) => d.id !== docId));
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (activeDocId === docId) {
      const remaining = documents.filter((d) => d.id !== docId);
      setActiveDocId(remaining.length > 0 ? remaining[0].id : '');
    }
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
  const handleUploadSuccess = async (newDoc: DocumentMeta) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
    setActiveDocId(newDoc.id);
    if (newDoc.biomarkers.length > 0) {
      setSelectedBiomarkerId(newDoc.biomarkers[0].id);
    }

    // Persist to document manager if a patient is active
    if (activePatient) {
      const managedDoc: ManagedDocument = {
        id: newDoc.id,
        patientId: activePatient.id,
        filename: newDoc.title,
        fileType: 'pdf',
        fileSize: 1024 * 64,
        documentCategory: 'Laboratory Report',
        uploadTimestamp: new Date().toISOString(),
        processingStatus: 'Processed',
        extractionStatus: 'Extracted',
        verificationStatus: newDoc.biomarkers.some((b) => b.verificationStatus === 'PENDING') ? 'Needs Verification' : 'Verified',
        fileHash: `hash-${Date.now()}`,
        previewSnippet: `Report from ${newDoc.labName} dated ${newDoc.reportDate}`,
        linkedLabReportId: newDoc.id,
      };
      try {
        await saveDocumentToPostgres(managedDoc);
      } catch (err) {
        console.warn('Postgres save document notice', err);
      }
      setManagedDocs((prev) => [managedDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
    }

    setActiveTab('dual-pane');
  };

  return (
    <div className="app-container">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userMode={userMode}
        onToggleUserMode={setUserMode}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
        pendingReviewCount={pendingReviewCount}
        activePatient={activePatient}
        allPatients={patients}
        onSelectPatient={(patientId) => {
          const p = patients.find((pt) => pt.id === patientId);
          if (p) handleSelectPatient(p);
        }}
        onAddPatient={() => {
          setIsIntakeEditing(true);
          setActiveTab('patient-intake');
        }}
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
          onAddPatient={() => {
            setIsIntakeEditing(true);
            setActiveTab('patient-intake');
          }}
        />

        <main className="main-viewport">
          {/* Document Selector Strip (when on Dual-Pane View and documents exist) */}
          {activeTab === 'dual-pane' && documents.length > 0 && activeDocument && (
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
                {activePatient && (
                  <span style={{ color: '#64748B' }}>
                    Patient: <strong style={{ color: '#334155' }}>{activePatient.name}</strong> ({activePatient.age}Y / {activePatient.sex})
                  </span>
                )}
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
              patientCount={patients.length}
              documents={managedDocs}
              records={[]}
              onNavigateTab={setActiveTab}
              onOpenUpload={() => setIsUploadOpen(true)}
              onAddPatient={() => {
                setIsIntakeEditing(true);
                setActiveTab('patient-intake');
              }}
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
            documents.length === 0 ? (
              <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', margin: '3rem auto' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '12px',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                  color: '#2563EB',
                }}>
                  <FileText size={28} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.5rem' }}>
                  No Reports Extracted Yet
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.75rem', maxWidth: '480px', margin: '0 auto 1.75rem auto' }}>
                  Upload a clinical laboratory report or medical document to inspect extracted biomarkers, reference intervals, and exact coordinate provenance.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary">
                    <UploadCloud size={16} />
                    Upload Medical Report
                  </button>
                  {patients.length === 0 && (
                    <button
                      onClick={() => {
                        setIsIntakeEditing(true);
                        setActiveTab('patient-intake');
                      }}
                      className="btn btn-secondary"
                    >
                      <UserPlus size={16} />
                      Add Patient First
                    </button>
                  )}
                </div>
              </div>
            ) : activeDocument ? (
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
            ) : null
          )}

          {/* Tab 2: Longitudinal Comparison */}
          {activeTab === 'longitudinal' && (
            <LongitudinalComparison
              documents={documents}
              conflicts={[]}
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

          {/* Tab 5: Patient Intake & Profile */}
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
                allPatients={patients}
                onSelectPatient={(patientId) => {
                  const p = patients.find((pt) => pt.id === patientId);
                  if (p) handleSelectPatient(p);
                }}
                onAddPatient={() => {
                  setActivePatient(null);
                  setIsIntakeEditing(true);
                }}
                onDeletePatient={handleDeletePatient}
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
              onAddPatient={() => {
                setIsIntakeEditing(true);
                setActiveTab('patient-intake');
              }}
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
      />

      <SafetyModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
      />
    </div>
  );
};

export default App;
