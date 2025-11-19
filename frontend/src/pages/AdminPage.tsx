import AdminOverview from '@/features/common/components/AdminOverview';

type AdminPageProps = {
  pendingFeedback: number;
  pendingArticles: number;
};

const AdminPage = ({ pendingArticles, pendingFeedback }: AdminPageProps) => (
  <AdminOverview pendingFeedback={pendingFeedback} pendingArticles={pendingArticles} />
);

export default AdminPage;
