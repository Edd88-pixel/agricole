import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import OnboardingFlow from '@/features/auth/components/OnboardingFlow';
import DashboardHome from '@/features/dashboard/components/DashboardHome';
import QuickScanForm from '@/features/diagnosis/components/QuickScanForm';
import GuidedScanForm from '@/features/diagnosis/components/GuidedScanForm';
import HistoryList from '@/features/history/components/HistoryList';
import KnowledgeBase from '@/features/kb/components/KnowledgeBase';
import PreferencesPanel from '@/features/settings/components/PreferencesPanel';
import AdminOverview from '@/features/common/components/AdminOverview';
import { useDataContext } from '@/app/providers/DataProvider';
import { useTranslation } from 'react-i18next';
import AuthGateway from '@/features/auth/components/AuthGateway';
import { useAuthState, signOut } from '@/services/supabase/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { SupportedLocale } from '@/features/profile/types/profile';

const LazyHistoryDetails = lazy(() => import('@/features/history/components/HistoryReport'));

const AppRoutes = () => {
  const { session, isLoading: authLoading } = useAuthState();
  const user = session?.user ?? null;
  const { profile, isLoading: profileLoading, completeOnboarding, updateLocale, error: profileError } =
    useUserProfile(user);
  const {
    history,
    historyLoading,
    addResultToHistory,
    toggleResolved,
    articles,
    articlesLoading
  } = useDataContext();
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.locale && i18n.language !== profile.locale) {
      void i18n.changeLanguage(profile.locale);
    }
  }, [i18n, profile?.locale]);

  useEffect(() => {
    if (session && profile && !profile.onboardingCompleted && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [location.pathname, navigate, profile, session]);

  if (authLoading || profileLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<AuthGateway />} />
      </Routes>
    );
  }

  const userName =
    profile?.displayName ||
    (session.user.user_metadata?.full_name as string | undefined) ||
    session.user.email?.split('@')[0] ||
    'Producer';

  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-background p-6">
        <Card className="max-w-lg space-y-4 text-center">
          <h2 className="text-xl font-semibold text-brand-danger">{t('common.profileLoadError')}</h2>
          <p className="text-sm text-brand-muted">{profileError.message}</p>
        </Card>
      </div>
    );
  }

  const handleOnboardingComplete = async (values: Parameters<typeof completeOnboarding>[0]) => {
    await completeOnboarding(values);
    navigate('/dashboard', { replace: true });
  };

  const handleLanguageChange = async (lng: string) => {
    if (lng === 'fr' || lng === 'en') {
      await updateLocale(lng as SupportedLocale);
      void i18n.changeLanguage(lng);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={
          <div className="flex min-h-screen items-center justify-center bg-brand-background p-6">
            <OnboardingFlow onComplete={handleOnboardingComplete} />
          </div>
        }
      />
      <Route
        path="/"
        element={
          <AppShell userName={userName} userEmail={session.user.email ?? ''} onSignOut={handleSignOut}>
            <DashboardHome userName={userName} recent={history.slice(0, 3)} isLoading={historyLoading} />
          </AppShell>
        }
      />
      <Route
        path="/dashboard"
        element={
          <AppShell userName={userName} userEmail={session.user.email ?? ''} onSignOut={handleSignOut}>
            <DashboardHome userName={userName} recent={history.slice(0, 3)} isLoading={historyLoading} />
          </AppShell>
        }
      />
      <Route
        path="/diagnosis/quick"
        element={
          <AppShell userName={userName} userEmail={session.user.email ?? ''} onSignOut={handleSignOut}>
            <QuickScanForm onResult={addResultToHistory} />
          </AppShell>
        }
      />
      <Route
        path="/diagnosis/guided"
        element={
          <AppShell userName={userName} userEmail={session.user.email ?? ''} onSignOut={handleSignOut}>
            <GuidedScanForm onResult={addResultToHistory} />
          </AppShell>
        }
      />
      <Route
        path="/history"
        element={
          <AppShell userName={userName} userEmail={session.user.email ?? ''} onSignOut={handleSignOut}>
            <HistoryList entries={history} onToggleResolved={toggleResolved} />
          </AppShell>
        }
      />
      <Route
        path="/history/:id"
        element={
          <AppShell userName={userName} userEmail={session.user.email ?? ''} onSignOut={handleSignOut}>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <LazyHistoryDetails />
            </Suspense>
          </AppShell>
        }
      />
      <Route
        path="/knowledge-base"
        element={
          <AppShell userName={userName} userEmail={session.user.email ?? ''} onSignOut={handleSignOut}>
            <KnowledgeBase articles={articles} isLoading={articlesLoading} />
          </AppShell>
        }
      />
      <Route
        path="/settings"
        element={
          <AppShell userName={userName} userEmail={session.user.email ?? ''} onSignOut={handleSignOut}>
            <PreferencesPanel language={i18n.language} onChangeLanguage={handleLanguageChange} />
          </AppShell>
        }
      />
      <Route
        path="/admin"
        element={
          <AppShell userName={userName} userEmail={session.user.email ?? ''} onSignOut={handleSignOut}>
            <AdminOverview pendingFeedback={3} pendingArticles={2} />
          </AppShell>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
);
};

export default AppRoutes;
