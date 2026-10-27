import type { AppointmentStatus } from '../../types';
import { STATUS_LABEL } from '../../utils/format';
import { Badge, type Tone } from '../ui/Badge';

const TONE: Record<AppointmentStatus, Tone> = {
  BOOKED: 'blue',
  CONFIRMED: 'green',
  COMPLETED: 'neutral',
  CANCELLED: 'red',
  NO_SHOW: 'amber',
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}
