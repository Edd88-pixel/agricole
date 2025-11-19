import { describe, expect, it, vi, beforeEach } from 'vitest';
import { submitDiagnosisFeedback } from './feedback';
import { supabase } from './client';

type Mock = ReturnType<typeof vi.fn>;

vi.mock('./client', () => {
  const insert = vi.fn();
  const from = vi.fn(() => ({ insert }));
  return {
    supabase: {
      from,
      auth: { getUser: vi.fn() },
      storage: { from: vi.fn() }
    }
  };
});

const mockSupabase = supabase as unknown as {
  from: Mock;
};

describe('submitDiagnosisFeedback', () => {
  beforeEach(() => {
    mockSupabase.from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });
  });

  it('persists feedback payload', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({ insert: insertMock });

    await submitDiagnosisFeedback({ diagnosisId: 'abc', useful: true });

    expect(insertMock).toHaveBeenCalledWith({ diagnosis_id: 'abc', useful: true, comment: null });
  });

  it('throws when Supabase returns an error', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: { message: 'fail' } });
    mockSupabase.from.mockReturnValue({ insert: insertMock });

    await expect(submitDiagnosisFeedback({ diagnosisId: 'abc', useful: false })).rejects.toThrow('fail');
  });
});
