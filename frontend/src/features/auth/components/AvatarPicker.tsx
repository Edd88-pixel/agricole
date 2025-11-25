import { useRef } from 'react';
import Button from '@/components/ui/Button';

type AvatarPickerProps = {
  label: string;
  selectLabel: string;
  removeLabel: string;
  preview: string | null;
  disabled?: boolean;
  onChange: (files?: FileList | null) => void;
  onClear: () => void;
};

const AvatarPicker = ({ label, selectLabel, removeLabel, preview, disabled, onChange, onClear }: AvatarPickerProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-brand-text">{label}</span>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full border border-subtle bg-brand-background">
          {preview ? (
            <img src={preview} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand-muted">?</div>
          )}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              title={selectLabel}
              onChange={(event) => onChange(event.target.files ?? undefined)}
              disabled={disabled}
            />
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={disabled}>
              {selectLabel}
            </Button>
          </div>
          <button
            type="button"
            className="text-left text-sm text-brand-muted underline"
            onClick={onClear}
            disabled={disabled}
          >
            {removeLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarPicker;
