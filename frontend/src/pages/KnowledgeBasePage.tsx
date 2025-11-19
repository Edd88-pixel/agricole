import KnowledgeBase from '@/features/kb/components/KnowledgeBase';
import type { KnowledgeArticle } from '@/features/kb/types/article';

type KnowledgeBasePageProps = {
  articles: KnowledgeArticle[];
  isLoading: boolean;
};

const KnowledgeBasePage = ({ articles, isLoading }: KnowledgeBasePageProps) => {
  return <KnowledgeBase articles={articles} isLoading={isLoading} />;
};

export default KnowledgeBasePage;
