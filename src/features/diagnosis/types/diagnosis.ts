type DiagnosisStatus = 'healthy' | 'stressed' | 'sick' | 'pending';

export type DiagnosisResult = {
  id: string;
  crop: string;
  stage: string;
  symptoms: string[];
  context: string;
  createdAt: string;
  status: DiagnosisStatus;
  confidence: number;
  primary: DiagnosisClass;
  alternatives: DiagnosisClass[];
  actions: string[];
  images: string[];
  imagePaths?: string[];
};

export type DiagnosisClass = {
  label: string;
  confidence: number;
  status: 'healthy' | 'stressed' | 'sick';
  description: string;
};

