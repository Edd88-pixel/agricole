import { Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { DataProvider } from '@/app/providers/DataProvider';
import AppRoutes from '@/app/routes/AppRoutes';
import { initI18n } from '@/app/i18n';
import Skeleton from '@/components/ui/Skeleton';

initI18n();

const App = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <ThemeProvider>
      <DataProvider>
        <Suspense fallback={<Skeleton className="h-screen w-full" />}>
          <AppRoutes />
        </Suspense>
      </DataProvider>
    </ThemeProvider>
  );
};

export default App;
