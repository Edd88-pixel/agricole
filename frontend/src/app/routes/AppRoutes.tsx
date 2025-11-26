import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import AuthenticatedLayout from '@/app/routes/AuthenticatedLayout';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardPage from '@/pages/DashboardPage';
import QuickDiagnosisPage from '@/pages/QuickDiagnosisPage';
import GuidedDiagnosisPage from '@/pages/GuidedDiagnosisPage';
import HistoryPage from '@/pages/HistoryPage';
import KnowledgeBasePage from '@/pages/KnowledgeBasePage';
import SettingsPage from '@/pages/SettingsPage';
import ProfileSettingsPage from '@/pages/ProfileSettingsPage';
import AdminPage from '@/pages/AdminPage';
import MediaLibraryPage from '@/pages/MediaLibraryPage';
import HistoryDetailsPage from '@/pages/HistoryDetailsPage';
import { useDataContext } from '@/app/providers/DataProvider';
import { useTranslation } from 'react-i18next';
import AuthGateway from '@/features/auth/components/AuthGateway';
import { useAuthState, signOut } from '@/services/api/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { SupportedLocale } from '@/features/profile/types/profile';

const AppRoutes = () => {
  const { session, isLoading: authLoading } = useAuthState();
  const user = session?.user ?? null;
  const { profile, isLoading: profileLoading, completeOnboarding, updateLocale, updateProfileDetails, error: profileError } =
    useUserProfile(user);
  const {
    history,
    historyLoading,
    addResultToHistory,
    toggleResolved,
    removeDiagnosis,
    updateDiagnosis,
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

  const metaFirst = (session.user.user_metadata?.first_name as string | undefined)?.trim();
  const metaLast = (session.user.user_metadata?.last_name as string | undefined)?.trim();
  const userFirstName = profile?.firstName || metaFirst;
  const userLastName = profile?.lastName || metaLast;
  const computedName = [userFirstName, userLastName].filter((value) => value && value.length > 0).join(' ');
  const userName =
    computedName ||
    profile?.displayName ||
    (session.user.user_metadata?.full_name as string | undefined) ||
    session.user.email?.split('@')[0] ||
    'Producer';
  const greetingName = userFirstName ?? userName;
  const userAvatar = profile?.avatarUrl ?? undefined;

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

  const layoutProps = {
    userName,
    userEmail: session.user.email ?? '',
    userAvatar,
    onSignOut: handleSignOut
  };

  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage onComplete={handleOnboardingComplete} />} />
      <Route element={<AuthenticatedLayout {...layoutProps} />}>
        <Route
          index
          element={<DashboardPage userName={userName} greetingName={greetingName} recent={history.slice(0, 3)} isLoading={historyLoading} />}
        />
        <Route
          path="/dashboard"
          element={<DashboardPage userName={userName} greetingName={greetingName} recent={history.slice(0, 3)} isLoading={historyLoading} />}
        />
        <Route path="/diagnosis/quick" element={<QuickDiagnosisPage onResult={addResultToHistory} />} />
        <Route path="/diagnosis/guided" element={<GuidedDiagnosisPage onResult={addResultToHistory} />} />
        <Route
          path="/history"
          element={
            <HistoryPage
              entries={history}
              onToggleResolved={toggleResolved}
              onDelete={removeDiagnosis}
              onUpdate={updateDiagnosis}
              isLoading={historyLoading}
            />
          }
        />
        <Route path="/history/:id" element={<HistoryDetailsPage />} />
        <Route path="/knowledge-base" element={<KnowledgeBasePage articles={articles} isLoading={articlesLoading} />} />
        <Route path="/library" element={<MediaLibraryPage entries={history} isLoading={historyLoading} />} />
        <Route
          path="/settings"
          element={
            <SettingsPage
              profile={profile}
              greetingName={greetingName}
              userEmail={session.user.email ?? ''}
              language={i18n.language}
              onChangeLanguage={handleLanguageChange}
              onUpdate={updateProfileDetails}
            />
          }
        />
        <Route
          path="/settings/profile"
          element={
            <ProfileSettingsPage
              profile={profile}
              greetingName={greetingName}
              userEmail={session.user.email ?? ''}
              onUpdate={updateProfileDetails}
            />
          }
        />
        <Route path="/admin" element={<AdminPage pendingFeedback={3} pendingArticles={2} />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
