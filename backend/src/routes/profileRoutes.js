import { Router } from 'express';
import { createProfile, getProfile, saveOnboarding, updateProfile } from '../controllers/profileController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', getProfile);
router.post('/', createProfile);
router.patch('/', updateProfile);
router.post('/onboarding', saveOnboarding);

export default router;
