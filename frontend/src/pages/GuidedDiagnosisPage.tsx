import GuidedScanForm from '@/features/diagnosis/components/GuidedScanForm';
import type { DiagnosisResult } from '@/features/diagnosis/types/diagnosis';

type GuidedDiagnosisPageProps = {
  onResult: (result: DiagnosisResult) => Promise<void>;
};

const GuidedDiagnosisPage = ({ onResult }: GuidedDiagnosisPageProps) => {
  return <GuidedScanForm onResult={onResult} />;
};

export default GuidedDiagnosisPage;
