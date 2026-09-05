import React, { useState } from 'react';
import { 
  UserPlus, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Check, 
  CheckCircle2,
  Save, 
  Database, 
  ShieldCheck, 
  Pill, 
  Activity, 
  AlertTriangle, 
  FileText,
  User,
  ArrowRight
} from 'lucide-react';
import { 
  PatientRecord, 
  PatientSymptom, 
  PatientCondition, 
  PatientAllergy, 
  PatientMedication 
} from '../types';
import { SourceBadge } from './SourceBadge';

interface PatientIntakeFormProps {
  initialPatient?: PatientRecord | null;
  onSavePatient: (patient: PatientRecord) => Promise<void>;
  onCancel?: () => void;
}

export const PatientIntakeForm: React.FC<PatientIntakeFormProps> = ({
  initialPatient,
  onSavePatient,
  onCancel,
}) => {
  // Core form fields
  const [name, setName] = useState(initialPatient?.name || '');
  const [age, setAge] = useState(initialPatient?.age !== undefined ? initialPatient.age.toString() : '');
  const [sex, setSex] = useState<PatientRecord['sex']>(initialPatient?.sex || 'Male');
  const [bloodGroup, setBloodGroup] = useState<string>(initialPatient?.bloodGroup || 'O+');
  const [medicalHistory, setMedicalHistory] = useState(initialPatient?.medicalHistory || '');
  const [additionalNotes, setAdditionalNotes] = useState(initialPatient?.additionalNotes || '');

  // Multi-item collections (all marked SOURCE = USER_PROVIDED)
  const [symptoms, setSymptoms] = useState<PatientSymptom[]>(initialPatient?.symptoms || []);
  const [conditions, setConditions] = useState<PatientCondition[]>(initialPatient?.conditions || []);
  const [allergies, setAllergies] = useState<PatientAllergy[]>(initialPatient?.allergies || []);
  const [medications, setMedications] = useState<PatientMedication[]>(initialPatient?.medications || []);

  // Temporary item inputs
  const [newSymptomName, setNewSymptomName] = useState('');
  const [newSymptomSeverity, setNewSymptomSeverity] = useState<PatientSymptom['severity']>('Moderate');
  const [newSymptomDuration, setNewSymptomDuration] = useState('');

  const [newConditionName, setNewConditionName] = useState('');
  const [newConditionStatus, setNewConditionStatus] = useState<PatientCondition['status']>('Active');
  const [newConditionYear, setNewConditionYear] = useState('');

  const [newAllergen, setNewAllergen] = useState('');
  const [newReaction, setNewReaction] = useState('');
  const [newAllergySeverity, setNewAllergySeverity] = useState<PatientAllergy['severity']>('Moderate');

  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');
  const [newMedPurpose, setNewMedPurpose] = useState('');

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Patient name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Patient name must be at least 2 characters long.';
    }

    if (age === '' || age === null || age === undefined) {
      newErrors.age = 'Age is required.';
    } else {
      const ageNum = Number(age);
      if (isNaN(ageNum) || !Number.isInteger(ageNum)) {
        newErrors.age = 'Age must be a valid whole number (integer).';
      } else if (ageNum < 0) {
        newErrors.age = 'Age cannot be negative.';
      } else if (ageNum > 125) {
        newErrors.age = 'Age cannot exceed 125 years. Please enter a valid biological age.';
      }
    }

    if (!sex) {
      newErrors.sex = 'Biological sex / gender designation is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add Item Handlers
  const handleAddSymptom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSymptomName.trim()) return;
    const newSym: PatientSymptom = {
      id: `sym-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: newSymptomName.trim(),
      severity: newSymptomSeverity,
      duration: newSymptomDuration.trim() || undefined,
      source: 'USER_PROVIDED',
    };
    setSymptoms([...symptoms, newSym]);
    setNewSymptomName('');
    setNewSymptomDuration('');
  };

  const handleAddCondition = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newConditionName.trim()) return;
    const newCon: PatientCondition = {
      id: `con-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: newConditionName.trim(),
      status: newConditionStatus,
      diagnosedYear: newConditionYear.trim() || undefined,
      source: 'USER_PROVIDED',
    };
    setConditions([...conditions, newCon]);
    setNewConditionName('');
    setNewConditionYear('');
  };

  const handleAddAllergy = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newAllergen.trim()) return;
    const newAlg: PatientAllergy = {
      id: `alg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      allergen: newAllergen.trim(),
      reaction: newReaction.trim() || 'Unspecified allergic response',
      severity: newAllergySeverity,
      source: 'USER_PROVIDED',
    };
    setAllergies([...allergies, newAlg]);
    setNewAllergen('');
    setNewReaction('');
  };

  const handleAddMedication = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMedName.trim() || !newMedDosage.trim()) return;
    const newMed: PatientMedication = {
      id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      frequency: newMedFreq.trim() || 'Daily',
      purpose: newMedPurpose.trim() || undefined,
      source: 'USER_PROVIDED',
    };
    setMedications([...medications, newMed]);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedFreq('');
    setNewMedPurpose('');
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const patientRecord: PatientRecord = {
        id: initialPatient?.id || `pt-${Date.now()}`,
        name: name.trim(),
        age: parseInt(age, 10),
        sex,
        bloodGroup: bloodGroup.trim() || undefined,
        symptoms,
        conditions,
        allergies,
        medications,
        medicalHistory: medicalHistory.trim(),
        additionalNotes: additionalNotes.trim(),
        source: 'USER_PROVIDED',
        createdAt: initialPatient?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSaveSuccess(true);
      await onSavePatient(patientRecord);
    } catch (err) {
      console.error('Error saving patient intake form', err);
      setErrors({ form: "We couldn't save this patient record. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    color: '#334155',
    fontSize: '0.8125rem',
    outline: 'none',
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1E40AF',
          }}>
            <UserPlus size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1E3A8A', margin: 0 }}>
                Manual Patient &amp; Medical Intake
              </h2>
              <SourceBadge source="USER_PROVIDED" size="sm" />
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#1E40AF', margin: '0.2rem 0 0' }}>
              Enter patient and medical details manually to generate the structured patient record
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: '#FFFFFF',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #BFDBFE',
            fontSize: '0.75rem',
            color: '#1E40AF',
            fontWeight: 500,
          }}>
            <Database size={13} />
            PostgreSQL Relational Storage
          </span>
        </div>
      </div>

      {errors.form && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          color: '#991B1B',
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <AlertCircle size={16} />
          <span>{errors.form}</span>
        </div>
      )}

      {saveSuccess && (
        <div style={{
          background: '#F0FDF4',
          border: '1.5px solid #86EFAC',
          borderRadius: '8px',
          padding: '0.85rem 1.25rem',
          color: '#15803D',
          fontSize: '0.9rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <CheckCircle2 size={18} color="#16A34A" />
          <span>Patient information saved successfully.</span>
        </div>
      )}

      {/* SECTION 1: Patient Information */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={16} color="#3B82F6" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
              Patient Information
            </h3>
          </div>
          <SourceBadge source="USER_PROVIDED" size="sm" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Patient Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Patient Full Name * <span style={{ color: '#0284C7', fontWeight: 500 }}>(Required)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sarah Jenkins"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              style={{
                ...inputStyle,
                border: errors.name ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
                background: errors.name ? '#FEF2F2' : '#FFFFFF',
              }}
            />
            {errors.name && (
              <span style={{ fontSize: '0.72rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <AlertCircle size={12} /> {errors.name}
              </span>
            )}
          </div>

          {/* Patient Age */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Age (Years) * <span style={{ color: '#0284C7', fontWeight: 500 }}>(Required)</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 42"
              min="0"
              max="125"
              step="1"
              value={age}
              onChange={(e) => {
                setAge(e.target.value);
                if (errors.age) setErrors({ ...errors, age: '' });
              }}
              style={{
                ...inputStyle,
                border: errors.age ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
                background: errors.age ? '#FEF2F2' : '#FFFFFF',
              }}
            />
            {errors.age && (
              <span style={{ fontSize: '0.72rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <AlertCircle size={12} /> {errors.age}
              </span>
            )}
          </div>

          {/* Patient Biological Sex */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Biological Sex / Gender * <span style={{ color: '#0284C7', fontWeight: 500 }}>(Required)</span>
            </label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as any)}
              style={inputStyle}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Intersex">Intersex</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {/* Blood Group */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Blood Group <span style={{ color: '#64748B', fontWeight: 400 }}>(Optional)</span>
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              style={inputStyle}
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="Unknown">Unknown / Not Tested</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: Medical Information */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '0.5rem',
        padding: '0.5rem 0',
        borderBottom: '1.5px solid #E2E8F0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="#0D9488" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Medical Information
          </h3>
        </div>
        <SourceBadge source="USER_PROVIDED" size="sm" />
      </div>

      {/* Symptoms & Existing Conditions (Two Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Symptoms Intake */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Activity size={16} color="#3B82F6" />
              <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#334155', margin: 0 }}>Current Symptoms</h4>
            </div>
            <SourceBadge source="USER_PROVIDED" size="sm" />
          </div>

          <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.75rem' }}>
            Allow multiple symptoms with severity and approximate duration
          </p>

          {/* Quick Input Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <input
              type="text"
              placeholder="e.g. Dizziness"
              value={newSymptomName}
              onChange={(e) => setNewSymptomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSymptom())}
              style={{ ...inputStyle, flex: 1 }}
            />
            <select
              value={newSymptomSeverity}
              onChange={(e) => setNewSymptomSeverity(e.target.value as any)}
              style={{ ...inputStyle, width: 'auto' }}
            >
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
            </select>
            <button
              type="button"
              onClick={() => handleAddSymptom()}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {/* Symptoms List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: '60px' }}>
            {symptoms.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', padding: '0.5rem' }}>
                No symptoms added yet. Type above and click Add.
              </span>
            ) : (
              symptoms.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <strong style={{ color: '#334155' }}>{s.name}</strong>
                    {s.duration && (
                      <span style={{ color: '#64748B', marginLeft: '0.4rem', fontSize: '0.75rem' }}>
                        ({s.duration})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: s.severity === 'Severe' ? '#FEF2F2' : s.severity === 'Moderate' ? '#FFFBEB' : '#F0FDF4',
                      color: s.severity === 'Severe' ? '#991B1B' : s.severity === 'Moderate' ? '#92400E' : '#166534',
                      border: `1px solid ${s.severity === 'Severe' ? '#FECACA' : s.severity === 'Moderate' ? '#FDE68A' : '#BBF7D0'}`,
                    }}>
                      {s.severity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSymptoms(symptoms.filter((item) => item.id !== s.id))}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conditions Intake */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Activity size={16} color="#3B82F6" />
              <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#334155', margin: 0 }}>Existing Conditions</h4>
            </div>
            <SourceBadge source="USER_PROVIDED" size="sm" />
          </div>

          <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.75rem' }}>
            Enter known chronic medical diagnoses and year identified
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <input
              type="text"
              placeholder="e.g. Hypertension"
              value={newConditionName}
              onChange={(e) => setNewConditionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCondition())}
              style={{ ...inputStyle, flex: 1 }}
            />
            <select
              value={newConditionStatus}
              onChange={(e) => setNewConditionStatus(e.target.value as any)}
              style={{ ...inputStyle, width: 'auto' }}
            >
              <option value="Active">Active</option>
              <option value="Managed">Managed</option>
              <option value="Resolved">Resolved</option>
            </select>
            <button
              type="button"
              onClick={() => handleAddCondition()}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: '60px' }}>
            {conditions.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', padding: '0.5rem' }}>
                No existing conditions added yet.
              </span>
            ) : (
              conditions.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <strong style={{ color: '#334155' }}>{c.name}</strong>
                    {c.diagnosedYear && (
                      <span style={{ color: '#64748B', marginLeft: '0.4rem', fontSize: '0.75rem' }}>
                        (Since {c.diagnosedYear})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: '#EFF6FF',
                      color: '#1E40AF',
                      border: '1px solid #BFDBFE',
                    }}>
                      {c.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setConditions(conditions.filter((item) => item.id !== c.id))}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: Allergies & Medications (Two Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Allergies Intake */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <AlertTriangle size={16} color="#DC2626" />
              <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#334155', margin: 0 }}>Allergies &amp; Adverse Reactions</h4>
            </div>
            <SourceBadge source="USER_PROVIDED" size="sm" />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <input
              type="text"
              placeholder="Allergen (e.g. Penicillin)"
              value={newAllergen}
              onChange={(e) => setNewAllergen(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="text"
              placeholder="Reaction (e.g. Hives)"
              value={newReaction}
              onChange={(e) => setNewReaction(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => handleAddAllergy()}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: '60px' }}>
            {allergies.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', padding: '0.5rem' }}>
                No known drug or food allergies added.
              </span>
            ) : (
              allergies.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <strong style={{ color: '#991B1B' }}>{a.allergen}</strong>
                    <span style={{ color: '#64748B', marginLeft: '0.4rem', fontSize: '0.75rem' }}>
                      &rarr; {a.reaction}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllergies(allergies.filter((item) => item.id !== a.id))}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Medications Intake */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Pill size={16} color="#3B82F6" />
              <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#334155', margin: 0 }}>Current Medications</h4>
            </div>
            <SourceBadge source="USER_PROVIDED" size="sm" />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <input
              type="text"
              placeholder="Medication (e.g. Atorvastatin)"
              value={newMedName}
              onChange={(e) => setNewMedName(e.target.value)}
              style={{ ...inputStyle, flex: 1.2 }}
            />
            <input
              type="text"
              placeholder="Dosage (20mg)"
              value={newMedDosage}
              onChange={(e) => setNewMedDosage(e.target.value)}
              style={{ ...inputStyle, flex: 0.8 }}
            />
            <input
              type="text"
              placeholder="Daily"
              value={newMedFreq}
              onChange={(e) => setNewMedFreq(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMedication())}
              style={{ ...inputStyle, flex: 0.8 }}
            />
            <button
              type="button"
              onClick={() => handleAddMedication()}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
            >
              <Plus size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: '60px' }}>
            {medications.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', padding: '0.5rem' }}>
                No current medications entered.
              </span>
            ) : (
              medications.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <strong style={{ color: '#334155' }}>{m.name}</strong>
                    <span style={{ color: '#1E40AF', marginLeft: '0.4rem', fontWeight: 500 }}>{m.dosage}</span>
                    <span style={{ color: '#64748B', marginLeft: '0.35rem', fontSize: '0.75rem' }}>({m.frequency})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMedications(medications.filter((item) => item.id !== m.id))}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: Medical History & Additional Notes */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} color="#3B82F6" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', margin: 0 }}>
              Medical History &amp; Clinical Notes
            </h3>
          </div>
          <SourceBadge source="USER_PROVIDED" size="sm" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Past Medical &amp; Family History
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Non-smoker, prior appendectomy..."
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              style={{
                ...inputStyle,
                lineHeight: 1.45,
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Additional Patient Notes / Questions
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Questions regarding lab changes..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              style={{
                ...inputStyle,
                lineHeight: 1.45,
                resize: 'vertical',
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#64748B' }}>
          <ShieldCheck size={16} color="#166534" />
          <span>Entries tagged with <strong style={{ color: '#166534' }}>Patient Provided</strong> and saved to PostgreSQL.</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save size={15} />
                <span>Save Patient</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
