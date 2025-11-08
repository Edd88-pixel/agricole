import { clsx } from 'clsx';

export type Status = 'healthy' | 'stressed' | 'sick' | 'pending';

type Props = {
  status: Status;
  label: string;
};

const colors: Record<Status, string> = {
  healthy: 'bg-brand-accent/10 text-brand-accent',
  stressed: 'bg-brand-bright/10 text-brand-bright',
  sick: 'bg-brand-danger/10 text-brand-danger',
  pending: 'bg-brand-secondary/10 text-brand-secondary'
};

const icons: Record<Status, string> = {
  healthy: '✅',
  stressed: '⚠️',
  sick: '⛔',
  pending: '⏳'
};

const StatusBadge = ({ status, label }: Props) => (
  <span className={clsx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium', colors[status])}>
    <span aria-hidden>{icons[status]}</span>
    {label}
  </span>
);

export default StatusBadge;
