import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/fields';
import { Modal } from '../ui/Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  /** When set, shows an optional text box and passes its value to onConfirm. */
  reasonLabel?: string;
  busy?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, tone = 'primary', reasonLabel, busy = false, onConfirm, onClose }: ConfirmDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Keep it
          </Button>
          <Button variant={tone} loading={busy} onClick={() => onConfirm(reason.trim())}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm">{message}</div>
      {reasonLabel && (
        <Textarea label={reasonLabel} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} wrapperClassName="mt-4" />
      )}
    </Modal>
  );
}
