import { useEffect, useRef, useState } from 'react';
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
import { createProfile, fetchProfile, updateProfile } from '@/services/supabase/profile';
import type { SupportedLocale } from '@/features/profile/types/profile';
import { uploadProfileAvatar } from '@/services/supabase/storage';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type SignInValues = z.infer<typeof signInSchema>;

const signUpSchema = signInSchema
  .extend({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    avatar: z.any().optional(),
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' }
  });
  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      consent: false,
      firstName: '',
      lastName: '',
      avatar: undefined
    }
  });

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const onSubmitSignIn = signInForm.handleSubmit(async (values) => {
    setError(null);
    const { error: authError } = await signIn(values.email, values.password);
    if (authError) {
      setError(authError.message);
    }
  });

  const onSubmitSignUp = signUpForm.handleSubmit(async (values) => {
    setError(null);
    const avatarFiles = values.avatar as FileList | undefined;
    const avatarFile = avatarFiles && avatarFiles.length > 0 ? avatarFiles[0] : null;

    const { error: authError } = await signUp({
      email: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    const signInResult = await signIn(values.email, values.password);
    if (signInResult.error) {
      setError(signInResult.error.message);
      return;
    }

    const user = signInResult.data.user;
    if (user) {
      try {
        const locale = (i18n.language.slice(0, 2) as SupportedLocale) === 'en' ? 'en' : 'fr';
        let avatarPath: string | undefined;
        if (avatarFile) {
          avatarPath = await uploadProfileAvatar(avatarFile);
        }
        const displayName = `${values.firstName} ${values.lastName}`.trim() || values.email;
        const existing = await fetchProfile(user.id);
        if (!existing) {
          await createProfile({
            id: user.id,
            email: values.email,
            displayName,
            firstName: values.firstName,
            lastName: values.lastName,
            avatarPath,
            locale,
            onboardingCompleted: false,
            crops: []
          });
        } else {
          await updateProfile(user.id, {
            firstName: values.firstName,
            lastName: values.lastName,
            displayName,
            avatarPath: avatarPath ?? existing.avatarPath
          });
        }
      } catch (profileError) {
        console.error('Unable to initialise profile after sign-up', profileError);
      }
    }

    signInForm.reset({ email: values.email, password: values.password });
    signUpForm.reset({
      email: values.email,
      password: values.password,
      confirmPassword: values.password,
      consent: values.consent,
      firstName: values.firstName,
      lastName: values.lastName,
      avatar: undefined
    });
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    setMode('signin');
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
              {mode === 'signup' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-brand-text">{t('auth.firstName')}</span>
                    <input
                      className="focus-ring w-full rounded-2xl border border-subtle bg-brand-surface/80 p-4 text-sm shadow-inner"
                      {...signUpForm.register('firstName')}
                      autoComplete="given-name"
                    />
                    {signUpForm.formState.errors.firstName && (
                      <span className="text-sm text-brand-danger">{signUpForm.formState.errors.firstName.message}</span>
                    )}
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-brand-text">{t('auth.lastName')}</span>
                    <input
                      className="focus-ring w-full rounded-2xl border border-subtle bg-brand-surface/80 p-4 text-sm shadow-inner"
                      {...signUpForm.register('lastName')}
                      autoComplete="family-name"
                    />
                    {signUpForm.formState.errors.lastName && (
                      <span className="text-sm text-brand-danger">{signUpForm.formState.errors.lastName.message}</span>
                    )}
                  </label>
                </div>
              )}
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
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-brand-text">{t('auth.avatarLabel')}</span>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-full border border-subtle bg-brand-background">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt={t('common.profileAvatarAlt') ?? 'Avatar'} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-brand-muted">🙂</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const files = event.target.files ?? undefined;
                              signUpForm.setValue('avatar', files);
                              if (avatarPreview) {
                                URL.revokeObjectURL(avatarPreview);
                              }
                              if (files && files[0]) {
                                setAvatarPreview(URL.createObjectURL(files[0]));
                              } else {
                                setAvatarPreview(null);
                              }
                            }}
                          />
                          <Button type="button" variant="secondary" onClick={() => avatarInputRef.current?.click()}>
                            {t('auth.selectAvatar')}
                          </Button>
                        </div>
                        <button
                          type="button"
                          className="text-left text-sm text-brand-muted underline"
                          onClick={() => {
                            signUpForm.setValue('avatar', undefined);
                            if (avatarPreview) {
                              URL.revokeObjectURL(avatarPreview);
                            }
                            setAvatarPreview(null);
                          }}
                        >
                          {t('auth.removeAvatar')}
                        </button>
                      </div>
                    </div>
                  </div>
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
