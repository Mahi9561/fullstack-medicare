import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Panel } from '../../components/ui/Panel';
import { ConsultationCard } from '../../features/consultations/ConsultationCard';
import { MedicalRecordForm } from '../../features/medicalRecords/MedicalRecordForm';
import { PrescriptionCard } from '../../features/prescriptions/PrescriptionCard';
import { useAsync } from '../../hooks/useAsync';
import { paths } from '../../routes/paths';
import { patientApi } from '../../services/patient.api';
import {
  ageFrom,
  formatBloodPressure,
  formatDate,
  formatTimestampDate,
  fullName,
  genderLabel,
  recordTypeLabel,
} from '../../utils/format';

const cell = (value: number | null, unit = '') => (value === null ? '' : `${value}${unit}`);

export default function DoctorPatientDetail() {
  const { id } = useParams();
  const patientId = Number(id);
  const { data, loading, error, reload } = useAsync(() => patientApi.history(patientId), [patientId]);
  const [adding, setAdding] = useState(false);

  if (error) {
    return (
      <>
        <PageHeader title="Patient" />
        <ErrorNote message={error} onRetry={reload} />
        <Link to={paths.doctor.patients} className="mt-4 inline-block text-sm font-medium text-pine-700 underline underline-offset-2">
          Back to patients
        </Link>
      </>
    );
  }
  if (!data) return <p className="text-ink-soft">{loading ? 'Loading...' : ''}</p>;

  const { patient } = data;

  return (
    <>
      <PageHeader
        title={fullName(patient)}
        description={`${ageFrom(patient.date_of_birth)} years, ${genderLabel(patient.gender)}, ${patient.phone}`}
        actions={<Button onClick={() => setAdding(true)}>Add medical record</Button>}
      />

      <div className="space-y-8">
        <section aria-labelledby="h-consultations">
          <h2 id="h-consultations" className="mb-3 text-lg font-semibold">Consultations</h2>
          {data.consultations.length === 0 ? (
            <EmptyState title="No consultations yet" />
          ) : (
            <div className="space-y-4">
              {data.consultations.map((consultation) => (
                <ConsultationCard
                  key={consultation.id}
                  consultation={consultation}
                  party="doctor"
                  footer={
                    <Link to={paths.doctor.appointment(consultation.appointment_id)} className="text-sm font-medium text-pine-700 underline underline-offset-2">
                      Open the visit
                    </Link>
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="h-prescriptions">
          <h2 id="h-prescriptions" className="mb-3 text-lg font-semibold">Prescriptions</h2>
          {data.prescriptions.length === 0 ? (
            <EmptyState title="No prescriptions yet" />
          ) : (
            <div className="space-y-4">
              {data.prescriptions.map((prescription) => (
                <PrescriptionCard key={prescription.id} prescription={prescription} party="doctor" />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="h-vitals">
          <h2 id="h-vitals" className="mb-3 text-lg font-semibold">Vital signs</h2>
          <DataTable
            caption="Vital signs, newest first"
            rows={data.vital_signs}
            rowKey={(vitals) => vitals.id}
            emptyMessage="No vital signs recorded."
            columns={[
              { header: 'Recorded', cell: (v) => <span className="whitespace-nowrap">{formatTimestampDate(v.created_at)}</span> },
              { header: 'BP (mmHg)', cell: (v) => <span className="tabular-nums">{formatBloodPressure(v.bp_systolic, v.bp_diastolic)}</span> },
              { header: 'Heart rate', cell: (v) => <span className="tabular-nums">{cell(v.heart_rate)}</span> },
              { header: 'Temp (°F)', cell: (v) => <span className="tabular-nums">{cell(v.temperature_f)}</span> },
              { header: 'Weight', cell: (v) => <span className="tabular-nums">{cell(v.weight_kg, ' kg')}</span> },
              { header: 'Height', cell: (v) => <span className="tabular-nums">{cell(v.height_cm, ' cm')}</span> },
              { header: 'SpO2', cell: (v) => <span className="tabular-nums">{cell(v.spo2, '%')}</span> },
            ]}
          />
        </section>

        <section aria-labelledby="h-records">
          <h2 id="h-records" className="mb-3 text-lg font-semibold">Medical records</h2>
          <DataTable
            caption="Medical records"
            rows={data.medical_records}
            rowKey={(record) => record.id}
            emptyMessage="No records yet."
            columns={[
              { header: 'Date', cell: (r) => <span className="whitespace-nowrap">{formatDate(r.record_date)}</span> },
              { header: 'Title', cell: (r) => <span className="font-medium">{r.title}</span> },
              { header: 'Type', cell: (r) => <Badge>{recordTypeLabel(r.record_type)}</Badge> },
              { header: 'Details', cell: (r) => <span className="whitespace-pre-wrap">{r.description}</span> },
            ]}
          />
        </section>
      </div>

      <Modal open={adding} title="Add a medical record" size="lg" onClose={() => setAdding(false)}>
        <MedicalRecordForm
          patientId={patient.id}
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            reload();
          }}
        />
      </Modal>
    </>
  );
}
