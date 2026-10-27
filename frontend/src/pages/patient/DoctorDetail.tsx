import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Panel } from '../../components/ui/Panel';
import { fetchDoctor } from '../../features/doctors/doctorsSlice';
import { useAsync } from '../../hooks/useAsync';
import { paths } from '../../routes/paths';
import { doctorApi } from '../../services/doctor.api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { DAYS } from '../../types';
import { dayLabel, doctorName, formatCurrency, formatTime } from '../../utils/format';

export default function DoctorDetail() {
  const { id } = useParams();
  const doctorId = Number(id);
  const dispatch = useAppDispatch();
  const { selected, selectedStatus, selectedError } = useAppSelector((state) => state.doctors);
  const availability = useAsync(() => doctorApi.availability(doctorId), [doctorId]);

  useEffect(() => {
    if (Number.isInteger(doctorId) && doctorId > 0) void dispatch(fetchDoctor(doctorId));
  }, [dispatch, doctorId]);

  if (selectedStatus === 'failed') {
    return (
      <>
        <PageHeader title="Doctor not found" />
        <ErrorNote message={selectedError ?? 'This doctor is not available.'} />
        <Link to={paths.patient.doctors} className="mt-4 inline-block text-sm font-medium text-pine-700 underline underline-offset-2">
          Back to search
        </Link>
      </>
    );
  }
  if (!selected || selected.id !== doctorId) return <p className="text-ink-soft">Loading...</p>;

  const windows = availability.data ?? [];

  return (
    <>
      <PageHeader
        title={doctorName(selected)}
        description={`${selected.specialization}, ${selected.qualification}`}
        actions={
          <Link to={paths.patient.bookWith(selected.id)}>
            <Button>Book an appointment</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Panel title="About">
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-soft">Experience</dt>
              <dd className="mt-0.5 font-medium">{selected.experience_years} years</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Consultation fee</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{formatCurrency(selected.consultation_fee)}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Departments</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {(selected.departments ?? []).length === 0 ? <span className="text-ink-soft">None listed</span> : (selected.departments ?? []).map((d) => <Badge key={d.id}>{d.name}</Badge>)}
              </dd>
            </div>
          </dl>
          {selected.bio && <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed">{selected.bio}</p>}
        </Panel>

        <Panel title="Weekly hours" flush>
          {availability.error && <div className="p-4"><ErrorNote message={availability.error} onRetry={availability.reload} /></div>}
          {!availability.error && windows.length === 0 && !availability.loading && (
            <div className="p-4">
              <EmptyState title="No hours published" description="This doctor has not set their availability yet." />
            </div>
          )}
          {windows.length > 0 && (
            <dl className="divide-y divide-rule text-sm">
              {DAYS.map((day) => {
                const dayWindows = windows.filter((window) => window.day_of_week === day);
                return (
                  <div key={day} className="flex justify-between gap-4 px-5 py-2.5">
                    <dt className="text-ink-soft">{dayLabel(day)}</dt>
                    <dd className="text-right tabular-nums">
                      {dayWindows.length === 0 ? <span className="text-ink-soft">Closed</span> : dayWindows.map((w) => <span key={`${w.start_time}-${w.end_time}`} className="block">{formatTime(w.start_time)} to {formatTime(w.end_time)}</span>)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </Panel>
      </div>
    </>
  );
}
