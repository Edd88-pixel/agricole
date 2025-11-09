import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import type { HistoryEntry } from '../types/history';

type Props = {
  entries: HistoryEntry[];
  onToggleResolved: (id: string) => void;
  onDelete: (id: string) => Promise<void> | void;
  onUpdate: (id: string, updates: { context: string; stage: string }) => Promise<void> | void;
};

type ItemProps = {
  entry: HistoryEntry;
  onToggleResolved: Props['onToggleResolved'];
  onDelete: Props['onDelete'];
  onUpdate: Props['onUpdate'];
};

const HistoryListItem = ({ entry, onToggleResolved, onDelete, onUpdate }: ItemProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [stage, setStage] = useState(entry.stage);
  const [context, setContext] = useState(entry.context);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStage(entry.stage);
    setContext(entry.context);
  }, [entry.context, entry.stage]);

  const handleEdit = () => {
    setStage(entry.stage);
    setContext(entry.context);
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setStage(entry.stage);
    setContext(entry.context);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onUpdate(entry.id, { context, stage });
      setIsEditing(false);
    } catch (updateError) {
      console.error('Unable to update diagnosis entry', updateError);
      setError(t('history.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmation = typeof window === 'undefined' ? true : window.confirm(t('history.deleteConfirm'));
    if (!confirmation) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      await onDelete(entry.id);
    } catch (deleteError) {
      console.error('Unable to delete diagnosis entry', deleteError);
      setError(t('history.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="space-y-5 border border-subtle/70 bg-brand-surface/90 p-6 shadow-[0_12px_32px_rgba(11,30,20,0.08)] transition-all duration-300">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="mt-2 h-2.5 w-2.5 rounded-full bg-brand-secondary shadow-[0_0_0_6px_rgba(16,124,140,0.08)]" aria-hidden />
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-brand-text">{entry.primary.label}</h3>
              <p className="text-xs uppercase tracking-wide text-brand-muted">
                {new Date(entry.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-brand-muted">
                <span className="font-semibold text-brand-text/80">{t('history.stageLabel')}:</span>{' '}
                {isEditing ? stage : entry.stage}
              </p>
            </div>
          </div>
          {isEditing ? (
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{t('diagnosis.stageLabel')}</span>
                <input
                  className="focus-ring w-full rounded-2xl border border-brand-secondary/30 bg-white/80 p-3 text-sm shadow-inner"
                  value={stage}
                  onChange={(event) => setStage(event.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{t('diagnosis.contextLabel')}</span>
                <textarea
                  className="focus-ring w-full rounded-2xl border border-brand-secondary/30 bg-white/80 p-3 text-sm shadow-inner"
                  rows={3}
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                />
              </label>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-subtle/60 bg-brand-background/70 p-3 text-sm text-brand-muted">
              {entry.context}
            </p>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-3 lg:items-end">
          <StatusBadge
            status={entry.status}
            label={{
              healthy: t('common.statusHealthy'),
              stressed: t('common.statusStressed'),
              sick: t('common.statusSick'),
              pending: t('common.statusPending') ?? t('common.loading')
            }[entry.status] ?? ''}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="motion-safe:hover:-translate-y-0.5"
              onClick={() => onToggleResolved(entry.id)}
            >
              {entry.resolved ? t('history.markUnresolved') : t('history.markResolved')}
            </Button>
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  isLoading={isSaving}
                  disabled={context.trim().length === 0 || stage.trim().length === 0}
                >
                  {t('history.save')}
                </Button>
                <Button variant="ghost" onClick={handleCancel}>
                  {t('history.cancel')}
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={handleEdit} className="motion-safe:hover:-translate-y-0.5">
                {t('history.edit')}
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-brand-danger hover:bg-brand-danger/10 motion-safe:hover:-translate-y-0.5"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              {t('history.delete')}
            </Button>
          </div>
        </div>
      </div>
      {error && (
        <p className="rounded-2xl border border-brand-danger/40 bg-brand-danger/10 px-3 py-2 text-sm text-brand-danger">
          {error}
        </p>
      )}
    </Card>
  );
};

const HistoryList = ({ entries, onToggleResolved, onDelete, onUpdate }: Props) => {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <Card>
        <p className="text-sm text-brand-muted">{t('history.empty')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {entries.map((entry) => (
        <HistoryListItem
          key={entry.id}
          entry={entry}
          onToggleResolved={onToggleResolved}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
};

export default HistoryList;
