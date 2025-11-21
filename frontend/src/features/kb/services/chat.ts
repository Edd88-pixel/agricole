import { invokeKnowledgeChat } from '@/services/api/functions';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type KnowledgeResponse = {
  id: string;
  createdAt: string;
  message: string;
  images: string[];
  links?: { title?: string; url: string }[];
};

type KnowledgeRequest = {
  prompt: string;
  history: ChatMessage[];
  files?: File[];
};

export const sendKnowledgeMessage = async ({
  prompt,
  history,
  files = []
}: KnowledgeRequest): Promise<KnowledgeResponse> => {
  const response = await invokeKnowledgeChat<KnowledgeResponse>({ prompt, history, files });
  return response;
};
