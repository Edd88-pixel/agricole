import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import type { KnowledgeArticle } from '../types/article';

type Props = {
  articles: KnowledgeArticle[];
  isLoading?: boolean;
};

const KnowledgeBase = ({ articles, isLoading = false }: Props) => {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const localized = articles.filter((article) => article.locale === i18n.language);
    if (!query) return localized;
    return localized.filter((article) =>
      `${article.crop} ${article.symptom} ${article.title}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [articles, i18n.language, query]);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-brand-text">{t('kb.title')}</h1>
        <input
          className="focus-ring w-full rounded-xl border border-subtle bg-brand-surface p-3 text-sm"
          placeholder={t('kb.searchPlaceholder') ?? ''}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-live="polite">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((article) => (
            <Card key={article.id} className="space-y-3">
              <p className="text-sm font-semibold text-brand-secondary">{article.crop}</p>
              <h2 className="text-lg font-semibold text-brand-text">{article.title}</h2>
              <p className="text-sm text-brand-muted">{article.summary}</p>
              <button type="button" className="focus-ring text-sm font-semibold text-brand-secondary">
                {t('kb.more')}
              </button>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-brand-muted">{t('kb.empty')}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
