import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginRules, signupRules } from '../validators/auth.validator.js';

const router = Router();

router.post('/signup', authLimiter, validate(signupRules), authController.signup);
router.post('/login', authLimiter, validate(loginRules), authController.login);
router.post('/refresh', authController.refresh); // uses the refresh_token cookie
router.post('/logout', authController.logout); // uses the refresh_token cookie
router.get('/me', authenticate, authController.getMe);

export default router;
