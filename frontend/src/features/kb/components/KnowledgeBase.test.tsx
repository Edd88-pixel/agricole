import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { setSupabaseClient } from '@/services/supabaseClient';
import KnowledgeBase from './KnowledgeBase';
import { sendKnowledgeMessage } from '../services/chat';

vi.mock('../services/chat');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_: string, fallback?: string) => fallback ?? ''
  })
}));

const createMockChannel = () => {
  const callbacks: Array<(payload: unknown) => void> = [];
  const channel = {
    callbacks,
    on: vi.fn((_event, _filter, cb) => {
      callbacks.push(cb);
      return channel;
    }),
    subscribe: vi.fn((cb?: (status: string) => void) => {
      cb?.('SUBSCRIBED');
      return { data: {} } as const;
    }),
    unsubscribe: vi.fn()
  };

  return channel;
};

describe('KnowledgeBase realtime chat', () => {
  let mockChannel: ReturnType<typeof createMockChannel>;

  beforeEach(() => {
    vi.resetAllMocks();
    mockChannel = createMockChannel();
    setSupabaseClient({
      channel: vi.fn(() => mockChannel),
      removeChannel: vi.fn()
    } as unknown as any);
    (sendKnowledgeMessage as unknown as Mock).mockResolvedValue({
      status: 'queued',
      conversationId: 'conv-1',
      messageId: 'msg-1'
    });
  });

  const triggerRealtimeEvent = (payload: unknown) => {
    const handler = mockChannel.callbacks[0];
    if (handler) {
      act(() => handler(payload));
    }
  };

  it('streams assistant chunks into the UI as they arrive', async () => {
    const user = userEvent.setup();
    render(<KnowledgeBase articles={[]} />);

    await user.type(screen.getByPlaceholderText(/Posez une question/i), 'Bonjour');
    await user.click(screen.getByRole('button', { name: /Envoyer/i }));

    expect(sendKnowledgeMessage).toHaveBeenCalled();

    triggerRealtimeEvent({ new: { conversation_id: 'conv-1', message_id: 'msg-1', event: 'start' } });
    triggerRealtimeEvent({
      new: { conversation_id: 'conv-1', message_id: 'msg-1', event: 'chunk', content: 'Hello' }
    });

    await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument());

    triggerRealtimeEvent({
      new: { conversation_id: 'conv-1', message_id: 'msg-1', event: 'end', content: 'Hello world' }
    });

    await waitFor(() => expect(screen.getByText('Hello world')).toBeInTheDocument());
  });

  it('surfaces backend errors in the UI when streaming fails', async () => {
    const user = userEvent.setup();
    render(<KnowledgeBase articles={[]} />);

    await user.type(screen.getByPlaceholderText(/Posez une question/i), 'Bonjour');
    await user.click(screen.getByRole('button', { name: /Envoyer/i }));

    triggerRealtimeEvent({ new: { conversation_id: 'conv-1', message_id: 'msg-1', event: 'start' } });
    triggerRealtimeEvent({
      new: {
        conversation_id: 'conv-1',
        message_id: 'msg-1',
        event: 'error',
        error: 'Edge function unreachable',
        content: 'Desole, une erreur est survenue'
      }
    });

    await waitFor(() =>
      expect(screen.getByText('Desole, une erreur est survenue')).toBeInTheDocument()
    );
    expect(screen.getByText('Edge function unreachable')).toBeInTheDocument();
  });
});
