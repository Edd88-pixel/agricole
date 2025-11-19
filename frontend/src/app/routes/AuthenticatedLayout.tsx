import { Outlet } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import BackendStatus from '@/components/status/BackendStatus';
import { useBackendHealth } from '@/hooks/useBackendHealth';

export type AuthenticatedLayoutProps = {
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  onSignOut: () => Promise<void> | void;
};

const AuthenticatedLayout = ({ userName, userEmail, userAvatar, onSignOut }: AuthenticatedLayoutProps) => {
  const { status, error, lastChecked, refresh, isChecking } = useBackendHealth();

  return (
    <AppShell userName={userName} userEmail={userEmail} userAvatar={userAvatar} onSignOut={onSignOut}>
      <BackendStatus status={status} error={error} lastChecked={lastChecked} onRetry={refresh} isChecking={isChecking} />
      <Outlet />
    </AppShell>
  );
};

export default AuthenticatedLayout;
