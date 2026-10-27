import { useEffect, useMemo, useState } from 'react';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { Panel } from '../../components/ui/Panel';
import { useToast } from '../../components/ui/Toast';
import { useAsync } from '../../hooks/useAsync';
import { doctorApi } from '../../services/doctor.api';
import { useAppSelector } from '../../store/hooks';
import { DAYS, type AvailabilityWindow, type DayOfWeek } from '../../types';
import { errorMessage } from '../../utils/errors';
import { dayLabel } from '../../utils/format';

interface TimeRange {
  start_time: string;
  end_time: string;
}

type Draft = Record<DayOfWeek, TimeRange[]>;

const emptyDraft = (): Draft => ({ MONDAY: [], TUESDAY: [], WEDNESDAY: [], THURSDAY: [], FRIDAY: [], SATURDAY: [], SUNDAY: [] });

const toDraft = (windows: AvailabilityWindow[]): Draft => {
  const draft = emptyDraft();
  for (const window of windows) draft[window.day_of_week].push({ start_time: window.start_time, end_time: window.end_time });
  for (const day of DAYS) draft[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
  return draft;
};

/** One sentence per problem, or null when the day is fine. Mirrors the rules the API enforces. */
const problemWith = (ranges: TimeRange[]): string | null => {
  for (const range of ranges) {
    if (!range.start_time || !range.end_time) return 'Fill in both times.';
    if (range.end_time <= range.start_time) return 'Each end time must be after its start time.';
  }
  const sorted = [...ranges].sort((a, b) => a.start_time.localeCompare(b.start_time));
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].start_time < sorted[i - 1].end_time) return 'These hours overlap. Merge them into one range.';
  }
  return null;
};

export default function Availability() {
  const toast = useToast();
  const profile = useAppSelector((state) => state.user.profile);
  const doctorId = profile?.id ?? 0;
  const { data, error, reload } = useAsync(() => doctorApi.availability(doctorId), [doctorId]);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (data && draft === null) {
      const initial = toDraft(data);
      setDraft(initial);
      setSaved(JSON.stringify(initial));
    }
  }, [data, draft]);

  const problems = useMemo(() => {
    const result: Partial<Record<DayOfWeek, string>> = {};
    if (draft) for (const day of DAYS) {
      const problem = problemWith(draft[day]);
      if (problem) result[day] = problem;
    }
    return result;
  }, [draft]);

  if (error) return <ErrorNote message={error} onRetry={reload} />;
  if (!draft) return <p className="text-ink-soft">Loading...</p>;

  const dirty = JSON.stringify(draft) !== saved;
  const hasProblems = Object.keys(problems).length > 0;

  const update = (day: DayOfWeek, ranges: TimeRange[]) => setDraft({ ...draft, [day]: ranges });

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const windows: AvailabilityWindow[] = DAYS.flatMap((day) => draft[day].map((range) => ({ day_of_week: day, ...range })));
      const result = await doctorApi.replaceAvailability(windows);
      const next = toDraft(result);
      setDraft(next);
      setSaved(JSON.stringify(next));
      toast.success('Schedule saved. Patients see the new hours straight away.');
    } catch (cause) {
      setSaveError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Availability" description="Set the hours you see patients. Slots are cut into 30-minute visits inside these hours." />

      <Panel flush>
        <ul className="divide-y divide-rule">
          {DAYS.map((day) => (
            <li key={day} className="grid gap-3 px-5 py-4 sm:grid-cols-[8rem_1fr] sm:items-start">
              <h2 className="text-sm font-semibold">{dayLabel(day)}</h2>
              <div>
                {draft[day].length === 0 && <p className="mb-2 text-sm text-ink-soft">Not working</p>}
                <div className="space-y-2">
                  {draft[day].map((range, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        step={1800}
                        aria-label={`${dayLabel(day)} start time ${index + 1}`}
                        value={range.start_time}
                        onChange={(event) => update(day, draft[day].map((r, i) => (i === index ? { ...r, start_time: event.target.value } : r)))}
                        className="h-10 rounded-md border border-rule bg-white px-3 text-sm"
                      />
                      <span className="text-sm text-ink-soft">to</span>
                      <input
                        type="time"
                        step={1800}
                        aria-label={`${dayLabel(day)} end time ${index + 1}`}
                        value={range.end_time}
                        onChange={(event) => update(day, draft[day].map((r, i) => (i === index ? { ...r, end_time: event.target.value } : r)))}
                        className="h-10 rounded-md border border-rule bg-white px-3 text-sm"
                      />
                      <Button variant="ghost" size="sm" aria-label={`Remove ${dayLabel(day)} hours ${index + 1}`} onClick={() => update(day, draft[day].filter((_, i) => i !== index))}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                {problems[day] && (
                  <p role="alert" className="mt-2 text-xs text-red-700">
                    {problems[day]}
                  </p>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => update(day, [...draft[day], { start_time: '09:00', end_time: '13:00' }])}
                >
                  Add hours
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      {saveError && (
        <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {saveError}
        </p>
      )}
      <div className="mt-5 flex items-center gap-3">
        <Button onClick={save} loading={saving} disabled={!dirty || hasProblems}>
          Save schedule
        </Button>
        {dirty && !saving && <span className="text-sm text-ink-soft">You have unsaved changes.</span>}
      </div>
    </>
  );
}
