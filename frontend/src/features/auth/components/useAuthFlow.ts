import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type TFunction, type i18n as I18nInstance } from 'i18next';
import { type UseFormReturn } from 'react-hook-form';
import { signIn, signUp } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';
import { createProfile, fetchProfile, updateProfile } from '@/services/api/profile';
import { uploadProfileAvatar } from '@/services/api/storage';
import { buildDisplayName, normalizeLocale } from './authHelpers';
import { type AuthMode, type SignInValues, type SignUpValues } from './useAuthForms';

export type SignUpStatus = 'idle' | 'submitting' | 'awaiting-verification' | 'success';

type UseAuthFlowParams = {
  signInForm: UseFormReturn<SignInValues>;
  signUpForm: UseFormReturn<SignUpValues>;
  t: TFunction;
  i18n: I18nInstance;
  setMode: (mode: AuthMode) => void;
  cleanupAvatarPreview: () => void;
};

export const useAuthFlow = ({
  signInForm,
  signUpForm,
  t,
  i18n,
  setMode,
  cleanupAvatarPreview
}: UseAuthFlowParams) => {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signUpStatus, setSignUpStatus] = useState<SignUpStatus>('idle');
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verificationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const extractError = (err: unknown) => {
    if (err instanceof ApiError) {
      const detail =
        typeof err.details === 'string'
          ? err.details
          : typeof (err.details as { message?: string })?.message === 'string'
            ? (err.details as { message: string }).message
            : typeof (err.details as { error?: string })?.error === 'string'
              ? (err.details as { error: string }).error
              : null;
      return { status: err.status, message: detail ?? err.message };
    }
    if (err instanceof Error) return { status: undefined, message: err.message };
    return { status: undefined, message: null };
  };

  const mapAuthError = (context: 'signin' | 'signup', err: unknown) => {
    const { status, message } = extractError(err);
    const normalized = (message || '').toLowerCase();

    if (status === 401 || status === 403 || normalized.includes('invalid login') || normalized.includes('invalid credentials')) {
      return t('auth.invalidCredentials', 'Identifiants invalides ou email non verifie.');
    }

    if (context === 'signup' && (status === 409 || normalized.includes('already') || normalized.includes('dup'))) {
      return t('auth.emailExists', 'Un compte existe deja avec cet email.');
    }

    if (status === 400 && normalized.includes('valid email')) {
      return t('auth.invalidEmail', 'Email ou mot de passe invalide.');
    }

    if (status === undefined && normalized.includes('network')) {
      return t('auth.networkError', 'Reseau indisponible. Reessayez dans un instant.');
    }

    if (normalized.includes('timeout')) {
      return t('auth.timeout', 'Le serveur met trop de temps a repondre. Merci de reessayer.');
    }

    return t('auth.genericError', 'Une erreur est survenue. Merci de reessayer.');
  };

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

  useEffect(
    () => () => {
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
      clearVerificationInterval();
    },
    [clearVerificationInterval]
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
    } catch (err) {
      console.error('Sign-in failed', err);
      setError(mapAuthError('signin', err));
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
    [i18n.language, resetForms, setMode, showNotice, t]
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
    } catch (err) {
      console.error('Sign-up failed', err);
      setError(mapAuthError('signup', err));
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
      } catch (pollError) {
        console.debug('Waiting for email verification...', pollError);
        // Keep polling until the user confirms their email.
      }
    };

    clearVerificationInterval();
    verificationIntervalRef.current = setInterval(pollForVerification, 5000);
    await pollForVerification();
  });

  const isSubmitBlocked = useMemo(
    () => signInLoading || signUpStatus === 'submitting' || signUpStatus === 'awaiting-verification',
    [signInLoading, signUpStatus]
  );

  return { error, notice, signInLoading, signUpStatus, isSubmitBlocked, handleSignIn, onSubmitSignUp };
};
