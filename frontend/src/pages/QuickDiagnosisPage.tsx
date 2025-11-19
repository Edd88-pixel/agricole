import QuickScanForm from '@/features/diagnosis/components/QuickScanForm';
import type { DiagnosisResult } from '@/features/diagnosis/types/diagnosis';

type QuickDiagnosisPageProps = {
  onResult: (result: DiagnosisResult) => Promise<void>;
};

const QuickDiagnosisPage = ({ onResult }: QuickDiagnosisPageProps) => {
  return <QuickScanForm onResult={onResult} />;
};

export default QuickDiagnosisPage;
