import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/services/supabaseClient';

export type KnowledgeRealtimeEvent = {
  conversation_id: string;
  message_id: string;
  event: 'start' | 'chunk' | 'end' | 'error';
  content?: string | null;
  error?: string | null;
  links?: { title?: string; url: string }[] | null;
  progress?: number | null;
};

export type KnowledgeRealtimeSubscription = {
  unsubscribe: () => void;
};

export const subscribeToKnowledgeEvents = ({
  conversationId,
  onEvent
}: {
  conversationId: string;
  onEvent: (event: KnowledgeRealtimeEvent) => void;
}): KnowledgeRealtimeSubscription => {
  const client = getSupabaseClient();
  const channel = client.channel(`kb_events:${conversationId}`);

  const handler = (payload: RealtimePostgresInsertPayload<KnowledgeRealtimeEvent>) => {
    if (!payload?.new) return;
    onEvent(payload.new);
  };

  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'kb_events', filter: `conversation_id=eq.${conversationId}` },
    handler
  );

  channel.subscribe((status) => {
    if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      channel.unsubscribe();
    }
  });

  return {
    unsubscribe: () => {
      channel.unsubscribe();
      try {
        getSupabaseClient().removeChannel(channel);
      } catch {
        // No-op: mostly relevant for test environments where Supabase is mocked or unset.
      }
    }
  };
};
