import { invokeKnowledgeChat } from '@/services/api/functions';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type KnowledgeConversationResponse = {
  conversationId: string;
  messageId: string;
  status: 'queued' | 'streaming';
};

type KnowledgeRequest = {
  prompt: string;
  history: ChatMessage[];
  files?: File[];
};

export const startKnowledgeConversation = async ({
  prompt,
  history,
  files = []
}: KnowledgeRequest): Promise<KnowledgeConversationResponse> => {
  const response = await invokeKnowledgeChat<KnowledgeConversationResponse>({ prompt, history, files });
  return response;
};
