import { Router } from 'express';
import multer from 'multer';
import {
  createDiagnosisSignedUrls,
  createKnowledgeSignedUrls,
  createProfileSignedUrl,
  removeDiagnosisImages,
  removeProfileAvatar,
  uploadDiagnosisImages,
  uploadKnowledgeAttachments,
  uploadProfileAvatar
} from '../controllers/storageController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.post('/diagnosis/upload', upload.array('files'), uploadDiagnosisImages);
router.post('/diagnosis/sign', createDiagnosisSignedUrls);
router.delete('/diagnosis', removeDiagnosisImages);

router.post('/knowledge/upload', upload.array('files'), uploadKnowledgeAttachments);
router.post('/knowledge/sign', createKnowledgeSignedUrls);

router.post('/profile/avatar', upload.array('files'), uploadProfileAvatar);
router.post('/profile/sign', createProfileSignedUrl);
router.delete('/profile/avatar', removeProfileAvatar);

export default router;
