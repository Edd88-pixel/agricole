import { Router } from 'express';
import authRoutes from './authRoutes.js';
import diagnosisRoutes from './diagnosisRoutes.js';
import functionRoutes from './functionRoutes.js';
import healthRoutes from './healthRoutes.js';
import knowledgeRoutes from './knowledgeRoutes.js';
import profileRoutes from './profileRoutes.js';
import storageRoutes from './storageRoutes.js';

const router = Router();

router.use('/api/health', healthRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/diagnoses', diagnosisRoutes);
router.use('/api/knowledge', knowledgeRoutes);
router.use('/api/profile', profileRoutes);
router.use('/api/storage', storageRoutes);
router.use('/api/functions', functionRoutes);

export default router;
