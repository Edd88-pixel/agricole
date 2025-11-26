import { type TFunction } from 'i18next';
import { type FieldError, type UseFormReturn } from 'react-hook-form';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import AvatarPicker from './AvatarPicker';
import { type AuthMode, type SignInValues, type SignUpValues } from './useAuthForms';
import { type SignUpStatus } from './useAuthFlow';

type AuthFormProps = {
  mode: AuthMode;
  t: TFunction;
  signUpForm: UseFormReturn<SignUpValues>;
  avatarPreview: string | null;
  isSubmitBlocked: boolean;
  signInLoading: boolean;
  signUpStatus: SignUpStatus;
  emailRegister: ReturnType<UseFormReturn<SignInValues>['register']>;
  passwordRegister: ReturnType<UseFormReturn<SignInValues>['register']>;
  emailError: FieldError | undefined;
  passwordError: FieldError | undefined;
  error: string | null;
  notice: string | null;
  handleSignIn: ReturnType<UseFormReturn<SignInValues>['handleSubmit']>;
  onSubmitSignUp: ReturnType<UseFormReturn<SignUpValues>['handleSubmit']>;
  handleAvatarFilesChange: (files?: FileList | null) => void;
  handleAvatarClear: () => void;
  setMode: (mode: AuthMode) => void;
};

const AuthForm = ({
  mode,
  t,
  signUpForm,
  avatarPreview,
  isSubmitBlocked,
  signInLoading,
  signUpStatus,
  emailRegister,
  passwordRegister,
  emailError,
  passwordError,
  error,
  notice,
  handleSignIn,
  onSubmitSignUp,
  handleAvatarFilesChange,
  handleAvatarClear,
  setMode
}: AuthFormProps) => (
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
          <button type="button" className="text-brand-secondary underline" onClick={() => setMode('signup')}>
            {t('auth.switchToSignUp')}
          </button>
        ) : (
          <button type="button" className="text-brand-secondary underline" onClick={() => setMode('signin')}>
            {t('auth.switchToSignIn')}
          </button>
        )}
      </div>
    </div>
  </Card>
);

export default AuthForm;
