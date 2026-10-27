import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { SlotPicker } from '../../components/common/SlotPicker';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/fields';
import { Panel } from '../../components/ui/Panel';
import { useToast } from '../../components/ui/Toast';
import { bookAppointment } from '../../features/appointments/appointmentsSlice';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { paths } from '../../routes/paths';
import { doctorApi } from '../../services/doctor.api';
import { useAppDispatch } from '../../store/hooks';
import type { DoctorProfile } from '../../types';
import { cx } from '../../utils/cx';
import { errorMessage, type Rejection } from '../../utils/errors';
import { addDaysISO, doctorName, formatCurrency, formatDate, formatTime, todayISO } from '../../utils/format';

type Step = 1 | 2 | 3;

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: 'Doctor' },
  { step: 2, label: 'Date and time' },
  { step: 3, label: 'Confirm' },
];

const MAX_DAYS_AHEAD = 60;

function StepIndicator({ current }: { current: Step }) {
  return (
    <ol className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      {STEPS.map(({ step, label }) => (
        <li key={step} aria-current={step === current ? 'step' : undefined} className={cx('flex items-center gap-2', step === current ? 'font-medium text-ink' : 'text-ink-soft')}>
          <span
            className={cx(
              'inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs tabular-nums',
              step === current ? 'border-pine-600 bg-pine-600 text-white' : step < current ? 'border-pine-600 text-pine-700' : 'border-rule',
            )}
          >
            {step}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}

function DoctorPicker({ onChoose }: { onChoose: (doctor: DoctorProfile) => void }) {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const results = useAsync(() => doctorApi.search({ search: debounced.trim(), page: 1, limit: 6 }), [debounced]);
  const doctors = results.data?.items ?? [];

  return (
    <Panel title="Choose a doctor">
      <Input label="Search by name" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="For example: Rao" />
      <div className="mt-4">
        {results.error && <ErrorNote message={results.error} onRetry={results.reload} />}
        {!results.error && doctors.length === 0 && !results.loading && <EmptyState title="No doctors match" description="Try a shorter name." />}
        {doctors.length > 0 && (
          <ul className="divide-y divide-rule rounded-md border border-rule">
            {doctors.map((doctor) => (
              <li key={doctor.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium">{doctorName(doctor)}</p>
                  <p className="text-sm text-ink-soft">
                    {doctor.specialization}, {formatCurrency(doctor.consultation_fee)}
                  </p>
                </div>
                <Button size="sm" onClick={() => onChoose(doctor)}>
                  Choose
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [params] = useSearchParams();
  const preselectedId = Number(params.get('doctor'));

  const [step, setStep] = useState<Step>(1);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // "Book" buttons elsewhere link here with ?doctor=ID, which skips the first step.
  const preselected = useAsync(
    async () => (Number.isInteger(preselectedId) && preselectedId > 0 ? doctorApi.get(preselectedId) : null),
    [preselectedId],
  );
  useEffect(() => {
    if (preselected.data && !doctor) {
      setDoctor(preselected.data);
      setStep(2);
    }
  }, [preselected.data, doctor]);

  const slots = useAsync(
    async () => (doctor && date ? doctorApi.slots(doctor.id, date) : null),
    [doctor?.id, date],
  );

  const chooseDoctor = (chosen: DoctorProfile) => {
    setDoctor(chosen);
    setDate('');
    setSlot(null);
    setStep(2);
  };

  const submit = async () => {
    if (!doctor || !slot) return;
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setReasonError('Tell the doctor briefly why you are coming (at least 3 characters).');
      return;
    }
    setReasonError(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      await dispatch(bookAppointment({ doctor_id: doctor.id, appointment_date: date, start_time: slot, reason: trimmed })).unwrap();
      toast.success('Appointment booked');
      navigate(paths.patient.appointments);
    } catch (cause) {
      if ((cause as Rejection).status === 409) {
        // Someone else took the slot between "pick" and "confirm": say so, and show fresh times.
        toast.error(errorMessage(cause));
        setSlot(null);
        setStep(2);
        slots.reload();
      } else {
        setSubmitError(errorMessage(cause));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Book an appointment" description="Pick a doctor, choose a time, and confirm." />
      <StepIndicator current={step} />

      {step === 1 && (preselected.loading && preselectedId ? <p className="text-ink-soft">Loading...</p> : <DoctorPicker onChoose={chooseDoctor} />)}

      {step === 2 && doctor && (
        <Panel
          title={`${doctorName(doctor)}, ${doctor.specialization}`}
          actions={
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              Change doctor
            </Button>
          }
        >
          <Input
            label="Date"
            type="date"
            min={todayISO()}
            max={addDaysISO(todayISO(), MAX_DAYS_AHEAD)}
            value={date}
            wrapperClassName="mb-5 max-w-xs"
            onChange={(event) => {
              setDate(event.target.value);
              setSlot(null);
            }}
          />
          {date ? (
            <>
              {slots.error && <ErrorNote message={slots.error} onRetry={slots.reload} />}
              {!slots.error && <SlotPicker slots={slots.data?.slots ?? []} value={slot} loading={slots.loading} onChange={setSlot} />}
            </>
          ) : (
            <p className="text-sm text-ink-soft">Choose a date to see free times.</p>
          )}
          <div className="mt-6 flex justify-end">
            <Button disabled={!slot} onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        </Panel>
      )}

      {step === 3 && doctor && slot && (
        <Panel title="Check and confirm" className="max-w-2xl">
          <dl className="mb-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-soft">Doctor</dt>
              <dd className="mt-0.5 font-medium">{doctorName(doctor)}</dd>
              <dd className="text-ink-soft">{doctor.specialization}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">When</dt>
              <dd className="mt-0.5 font-medium">{formatDate(date)}</dd>
              <dd className="tabular-nums text-ink-soft">{formatTime(slot)}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Fee, paid at the clinic</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{formatCurrency(doctor.consultation_fee)}</dd>
            </div>
          </dl>
          <Textarea
            label="Reason for the visit"
            value={reason}
            maxLength={500}
            error={reasonError ?? undefined}
            hint="A sentence or two is enough, for example: fever for two days."
            onChange={(event) => setReason(event.target.value)}
          />
          {submitError && (
            <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {submitError}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Button variant="secondary" onClick={() => setStep(2)} disabled={submitting}>
              Back
            </Button>
            <Button onClick={submit} loading={submitting}>
              Book appointment
            </Button>
          </div>
        </Panel>
      )}

      {step !== 3 && (
        <p className="mt-6 text-sm text-ink-soft">
          Just looking?{' '}
          <Link to={paths.patient.doctors} className="font-medium text-pine-700 underline underline-offset-2">
            Browse doctors
          </Link>
        </p>
      )}
    </>
  );
}
