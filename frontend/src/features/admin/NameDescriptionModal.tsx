import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/fields';
import { Modal } from '../../components/ui/Modal';
import { errorMessage, fieldErrorsOf } from '../../utils/errors';
import { blankToNull } from '../../utils/format';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  description: z.string().trim().max(500, 'At most 500 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

export interface NameDescription {
  name: string;
  description: string | null;
}

interface FormProps {
  initial: NameDescription | null;
  nameLabel: string;
  submitLabel: string;
  onSubmit: (values: NameDescription) => Promise<void>;
  onCancel: () => void;
}

function NameDescriptionForm({ initial, nameLabel, submitLabel, onSubmit, onCancel }: FormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: initial?.name ?? '', description: initial?.description ?? '' },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit({ name: values.name, description: blankToNull(values.description) });
    } catch (error) {
      const fields = fieldErrorsOf(error);
      if (fields.name) setError('name', { message: fields.name });
      if (fields.description) setError('description', { message: fields.description });
      setFormError(errorMessage(error));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {formError}
        </p>
      )}
      <Input label={nameLabel} error={errors.name?.message} {...register('name')} />
      <Textarea label="Description (optional)" rows={3} error={errors.description?.message} {...register('description')} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

interface NameDescriptionModalProps {
  open: boolean;
  title: string;
  nameLabel: string;
  initial: NameDescription | null;
  onSubmit: (values: NameDescription) => Promise<void>;
  onClose: () => void;
}

/** Used for both departments and medications, which share the same two fields. The form mounts fresh on every open. */
export function NameDescriptionModal({ open, title, nameLabel, initial, onSubmit, onClose }: NameDescriptionModalProps) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <NameDescriptionForm
        initial={initial}
        nameLabel={nameLabel}
        submitLabel={initial ? 'Save changes' : 'Add'}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
