import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/services/supabase/client';

type KnowledgeEventType = 'start' | 'chunk' | 'end' | 'error';

export type KnowledgeEvent = {
  event: KnowledgeEventType;
  content?: string | null;
  links?: { title?: string; url: string }[] | null;
  error?: string | null;
};

type Handlers = {
  onReady?: () => void;
  onEvent?: (event: KnowledgeEvent) => void;
  onError?: (message: string) => void;
};

const SUBSCRIPTION_TIMEOUT_MS = 20000;

export const subscribeToKnowledgeEvents = (
  conversationId: string,
  handlers: Handlers
): (() => void) => {
  const client = getSupabaseClient();
  if (!client) {
    handlers.onError?.('Realtime is not configured.');
    return () => {};
  }

  const channelName = `kb-events-${conversationId}`;
  const channel: RealtimeChannel = client.channel(channelName, {
    config: {
      realtime: { eventsPerSecond: 5 }
    }
  });

  let timeout = window.setTimeout(() => {
    handlers.onError?.('Realtime connection timed out.');
  }, SUBSCRIPTION_TIMEOUT_MS);

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'kb_events',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      const record = payload.new as KnowledgeEvent | null;
      if (!record) return;

      handlers.onEvent?.({
        event: record.event,
        content: record.content ?? null,
        error: record.error ?? null,
        links: record.links ?? null
      });
    }
  );

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      handlers.onReady?.();
    }

    if (status === 'CHANNEL_ERROR') {
      handlers.onError?.('Realtime channel error.');
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
    }
  });

  return () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    client.removeChannel(channel);
  };
};
