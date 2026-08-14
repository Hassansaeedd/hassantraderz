// server/src/routes/auth.routes.js
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/login',           validate(loginSchema),          authController.login);
router.post('/refresh',                                         authController.refresh);
router.post('/logout',          authMiddleware,                 authController.logout);
router.get('/me',               authMiddleware,                 authController.me);
router.put('/change-password',  authMiddleware, validate(changePasswordSchema), authController.changePassword);

export default router;
