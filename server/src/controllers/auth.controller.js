// server/src/controllers/auth.controller.js — Auth route handlers
import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../middleware/auth.middleware.js';
import * as res from '../utils/apiResponse.js';

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
};

export const login = asyncHandler(async (req, expressRes) => {
  const { username, password } = req.validatedBody;
  const ip = req.ip;

  const { user, accessToken, refreshToken } = await authService.login(username, password, ip);

  expressRes.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);

  return res.success(expressRes, { user, accessToken }, 'Login successful');
});

export const refresh = asyncHandler(async (req, expressRes) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return expressRes.status(401).json({ success: false, message: 'No refresh token', code: 'UNAUTHORIZED' });
  }

  const { accessToken, refreshToken: newRefresh } = await authService.refreshAccessToken(refreshToken);
  expressRes.cookie('refreshToken', newRefresh, REFRESH_COOKIE_OPTS);

  return res.success(expressRes, { accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req, expressRes) => {
  const refreshToken = req.cookies?.refreshToken;
  await authService.logout(refreshToken, req.user?.userId, req.ip);

  expressRes.clearCookie('refreshToken', { path: '/api/v1/auth' });
  return res.success(expressRes, null, 'Logged out successfully');
});

export const me = asyncHandler(async (req, expressRes) => {
  const user = await authService.getMe(req.user.userId);
  return res.success(expressRes, user, 'Profile fetched');
});

export const changePassword = asyncHandler(async (req, expressRes) => {
  const { currentPassword, newPassword } = req.validatedBody;
  await authService.changePassword(req.user.userId, currentPassword, newPassword);
  return res.success(expressRes, null, 'Password changed successfully. Please log in again.');
});
