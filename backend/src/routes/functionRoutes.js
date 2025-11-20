import { Router } from 'express';
import multer from 'multer';
import { runDiagnosisInference, runKnowledgeChat } from '../controllers/functionsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);
router.post('/diagnosis', upload.array('files'), runDiagnosisInference);
router.post('/knowledge', upload.array('files'), runKnowledgeChat);

export default router;
