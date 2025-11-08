import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import LanguageSelector from '@/components/ui/LanguageSelector';
import ThemeSelector from '@/components/ui/ThemeSelector';
import { useTheme } from '@/app/providers/ThemeProvider';
import { signIn, signUp } from '@/services/supabase/auth';
import { supportedLanguages } from '@/app/i18n';
import Card from '@/components/ui/Card';
import AuthHero from './AuthHero';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type SignInValues = z.infer<typeof signInSchema>;

const signUpSchema = signInSchema
  .extend({
    confirmPassword: z.string().min(8),
    consent: z.boolean().refine(Boolean, 'consentRequired')
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword']
  });

type SignUpValues = z.infer<typeof signUpSchema>;

type AuthMode = 'signin' | 'signup';

const AuthGateway = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [error, setError] = useState<string | null>(null);
  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' }
  });
  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', consent: false }
  });

  const onSubmitSignIn = signInForm.handleSubmit(async (values) => {
    setError(null);
    const { error: authError } = await signIn(values.email, values.password);
    if (authError) {
      setError(authError.message);
    }
  });

  const onSubmitSignUp = signUpForm.handleSubmit(async (values) => {
    setError(null);
    const { error: authError } = await signUp(values.email, values.password);
    if (authError) {
      setError(authError.message);
    } else {
      setMode('signin');
      signInForm.reset({ email: values.email, password: values.password });
    }
  });

  const activeForm = mode === 'signin' ? signInForm : signUpForm;

  const changeLanguage = (lng: string) => {
    if (supportedLanguages.includes(lng as (typeof supportedLanguages)[number])) {
      void i18n.changeLanguage(lng);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-background px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-primary/20 to-transparent" />
      <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-brand-secondary/40 via-transparent to-brand-accent/40 lg:block" />
      <header className="mb-8 flex w-full max-w-5xl items-center justify-between text-sm text-brand-muted">
        <span className="font-semibold text-brand-primary">{t('common.brandName')}</span>
        <div className="flex items-center gap-3">
          <LanguageSelector value={i18n.language} onChange={changeLanguage} />
          <ThemeSelector value={theme} onChange={setTheme} />
        </div>
      </header>
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        <AuthHero t={t} />
        <Card className="relative p-10">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand-secondary/40 to-transparent" />
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-brand-text dark:text-white">
                {mode === 'signin' ? t('auth.signInTitle') : t('auth.signUpTitle')}
              </h2>
              <p className="text-sm text-brand-muted">
                {mode === 'signin' ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}
              </p>
            </div>
            <form className="space-y-4" onSubmit={mode === 'signin' ? onSubmitSignIn : onSubmitSignUp}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-brand-text">{t('auth.email')}</span>
                <input
                  type="email"
                  className="focus-ring w-full rounded-2xl border border-subtle bg-brand-surface/80 p-4 text-sm shadow-inner"
                  {...activeForm.register('email')}
                  autoComplete="email"
                />
                {activeForm.formState.errors.email && (
                  <span className="text-sm text-brand-danger">{activeForm.formState.errors.email.message}</span>
                )}
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-brand-text">{t('auth.password')}</span>
                <input
                  type="password"
                  className="focus-ring w-full rounded-2xl border border-subtle bg-brand-surface/80 p-4 text-sm shadow-inner"
                  {...activeForm.register('password')}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                {activeForm.formState.errors.password && (
                  <span className="text-sm text-brand-danger">{activeForm.formState.errors.password.message}</span>
                )}
              </label>
              {mode === 'signup' && (
                <>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-brand-text">{t('auth.confirmPassword')}</span>
                    <input
                      type="password"
                      className="focus-ring w-full rounded-2xl border border-subtle bg-brand-surface/80 p-4 text-sm shadow-inner"
                      {...signUpForm.register('confirmPassword')}
                      autoComplete="new-password"
                    />
                    {signUpForm.formState.errors.confirmPassword && (
                      <span className="text-sm text-brand-danger">
                        {signUpForm.formState.errors.confirmPassword.message === 'passwordMismatch'
                          ? t('auth.passwordMismatch')
                          : signUpForm.formState.errors.confirmPassword.message}
                      </span>
                    )}
                  </label>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-subtle text-brand-primary focus:ring-brand-primary"
                      {...signUpForm.register('consent')}
                    />
                    <span className="text-brand-muted">{t('auth.agreeTerms')}</span>
                    {signUpForm.formState.errors.consent && (
                      <span className="text-sm text-brand-danger">
                        {signUpForm.formState.errors.consent.message === 'consentRequired'
                          ? t('auth.consentRequired')
                          : signUpForm.formState.errors.consent.message}
                      </span>
                    )}
                  </label>
                </>
              )}
              {error && <p className="rounded-xl bg-brand-danger/10 p-3 text-sm text-brand-danger">{error}</p>}
              <Button type="submit" size="lg" className="w-full">
                {mode === 'signin' ? t('auth.signInAction') : t('auth.signUpAction')}
              </Button>
            </form>
            <div className="text-sm text-brand-muted">
              {mode === 'signin' ? (
                <button
                  type="button"
                  className="text-brand-secondary underline"
                  onClick={() => setMode('signup')}
                >
                  {t('auth.switchToSignUp')}
                </button>
              ) : (
                <button
                  type="button"
                  className="text-brand-secondary underline"
                  onClick={() => setMode('signin')}
                >
                  {t('auth.switchToSignIn')}
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthGateway;
