import { supabaseClient } from '@/services/supabaseClient';

export type KnowledgeEventPayload = {
  id?: string;
  conversation_id: string;
  message_id: string;
  event: 'start' | 'chunk' | 'end' | 'error';
  content?: string | null;
  error?: string | null;
  links?: { title?: string; url: string }[] | null;
  created_at?: string | null;
};

type KnowledgeEventHandler = (event: KnowledgeEventPayload) => void;

type SubscribeOptions = {
  conversationId: string;
  onEvent: KnowledgeEventHandler;
  onError?: (message: string) => void;
};

const buildEventKey = (event: KnowledgeEventPayload) => {
  if (event.id) return String(event.id);
  if (event.created_at) return `${event.event}-${event.created_at}`;
  return `${event.event}-${event.message_id}`;
};

export const subscribeToKnowledgeEvents = ({ conversationId, onEvent, onError }: SubscribeOptions) => {
  if (!supabaseClient) {
    throw new Error('Supabase realtime client is not configured.');
  }

  const seen = new Set<string>();

  const pushEvent = (event: KnowledgeEventPayload) => {
    const key = buildEventKey(event);
    if (seen.has(key)) return;
    seen.add(key);
    onEvent(event);
  };

  const replayExisting = async () => {
    const { data, error } = await supabaseClient
      .from('kb_events')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Failed to replay knowledge events', error);
      onError?.('Impossible de recuperer les evenements precedents.');
      return;
    }

    (data ?? []).forEach((row) => pushEvent(row as KnowledgeEventPayload));
  };

  const channel = supabaseClient
    .channel(`kb-chat-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'kb_events',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => pushEvent(payload.new as KnowledgeEventPayload)
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void replayExisting();
        return;
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.('Connexion temps reel interrompue.');
      }
    });

  return () => {
    supabaseClient.removeChannel(channel);
  };
};

