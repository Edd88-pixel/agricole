import { invokeKnowledgeChat } from '@/services/api/functions';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type KnowledgeQueuedResponse = {
  status: 'queued';
  conversationId: string;
  messageId: string;
};

type KnowledgeRequest = {
  prompt: string;
  history: ChatMessage[];
  files?: File[];
  conversationId?: string;
};

export const sendKnowledgeMessage = async ({
  prompt,
  history,
  files = [],
  conversationId
}: KnowledgeRequest): Promise<KnowledgeQueuedResponse> => {
  const response = await invokeKnowledgeChat<KnowledgeQueuedResponse>({ prompt, history, files, conversationId });
  return response;
};
