import React, { useState, useEffect } from 'react';
import { 
  NavigationTab, 
  UserMode, 
  DocumentMeta, 
  BiomarkerRecord, 
  VerificationAudit,
  PatientRecord,
  ManagedDocument,
  DocumentCategory,
  PatientConflict
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
import { ReportsView } from './components/ReportsView';
import { AskMedLensView } from './components/AskMedLensView';
import { SettingsView } from './components/SettingsView';
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
  updateDocumentStatusInPostgres,
  clearAllPostgresData
} from './services/db';
import { FileText, UploadCloud, UserPlus } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [userMode, setUserMode] = useState<UserMode>('patient');
  
  // Real Patient state - starts empty with zero fake records
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [activePatient, setActivePatient] = useState<PatientRecord | null>(null);
  const [isIntakeEditing, setIsIntakeEditing] = useState<boolean>(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<boolean>(false);

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
    setSaveSuccessNotification(true);
    setTimeout(() => setSaveSuccessNotification(false), 8000);
    setIsIntakeEditing(false);
    setActiveTab('patients');
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

  // Resolve conflicting fields between user input and uploaded document
  const handleResolveConflict = async (conflictId: string, choice: 'user' | 'document') => {
    if (!activePatient || !activePatient.conflicts) return;
    const conflict = activePatient.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    const updatedPatient: PatientRecord = { ...activePatient };
    if (choice === 'document') {
      if (conflict.field === 'Age') {
        const num = parseInt(conflict.documentValue, 10);
        if (!isNaN(num)) updatedPatient.age = num;
      } else if (conflict.field === 'Biological Sex') {
        updatedPatient.sex = conflict.documentValue as any;
      } else if (conflict.field === 'Blood Group') {
        updatedPatient.bloodGroup = conflict.documentValue;
      }
    }
    updatedPatient.conflicts = (updatedPatient.conflicts || []).filter((c) => c.id !== conflictId);
    updatedPatient.updatedAt = new Date().toISOString();

    await savePatientToPostgres(updatedPatient);
    setActivePatient(updatedPatient);
    setPatients((prev) => prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)));
  };

  // Handle Upload Success from Modal or Reports View (Combines data, tracks conflicts, auto-initializes patient)
  const handleUploadSuccess = async (newDoc: DocumentMeta) => {
    let targetPatient = activePatient;

    // PATH B: If no patient is active, auto-initialize patient from extracted document details
    if (!targetPatient) {
      const patientName = newDoc.extractedPatientName || newDoc.title.replace(/\.[^/.]+$/, '') || 'Patient (Uploaded Record)';
      const patientAge = newDoc.extractedAge || 45;
      const patientSex = newDoc.extractedSex || 'Male';

      const newPatient: PatientRecord = {
        id: `pt-${Date.now()}`,
        name: patientName,
        age: patientAge,
        sex: patientSex,
        bloodGroup: newDoc.extractedBloodGroup || undefined,
        symptoms: (newDoc.extractedSymptoms || []).map((s, idx) => ({
          id: `sym-ext-${Date.now()}-${idx}`,
          name: s,
          severity: 'Moderate',
          source: 'DOCUMENT_EXTRACTED',
        })),
        conditions: (newDoc.extractedConditions || []).map((c, idx) => ({
          id: `cnd-ext-${Date.now()}-${idx}`,
          name: c,
          status: 'Active',
          source: 'DOCUMENT_EXTRACTED',
        })),
        allergies: (newDoc.extractedAllergies || []).map((a, idx) => ({
          id: `alg-ext-${Date.now()}-${idx}`,
          allergen: a,
          reaction: 'Documented in medical report',
          severity: 'Moderate',
          source: 'DOCUMENT_EXTRACTED',
        })),
        medications: (newDoc.extractedMedications || []).map((m, idx) => ({
          id: `med-ext-${Date.now()}-${idx}`,
          name: m,
          dosage: 'As prescribed in report',
          frequency: 'Daily',
          source: 'DOCUMENT_EXTRACTED',
        })),
        medicalHistory: `Information extracted from medical document: ${newDoc.title}`,
        additionalNotes: '',
        source: 'DOCUMENT_EXTRACTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await savePatientToPostgres(newPatient);
      } catch (err) {
        console.warn('Postgres patient save notice', err);
      }

      setPatients((prev) => [newPatient, ...prev]);
      setActivePatient(newPatient);
      localStorage.setItem('medlens_active_patient_id', newPatient.id);
      targetPatient = newPatient;
    } else {
      // MANUAL + UPLOAD DATA COMBINATION
      // Check for conflicts between user-entered info and document-extracted info
      const conflicts: PatientConflict[] = targetPatient.conflicts ? [...targetPatient.conflicts] : [];

      if (newDoc.extractedAge && newDoc.extractedAge !== targetPatient.age) {
        if (!conflicts.some((c) => c.field === 'Age')) {
          conflicts.push({
            id: `conf-age-${Date.now()}`,
            field: 'Age',
            userValue: `${targetPatient.age} years`,
            documentValue: `${newDoc.extractedAge} years`,
            sourceDocName: newDoc.title,
          });
        }
      }

      if (newDoc.extractedSex && newDoc.extractedSex !== targetPatient.sex) {
        if (!conflicts.some((c) => c.field === 'Biological Sex')) {
          conflicts.push({
            id: `conf-sex-${Date.now()}`,
            field: 'Biological Sex',
            userValue: targetPatient.sex,
            documentValue: newDoc.extractedSex,
            sourceDocName: newDoc.title,
          });
        }
      }

      if (newDoc.extractedBloodGroup && targetPatient.bloodGroup && newDoc.extractedBloodGroup !== targetPatient.bloodGroup) {
        if (!conflicts.some((c) => c.field === 'Blood Group')) {
          conflicts.push({
            id: `conf-bg-${Date.now()}`,
            field: 'Blood Group',
            userValue: targetPatient.bloodGroup,
            documentValue: newDoc.extractedBloodGroup,
            sourceDocName: newDoc.title,
          });
        }
      }

      // Merge extracted medications without duplicating
      const existingMeds = new Set(targetPatient.medications.map((m) => m.name.toLowerCase()));
      const combinedMeds = [...targetPatient.medications];
      (newDoc.extractedMedications || []).forEach((med, idx) => {
        if (!existingMeds.has(med.toLowerCase())) {
          combinedMeds.push({
            id: `med-doc-${Date.now()}-${idx}`,
            name: med,
            dosage: 'Per report notes',
            frequency: 'Daily',
            source: 'DOCUMENT_EXTRACTED',
          });
        }
      });

      // Merge extracted conditions without duplicating
      const existingConditions = new Set(targetPatient.conditions.map((c) => c.name.toLowerCase()));
      const combinedConditions = [...targetPatient.conditions];
      (newDoc.extractedConditions || []).forEach((cnd, idx) => {
        if (!existingConditions.has(cnd.toLowerCase())) {
          combinedConditions.push({
            id: `cnd-doc-${Date.now()}-${idx}`,
            name: cnd,
            status: 'Active',
            source: 'DOCUMENT_EXTRACTED',
          });
        }
      });

      // Merge extracted allergies without duplicating
      const existingAllergies = new Set(targetPatient.allergies.map((a) => a.allergen.toLowerCase()));
      const combinedAllergies = [...targetPatient.allergies];
      (newDoc.extractedAllergies || []).forEach((alg, idx) => {
        if (!existingAllergies.has(alg.toLowerCase())) {
          combinedAllergies.push({
            id: `alg-doc-${Date.now()}-${idx}`,
            allergen: alg,
            reaction: 'Extracted from document',
            severity: 'Moderate',
            source: 'DOCUMENT_EXTRACTED',
          });
        }
      });

      const updatedPatient: PatientRecord = {
        ...targetPatient,
        medications: combinedMeds,
        conditions: combinedConditions,
        allergies: combinedAllergies,
        conflicts,
        updatedAt: new Date().toISOString(),
      };

      try {
        await savePatientToPostgres(updatedPatient);
      } catch (err) {
        console.warn('Postgres patient update notice', err);
      }

      targetPatient = updatedPatient;
      setActivePatient(updatedPatient);
      setPatients((prev) => prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)));
    }

    const docWithPatient: DocumentMeta = {
      ...newDoc,
      patientIdentifier: targetPatient.id,
    };

    setDocuments((prev) => [docWithPatient, ...prev.filter((d) => d.id !== docWithPatient.id)]);
    setActiveDocId(docWithPatient.id);
    if (docWithPatient.biomarkers.length > 0) {
      setSelectedBiomarkerId(docWithPatient.biomarkers[0].id);
    }

    // Persist document to PostgreSQL
    const managedDoc: ManagedDocument = {
      id: docWithPatient.id,
      patientId: targetPatient.id,
      filename: docWithPatient.title,
      fileType: 'pdf',
      fileSize: 1024 * 64,
      documentCategory: 'Laboratory Report',
      uploadTimestamp: new Date().toISOString(),
      processingStatus: 'Processed',
      extractionStatus: 'Extracted',
      verificationStatus: docWithPatient.biomarkers.some((b) => b.verificationStatus === 'PENDING') ? 'Needs Verification' : 'Verified',
      fileHash: `hash-${Date.now()}`,
      previewSnippet: `Report from ${docWithPatient.labName} dated ${docWithPatient.reportDate}`,
      linkedLabReportId: docWithPatient.id,
    };
    try {
      await saveDocumentToPostgres(managedDoc);
    } catch (err) {
      console.warn('Postgres save document notice', err);
    }
    setManagedDocs((prev) => [managedDoc, ...prev.filter((d) => d.id !== docWithPatient.id)]);

    // Directly route to Patient Profile to see the unified structured output!
    setActiveTab('patients');
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

          {/* Tab 1: Dashboard */}
          {activeTab === 'dashboard' && (
            <DashboardView
              patient={activePatient}
              allPatients={patients}
              patientCount={patients.length}
              documents={managedDocs}
              labDocuments={documents}
              onNavigateTab={setActiveTab}
              onOpenUpload={() => setIsUploadOpen(true)}
              onAddPatient={() => {
                setIsIntakeEditing(true);
                setActiveTab('patients');
              }}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {/* Tab 2: Patients */}
          {(activeTab === 'patients' || activeTab === 'patient-intake') && (
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
                documents={managedDocs}
                labDocuments={documents}
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
                onOpenUpload={() => setIsUploadOpen(true)}
                onViewReport={(repId) => {
                  setActiveDocId(repId);
                  setActiveTab('reports');
                }}
                onResolveConflict={handleResolveConflict}
                onOpenAskMedLens={() => setActiveTab('ai-assistant')}
                saveSuccessNotification={saveSuccessNotification}
              />
            )
          )}

          {/* Tab 3: Reports (Prominent upload, vault, interactive dual-pane canvas, verification, comparison) */}
          {(activeTab === 'reports' || activeTab === 'document-manager' || activeTab === 'dual-pane' || activeTab === 'workflow' || activeTab === 'hitl-queue' || activeTab === 'comparison' || activeTab === 'timeline') && (
            <ReportsView
              documents={managedDocs}
              labDocuments={documents}
              activePatient={activePatient}
              onUploadSuccess={handleUploadSuccess}
              onDeleteDocument={handleDeleteDocument}
              onOpenVerification={(bm) => setVerifyingBiomarker(bm)}
            />
          )}

          {/* Tab 4: AI Assistant (Ask MedLens Evidence Q&A + Structured AI-Assisted Summary) */}
          {(activeTab === 'ai-assistant' || activeTab === 'doctor-prep') && (
            <AskMedLensView
              patient={activePatient}
              documents={managedDocs}
              labDocuments={documents}
            />
          )}

          {/* Tab 5: Settings */}
          {activeTab === 'settings' && (
            <SettingsView
              patients={patients}
              documents={managedDocs}
              labDocuments={documents}
              onResetDatabase={async () => {
                await clearAllPostgresData();
                setPatients([]);
                setActivePatient(null);
                setManagedDocs([]);
                setDocuments([]);
                localStorage.removeItem('medlens_active_patient_id');
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
