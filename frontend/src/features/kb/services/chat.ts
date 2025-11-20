import { invokeEdgeFunction } from '@/services/supabase/functions';
import { appConfig } from '@/services/config';
import { createSignedDiagnosisUrls, uploadDiagnosisImages, uploadKnowledgeAttachments, createSignedKnowledgeUrls } from '@/services/supabase/storage';

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
  uploaded?: { path: string; signedUrl?: string }[];
};

export const sendKnowledgeMessage = async ({
  prompt,
  history,
  files,
  uploaded = []
}: KnowledgeRequest): Promise<KnowledgeResponse> => {
  if (!appConfig.supabase.functions.knowledgeChat) {
    throw new Error('Knowledge chat function is not configured.');
  }

  let uploadedPaths: string[] = [];
  let signedUrls: string[] = [];
  if (uploaded.length > 0) {
    uploadedPaths = uploaded.map((item) => item.path);
    signedUrls = uploaded.map((item) => item.signedUrl).filter((url): url is string => Boolean(url));
  }
  if (files.length > 0) {
    const newPaths = await uploadKnowledgeAttachments(files);
    const newSigned = await createSignedKnowledgeUrls(newPaths);
    uploadedPaths = [...uploadedPaths, ...newPaths];
    signedUrls = [...signedUrls, ...newSigned];
  }
  const accessibleImages = signedUrls.length > 0 ? signedUrls : uploadedPaths;
  const knowledgeBucket = appConfig.supabase.storageBuckets.knowledge ?? appConfig.supabase.storageBuckets.diagnosis;

  const response = await invokeEdgeFunction<KnowledgeResponse>(appConfig.supabase.functions.knowledgeChat, {
    body: {
      // principal schema (notre fonction)
      prompt,
      history,
      imagePaths: uploadedPaths,
      signedUrls,
      bucket: knowledgeBucket,
      // schémas pour compatibilité avec d'autres fonctions
      query: prompt,
      message: prompt,
      messages: history,
      images: accessibleImages,
      signedImagePaths: signedUrls
    }
  });

  return response;
};
