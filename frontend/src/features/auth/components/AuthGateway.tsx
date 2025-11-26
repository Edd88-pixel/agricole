import { useTranslation } from 'react-i18next';
import { useTheme } from '@/app/providers/ThemeProvider';
import AuthHero from './AuthHero';
import AuthHeader from './AuthHeader';
import AuthForm from './AuthForm';
import { useAuthFlow } from './useAuthFlow';
import { useAuthForms } from './useAuthForms';

const AuthGateway = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const {
    mode,
    setMode,
    signInForm,
    signUpForm,
    avatarPreview,
    cleanupAvatarPreview,
    handleAvatarFilesChange,
    handleAvatarClear,
    emailRegister,
    passwordRegister,
    emailError,
    passwordError
  } = useAuthForms();

  const { error, notice, signInLoading, signUpStatus, isSubmitBlocked, handleSignIn, onSubmitSignUp } = useAuthFlow({
    signInForm,
    signUpForm,
    t,
    i18n,
    setMode,
    cleanupAvatarPreview
  });

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
        <AuthForm
          mode={mode}
          t={t}
          signUpForm={signUpForm}
          avatarPreview={avatarPreview}
          isSubmitBlocked={isSubmitBlocked}
          signInLoading={signInLoading}
          signUpStatus={signUpStatus}
          emailRegister={emailRegister}
          passwordRegister={passwordRegister}
          emailError={emailError}
          passwordError={passwordError}
          error={error}
          notice={notice}
          handleSignIn={handleSignIn}
          onSubmitSignUp={onSubmitSignUp}
          handleAvatarFilesChange={handleAvatarFilesChange}
          handleAvatarClear={handleAvatarClear}
          setMode={setMode}
        />
      </div>
    </div>
  );
};

export default AuthGateway;
