import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Props = {
  pendingFeedback: number;
  pendingArticles: number;
};

const AdminOverview = ({ pendingFeedback, pendingArticles }: Props) => {
  const { t } = useTranslation();

  return (
    <Card className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-brand-text">{t('admin.title')}</h1>
        <p className="text-sm text-brand-muted">{t('admin.subtitle')}</p>
      </header>
      <div className="space-y-3 text-sm text-brand-text">
        <p>{t('admin.feedback', { count: pendingFeedback })}</p>
        <p>{t('admin.articles', { count: pendingArticles })}</p>
      </div>
      <Button variant="secondary">{t('admin.console')}</Button>
    </Card>
  );
};

export default AdminOverview;
