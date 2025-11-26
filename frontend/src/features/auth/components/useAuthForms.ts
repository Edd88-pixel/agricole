import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

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

export type AuthMode = 'signin' | 'signup';
export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

export const useAuthForms = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

  const cleanupAvatarPreview = useCallback(() => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
  }, [avatarPreview]);

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

  useEffect(() => cleanupAvatarPreview, [cleanupAvatarPreview]);

  const emailRegister = useMemo(
    () => (mode === 'signin' ? signInForm.register('email') : signUpForm.register('email')),
    [mode, signInForm, signUpForm]
  );

  const passwordRegister = useMemo(
    () => (mode === 'signin' ? signInForm.register('password') : signUpForm.register('password')),
    [mode, signInForm, signUpForm]
  );

  const emailError = mode === 'signin' ? signInForm.formState.errors.email : signUpForm.formState.errors.email;
  const passwordError = mode === 'signin' ? signInForm.formState.errors.password : signUpForm.formState.errors.password;

  return {
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
  };
};
