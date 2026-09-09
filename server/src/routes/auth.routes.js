// server/src/routes/auth.routes.js
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator.js';

const router = Router();

const superAdminOnly = (req, res, next) => {
  const isSuper = req.user?.username === 'Hassan@009' || req.user?.role === 'SUPERADMIN';
  if (!isSuper) {
    return res.status(403).json({ success: false, message: 'Public registration is closed. Please contact Super Admin to create your shop account.' });
  }
  next();
};

router.post('/login',           validate(loginSchema),          authController.login);
router.post('/register',        authMiddleware, superAdminOnly, authController.register);
router.post('/refresh',                                         authController.refresh);
router.post('/logout',          authMiddleware,                 authController.logout);
router.get('/me',               authMiddleware,                 authController.me);
router.put('/change-password',  authMiddleware, validate(changePasswordSchema), authController.changePassword);

export default router;
