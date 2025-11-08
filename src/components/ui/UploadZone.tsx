import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE_MB = 10;
const MAX_FILES = 5;

type UploadZoneProps = {
  files: File[];
  onChange: (files: File[]) => void;
};

const UploadZone = ({ files, onChange }: UploadZoneProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t('diagnosis.uploadHint'));
      return false;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`${file.name} > ${MAX_SIZE_MB}MB`);
      return false;
    }
    return true;
  }, [t]);

  const handleFiles = useCallback((selected: FileList | null) => {
    if (!selected) return;
    const acceptedFiles: File[] = [];
    Array.from(selected).every((file) => {
      const isValid = validateFile(file);
      if (isValid) {
        acceptedFiles.push(file);
      }
      return acceptedFiles.length < MAX_FILES;
    });
    const merged = [...files, ...acceptedFiles].slice(0, MAX_FILES);
    onChange(merged);
    if (acceptedFiles.length > 0) {
      setError(null);
    }
  }, [files, onChange, validateFile]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="focus-ring flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-brand-secondary/60 bg-white/80 px-6 py-10 text-center text-brand-text shadow-card backdrop-blur transition-colors hover:border-brand-secondary"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
      >
        <span className="text-4xl" aria-hidden>
          📷
        </span>
        <p className="mt-3 text-base font-semibold">{t('diagnosis.uploadTitle')}</p>
        <p className="mt-1 text-sm text-brand-muted">{t('diagnosis.uploadHint')}</p>
        <p className="mt-2 text-xs text-brand-muted">{t('diagnosis.qualityCheck')}</p>
      </button>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        aria-label={t('diagnosis.uploadTitle') ?? 'Upload'}
        onChange={(event) => handleFiles(event.target.files)}
      />
      {files.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Selected files">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex items-center justify-between rounded-2xl border border-brand-secondary/20 bg-white/70 px-4 py-3 shadow-sm"
            >
              <span className="truncate text-sm font-medium text-brand-text">{file.name}</span>
              <button
                type="button"
                className="focus-ring rounded-full border border-brand-secondary/20 px-3 py-1 text-xs text-brand-muted hover:text-brand-danger"
                onClick={() => onChange(files.filter((item) => item !== file))}
              >
                {t('diagnosis.remove')}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-brand-danger">{error}</p>}
      <p className="text-xs text-brand-muted">{t('diagnosis.photoCount', { count: files.length, max: MAX_FILES })}</p>
    </div>
  );
};

export default UploadZone;
