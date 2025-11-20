import { Router } from 'express';
import { getCurrentUser, signIn, signOut, signUp } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/sign-in', signIn);
router.post('/sign-up', signUp);
router.post('/sign-out', signOut);
router.get('/me', requireAuth, getCurrentUser);

export default router;
