import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/fields';
import { useToast } from '../../components/ui/Toast';
import { appointmentApi } from '../../services/appointment.api';
import type { VitalSigns } from '../../types';
import { errorMessage } from '../../utils/errors';

// The same ranges the API enforces, so most mistakes are caught before a request is sent.
const measurement = (label: string, min: number, max: number, integer = false) => {
  let base = z
    .number({ invalid_type_error: `${label} must be a number` })
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);
  if (integer) base = base.int(`${label} must be a whole number`);
  return base.nullable();
};

const schema = z
  .object({
    bp_systolic: measurement('Systolic pressure', 50, 300, true),
    bp_diastolic: measurement('Diastolic pressure', 30, 200, true),
    heart_rate: measurement('Heart rate', 20, 300, true),
    temperature_f: measurement('Temperature', 80, 115),
    weight_kg: measurement('Weight', 1, 500),
    height_cm: measurement('Height', 30, 260),
    spo2: measurement('SpO2', 0, 100, true),
  })
  .refine((v) => (v.bp_systolic === null) === (v.bp_diastolic === null), {
    message: 'Enter both blood pressure values',
    path: ['bp_diastolic'],
  })
  .refine((v) => v.bp_systolic === null || v.bp_diastolic === null || v.bp_diastolic < v.bp_systolic, {
    message: 'Diastolic pressure must be lower than systolic',
    path: ['bp_diastolic'],
  });

type FormValues = z.infer<typeof schema>;

/** Blank input -> null (not measured), anything else -> number. */
const toNumber = (value: unknown): number | null => (value === '' || value === null || value === undefined ? null : Number(value));

interface VitalsFormProps {
  appointmentId: number;
  initial: VitalSigns | null;
  onSaved: (vitals: VitalSigns) => void;
}

export function VitalsForm({ appointmentId, initial, onSaved }: VitalsFormProps) {
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bp_systolic: initial?.bp_systolic ?? null,
      bp_diastolic: initial?.bp_diastolic ?? null,
      heart_rate: initial?.heart_rate ?? null,
      temperature_f: initial?.temperature_f ?? null,
      weight_kg: initial?.weight_kg ?? null,
      height_cm: initial?.height_cm ?? null,
      spo2: initial?.spo2 ?? null,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    if (Object.values(values).every((value) => value === null)) {
      setFormError('Enter at least one measurement.');
      return;
    }
    try {
      const saved = await appointmentApi.saveVitals(appointmentId, values);
      toast.success('Vital signs saved');
      reset(values);
      onSaved(saved);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  const field = (name: keyof FormValues) => register(name, { setValueAs: toNumber });

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {formError}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Systolic (mmHg)" type="number" inputMode="numeric" error={errors.bp_systolic?.message} {...field('bp_systolic')} />
        <Input label="Diastolic (mmHg)" type="number" inputMode="numeric" error={errors.bp_diastolic?.message} {...field('bp_diastolic')} />
        <Input label="Heart rate (beats/min)" type="number" inputMode="numeric" error={errors.heart_rate?.message} {...field('heart_rate')} />
        <Input label="SpO2 (%)" type="number" inputMode="numeric" error={errors.spo2?.message} {...field('spo2')} />
        <Input label="Temperature (°F)" type="number" step="0.1" inputMode="decimal" error={errors.temperature_f?.message} {...field('temperature_f')} />
        <Input label="Weight (kg)" type="number" step="0.1" inputMode="decimal" error={errors.weight_kg?.message} {...field('weight_kg')} />
        <Input label="Height (cm)" type="number" step="0.1" inputMode="decimal" error={errors.height_cm?.message} {...field('height_cm')} />
      </div>
      <div className="mt-4">
        <Button type="submit" variant="secondary" loading={isSubmitting} disabled={!isDirty && initial !== null}>
          {initial ? 'Update vital signs' : 'Save vital signs'}
        </Button>
      </div>
    </form>
  );
}
