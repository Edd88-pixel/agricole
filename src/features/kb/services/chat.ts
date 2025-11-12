import { invokeEdgeFunction } from '@/services/supabase/functions';
import { appConfig } from '@/services/config';
import { uploadDiagnosisImages } from '@/services/supabase/storage';

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
  files: File[];
};

export const sendKnowledgeMessage = async ({ prompt, history, files }: KnowledgeRequest): Promise<KnowledgeResponse> => {
  if (!appConfig.supabase.functions.knowledgeChat) {
    throw new Error('Knowledge chat function is not configured.');
  }

  let uploadedPaths: string[] = [];
  if (files.length > 0) {
    uploadedPaths = await uploadDiagnosisImages(files);
  }

  const response = await invokeEdgeFunction<KnowledgeResponse>(appConfig.supabase.functions.knowledgeChat, {
    body: {
      // principal schema (notre fonction)
      prompt,
      history,
      imagePaths: uploadedPaths,
      // schémas alternatifs pour compatibilité avec d'autres fonctions
      query: prompt,
      message: prompt,
      messages: history,
      images: uploadedPaths
    }
  });

  return response;
};
