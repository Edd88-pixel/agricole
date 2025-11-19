import RefreshIcon from '@/components/ui/RefreshIcon';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { BackendHealthStatus } from '@/hooks/useBackendHealth';

const statusCopy: Record<BackendHealthStatus, { label: string; tone: 'success' | 'warning' | 'danger'; helper: string }> = {
  unknown: {
    label: 'Vérification en cours',
    tone: 'warning',
    helper: 'Connexion au backend en cours...'
  },
  ok: {
    label: 'Backend opérationnel',
    tone: 'success',
    helper: 'API disponible et joignable.'
  },
  error: {
    label: 'Backend indisponible',
    tone: 'danger',
    helper: 'Impossible de contacter le backend. Vérifiez la configuration.'
  }
};

type BackendStatusProps = {
  status: BackendHealthStatus;
  lastChecked: Date | null;
  error?: string;
  isChecking?: boolean;
  onRetry?: () => void;
};

const BackendStatus = ({ status, lastChecked, error, isChecking = false, onRetry }: BackendStatusProps) => {
  const copy = statusCopy[status];
  const tone =
    {
      success: 'bg-brand-accent/15 text-brand-accent border-brand-accent/30',
      warning: 'bg-brand-bright/10 text-brand-bright border-brand-bright/30',
      danger: 'bg-brand-danger/10 text-brand-danger border-brand-danger/30'
    }[copy.tone] ?? 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/30';
  return (
    <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${tone}`}
          >
            {copy.label}
          </span>
          {lastChecked && (
            <span className="text-xs text-brand-muted">
              Vérifié à {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>
        <p className="text-sm text-brand-muted">{error ?? copy.helper}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} isLoading={isChecking} leftIcon={<RefreshIcon />}>
          Re-tester
        </Button>
      )}
    </Card>
  );
};

export default BackendStatus;
