import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import UploadZone from './UploadZone';
import i18n from '@/app/i18n';
import { initI18n } from '@/app/i18n';

initI18n();

describe('UploadZone', () => {
  it('calls onChange with validated files', () => {
    const handleChange = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <UploadZone files={[]} onChange={handleChange} />
      </I18nextProvider>
    );

    const input = screen.getByLabelText(/photos/i);
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(handleChange).toHaveBeenCalled();
  });
});
