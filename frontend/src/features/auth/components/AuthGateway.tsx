import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import { useTheme } from '@/app/providers/ThemeProvider';
import { signIn, signUp } from '@/services/api/auth';
import Card from '@/components/ui/Card';
import AuthHero from './AuthHero';
import AuthHeader from './AuthHeader';
import AvatarPicker from './AvatarPicker';
import { createProfile, fetchProfile, updateProfile } from '@/services/api/profile';
import { uploadProfileAvatar } from '@/services/api/storage';
import { buildDisplayName, normalizeLocale } from './authHelpers';

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
type SignUpStatus = 'idle' | 'submitting' | 'awaiting-verification' | 'success';

const AuthGateway = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signUpStatus, setSignUpStatus] = useState<SignUpStatus>('idle');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verificationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const isSubmitBlocked = useMemo(
    () => signInLoading || signUpStatus === 'submitting' || signUpStatus === 'awaiting-verification',
    [signInLoading, signUpStatus]
  );

  const cleanupAvatarPreview = useCallback(() => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
  }, [avatarPreview]);

  const showNotice = useCallback((message: string, durationMs = 5000) => {
    setNotice(message);
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }
    noticeTimeoutRef.current = setTimeout(() => setNotice(null), durationMs);
  }, []);

  const clearVerificationInterval = useCallback(() => {
    if (verificationIntervalRef.current) {
      clearInterval(verificationIntervalRef.current);
      verificationIntervalRef.current = null;
    }
  }, []);

  const handleAvatarFilesChange = useCallback(
    (files?: FileList | null) => {
      signUpForm.setValue('avatar', files ?? undefined);
      if (files && files[0]) {
        cleanupAvatarPreview();
        setAvatarPreview(URL.createObjectURL(files[0]));
      } else {
        cleanupAvatarPreview();
      }
    },
    [cleanupAvatarPreview, signUpForm]
  );

  const handleAvatarClear = useCallback(() => {
    signUpForm.setValue('avatar', undefined);
    cleanupAvatarPreview();
  }, [cleanupAvatarPreview, signUpForm]);

  useEffect(
    () => () => {
      cleanupAvatarPreview();
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
      clearVerificationInterval();
    },
    [cleanupAvatarPreview, clearVerificationInterval]
  );

  const resetForms = useCallback(
    (values: SignUpValues) => {
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
      cleanupAvatarPreview();
    },
    [cleanupAvatarPreview, signInForm, signUpForm]
  );

  const handleSignIn = signInForm.handleSubmit(async (values) => {
    setError(null);
    setSignInLoading(true);
    try {
      await signIn(values.email, values.password);
    } catch (authError) {
      setError(t('auth.signInError', 'Connexion impossible. Verifiez vos identifiants ou la verification email.'));
    }
    setSignInLoading(false);
  });

  const completeProfile = useCallback(
    async (currentUser: { id: string } | null, values: SignUpValues, avatarFile: File | null) => {
      if (!currentUser) return;
      try {
        const locale = normalizeLocale(i18n.language);
        const avatarPath = avatarFile ? await uploadProfileAvatar(avatarFile) : undefined;
        const displayName = buildDisplayName(values.firstName, values.lastName, values.email);
        const existing = await fetchProfile();
        if (!existing) {
          await createProfile({
            id: currentUser.id,
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
          await updateProfile({
            firstName: values.firstName,
            lastName: values.lastName,
            displayName,
            avatarPath: avatarPath ?? existing.avatarPath
          });
        }
        setSignUpStatus('success');
        showNotice(t('auth.verificationSuccess', 'Email verifie et profil cree. Redirection...'));
        resetForms(values);
        setMode('signin');
        setTimeout(() => window.location.reload(), 1000);
      } catch (profileError) {
        console.error('Unable to initialise profile after sign-up', profileError);
        setSignUpStatus('idle');
        setError(t('auth.profileInitError', "Impossible de creer le profil avec l'avatar"));
      }
    },
    [i18n.language, resetForms, showNotice, t]
  );

  const onSubmitSignUp = signUpForm.handleSubmit(async (values) => {
    setError(null);
    setNotice(null);
    setSignUpStatus('submitting');

    const avatarFiles = (values.avatar as FileList | undefined) ?? (signUpForm.getValues().avatar as FileList | undefined);
    const avatarFile = avatarFiles && avatarFiles.length > 0 ? avatarFiles[0] : null;
    const email = values.email;
    const password = values.password;

    let user = null;
    let accessToken = null;
    try {
      const result = await signUp({
        email,
        password,
        firstName: values.firstName,
        lastName: values.lastName
      });
      user = result.user;
      accessToken = result.accessToken ?? null;
    } catch (authError) {
      setError(t('auth.signUpError', 'Impossible de creer le compte. Verifiez vos informations.'));
      setSignUpStatus('idle');
      return;
    }

    if (accessToken) {
      await completeProfile(user, values, avatarFile);
      return;
    }

    setSignUpStatus('awaiting-verification');
    showNotice(
      t(
        'auth.verifyEmailNotice',
        'Un email de verification vous a ete envoye. Cliquez sur le lien puis revenez; nous finaliserons votre profil.'
      ),
      5000
    );

    const pollForVerification = async () => {
      try {
        const signInResult = await signIn(email, password);
        clearVerificationInterval();
        await completeProfile(signInResult.user, values, avatarFile);
      } catch {
        // Keep polling until the user confirms their email.
      }
    };

    clearVerificationInterval();
    verificationIntervalRef.current = setInterval(pollForVerification, 5000);
    await pollForVerification();
  });

  const emailRegister = mode === 'signin' ? signInForm.register('email') : signUpForm.register('email');
  const passwordRegister = mode === 'signin' ? signInForm.register('password') : signUpForm.register('password');
  const emailError = mode === 'signin' ? signInForm.formState.errors.email : signUpForm.formState.errors.email;
  const passwordError =
    mode === 'signin' ? signInForm.formState.errors.password : signUpForm.formState.errors.password;

  const handleLanguageChange = (lng: string) => {
    void i18n.changeLanguage(lng);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-background px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-primary/20 to-transparent" />
      <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-brand-secondary/40 via-transparent to-brand-accent/40 lg:block" />
      <AuthHeader t={t} language={i18n.language} onLanguageChange={handleLanguageChange} theme={theme} onThemeChange={setTheme} />
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
            <form className="space-y-4" onSubmit={mode === 'signin' ? handleSignIn : onSubmitSignUp}>
              {mode === 'signup' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-brand-text">{t('auth.firstName')}</span>
                    <input
                      className="focus-ring w-full rounded-2xl border border-subtle bg-brand-surface/80 p-4 text-sm shadow-inner"
                      {...signUpForm.register('firstName')}
                      autoComplete="given-name"
                      disabled={isSubmitBlocked}
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
                      disabled={isSubmitBlocked}
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
                  disabled={isSubmitBlocked}
                  {...emailRegister}
                  autoComplete="email"
                />
                {emailError && <span className="text-sm text-brand-danger">{emailError.message}</span>}
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-brand-text">{t('auth.password')}</span>
                <input
                  type="password"
                  className="focus-ring w-full rounded-2xl border border-subtle bg-brand-surface/80 p-4 text-sm shadow-inner"
                  disabled={isSubmitBlocked}
                  {...passwordRegister}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                {passwordError && <span className="text-sm text-brand-danger">{passwordError.message}</span>}
              </label>
              {mode === 'signup' && (
                <>
                  <AvatarPicker
                    label={t('auth.avatarLabel')}
                    selectLabel={t('auth.selectAvatar')}
                    removeLabel={t('auth.removeAvatar')}
                    preview={avatarPreview}
                    disabled={isSubmitBlocked}
                    onChange={handleAvatarFilesChange}
                    onClear={handleAvatarClear}
                  />
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-brand-text">{t('auth.confirmPassword')}</span>
                    <input
                      type="password"
                      className="focus-ring w-full rounded-2xl border border-subtle bg-brand-surface/80 p-4 text-sm shadow-inner"
                      {...signUpForm.register('confirmPassword')}
                      autoComplete="new-password"
                      disabled={isSubmitBlocked}
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
                      disabled={isSubmitBlocked}
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
              {notice && <p className="rounded-xl bg-brand-secondary/10 p-3 text-sm text-brand-secondary">{notice}</p>}
              {signUpStatus === 'success' && (
                <p className="rounded-xl bg-brand-secondary/10 p-3 text-sm text-brand-secondary">
                  {t('settings.profileSaved', 'Profil mis a jour')}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={mode === 'signin' ? signInLoading : signUpStatus === 'submitting' || signUpStatus === 'awaiting-verification'}
                disabled={signUpStatus === 'awaiting-verification'}
              >
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
