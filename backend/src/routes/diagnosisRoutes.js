import { Router } from 'express';
import {
  createDiagnosis,
  deleteDiagnosis,
  listDiagnoses,
  submitFeedback,
  updateDiagnosisDetails,
  updateDiagnosisResolved
} from '../controllers/diagnosisController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', listDiagnoses);
router.post('/', createDiagnosis);
router.patch('/:id/resolved', updateDiagnosisResolved);
router.patch('/:id', updateDiagnosisDetails);
router.delete('/:id', deleteDiagnosis);
router.post('/:id/feedback', submitFeedback);

export default router;
