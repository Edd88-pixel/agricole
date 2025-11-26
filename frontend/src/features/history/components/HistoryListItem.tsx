import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import type { HistoryEntry } from '../types/history';

type ItemProps = {
  entry: HistoryEntry;
  onToggleResolved: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onUpdate: (id: string, updates: { context: string; stage: string }) => void | Promise<void>;
};

const formatRelativeTime = (dateString: string, t: TFunction) => {
  const date = new Date(dateString);
  const now = Date.now();
  const diff = now - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return t('history.justNow', { defaultValue: "À l'instant" });
  if (diff < hour) return t('history.minutesAgo', { count: Math.round(diff / minute), defaultValue: '{{count}} min' });
  if (diff < day) return t('history.hoursAgo', { count: Math.round(diff / hour), defaultValue: '{{count}} h' });
  if (diff < day * 7) return t('history.daysAgo', { count: Math.round(diff / day), defaultValue: '{{count}} j' });
  return date.toLocaleDateString();
};

const HistoryListItem = ({ entry, onToggleResolved, onDelete, onUpdate }: ItemProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [stage, setStage] = useState(entry.stage);
  const [context, setContext] = useState(entry.context);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isNew = Date.now() - new Date(entry.createdAt).getTime() < 24 * 60 * 60 * 1000;

  useEffect(() => {
    setStage(entry.stage);
    setContext(entry.context);
  }, [entry.context, entry.stage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = () => {
    setStage(entry.stage);
    setContext(entry.context);
    setIsEditing(true);
    setError(null);
    setMenuOpen(false);
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
    if (!confirmation) return;

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

  const relativeDate = formatRelativeTime(entry.createdAt, t);
  const statusLabel =
    {
      healthy: t('common.statusHealthy'),
      stressed: t('common.statusStressed'),
      sick: t('common.statusSick'),
      pending: t('common.statusPending') ?? t('common.loading')
    }[entry.status] ?? '';

  const containerColor = entry.resolved ? 'border-emerald-200 bg-emerald-50/70' : 'border-subtle/60 bg-white/80';
  const statusColor = entry.resolved ? 'bg-emerald-500' : 'bg-brand-danger';

  return (
    <div
      className={`relative rounded-2xl p-4 shadow-[0_10px_24px_rgba(11,30,20,0.06)] transition hover:-translate-y-0.5 hover:border-brand-secondary/50 hover:bg-white motion-safe:duration-200 ${
        menuOpen ? 'z-30 shadow-[0_16px_40px_rgba(11,30,20,0.12)]' : ''
      } ${containerColor}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${statusColor} shadow-[0_0_0_6px_rgba(16,124,140,0.08)]`} aria-hidden />
            <h3 className="text-base font-semibold text-brand-text">{entry.primary.label}</h3>
            {isNew && (
              <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-primary">
                {t('history.newBadge', 'Nouveau')}
              </span>
            )}
            {entry.resolved && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {t('history.resolvedBadge', 'Résolu')}
              </span>
            )}
            <span className="text-xs text-brand-muted" title={new Date(entry.createdAt).toLocaleString()}>
              {relativeDate}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={entry.status} label={statusLabel} />
            <span className="rounded-full border border-brand-secondary/30 bg-brand-secondary/10 px-2.5 py-1 text-xs font-semibold text-brand-secondary">
              {entry.stage}
            </span>
            <span className="rounded-full border border-subtle/60 bg-brand-surface/70 px-2.5 py-1 text-xs font-medium text-brand-text/80">
              {entry.crop}
            </span>
          </div>
          {isEditing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{t('diagnosis.stageLabel')}</span>
                <input
                  className="focus-ring w-full rounded-xl border border-brand-secondary/30 bg-white/90 p-3 text-sm"
                  value={stage}
                  onChange={(event) => setStage(event.target.value)}
                />
              </label>
              <label className="sm:col-span-2 space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{t('diagnosis.contextLabel')}</span>
                <textarea
                  className="focus-ring w-full rounded-xl border border-brand-secondary/30 bg-white/90 p-3 text-sm"
                  rows={3}
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                />
              </label>
            </div>
          ) : (
            <p className="text-sm text-brand-muted line-clamp-2" title={entry.context}>
              {entry.context || t('history.noContext', 'Aucun contexte indiqué')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 self-start lg:flex-col lg:items-end">
          <Button variant="secondary" className="min-w-[150px] justify-center py-2 text-sm shadow-none" onClick={() => onToggleResolved(entry.id)}>
            {entry.resolved ? t('history.markUnresolved') : t('history.markResolved')}
          </Button>
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              className="h-10 w-10 rounded-full border border-subtle/60 px-0 text-xl"
              aria-label={t('history.moreActions', "Plus d'actions")}
              onClick={() => setMenuOpen((open) => !open)}
            >
              ...
            </Button>
            {menuOpen && (
              <div className="absolute right-0 top-12 z-40 w-48 rounded-xl border border-subtle/60 bg-white p-2 shadow-lg">
                <Link
                  className="block rounded-lg px-3 py-2 text-left text-sm text-brand-text hover:bg-brand-surface/70 focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  to={`/history/${entry.id}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {t('history.open', 'Ouvrir')}
                </Link>
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-brand-text hover:bg-brand-surface/70 focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  onClick={handleEdit}
                >
                  {t('history.edit')}
                </button>
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-brand-danger hover:bg-brand-danger/10 focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? t('common.loading') : t('history.delete')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {isEditing && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={handleSave} isLoading={isSaving} disabled={context.trim().length === 0 || stage.trim().length === 0} className="py-2 text-sm">
            {t('history.save')}
          </Button>
          <Button variant="ghost" onClick={handleCancel} className="py-2 text-sm">
            {t('history.cancel')}
          </Button>
        </div>
      )}
      {error && (
        <p className="mt-3 rounded-xl border border-brand-danger/40 bg-brand-danger/10 px-3 py-2 text-sm text-brand-danger">
          {error}
        </p>
      )}
    </div>
  );
};

export default HistoryListItem;
