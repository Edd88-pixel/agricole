import { Router } from 'express';
import { listKnowledgeArticles } from '../controllers/knowledgeController.js';

const router = Router();

router.get('/', listKnowledgeArticles);

export default router;
