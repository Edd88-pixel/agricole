import { Outlet } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';

export type AuthenticatedLayoutProps = {
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  onSignOut: () => Promise<void> | void;
};

const AuthenticatedLayout = ({ userName, userEmail, userAvatar, onSignOut }: AuthenticatedLayoutProps) => {
  return (
    <AppShell userName={userName} userEmail={userEmail} userAvatar={userAvatar} onSignOut={onSignOut}>
      <Outlet />
    </AppShell>
  );
};

export default AuthenticatedLayout;
