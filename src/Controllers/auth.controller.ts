import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../Models/User';
import logger from '../Utils/logger';
import { sendVerificationEmail, sendPasswordResetEmail } from '../Services/mail.service';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallback_refresh_secret';

const generateTokens = (user: any) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user = new User({ firstName, lastName, email, password, verificationToken });
    await user.save();

    await sendVerificationEmail(email, verificationToken, firstName);

    res.status(201).json({ 
      message: 'User registered successfully. Please check your email to verify your account.' 
    });
  } catch (err: any) {
    logger.error(`Register Error: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query;
  try {

    const userDoc = await User.findOne({ verificationToken: token as string });
    if (!userDoc) {
      res.status(400).json({ message: 'Invalid or expired verification token' });
      return;
    }

    (userDoc as any).isVerified = true;
    (userDoc as any).verificationToken = undefined;
    await userDoc.save();

    res.status(200).json({ message: 'Email verified successfully. You can now login.' });
  } catch (err: any) {
    logger.error(`Email Verification Error: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const userDoc = await User.findOne({ email });
    if (!userDoc) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    if (!(userDoc as any).isVerified) {
      res.status(401).json({ message: 'Please verify your email before logging in.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, userDoc.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(userDoc);
    (userDoc as any).refreshToken = refreshToken;
    await userDoc.save();

    res.json({ 
      accessToken, 
      refreshToken, 
      user: { id: userDoc.id, firstName: userDoc.firstName, lastName: userDoc.lastName, email, role: userDoc.role } 
    });
  } catch (err: any) {
    logger.error(`Login Error: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ message: 'Refresh token is required' });
    return;
  }

  try {
    const userDoc = await User.findOne({ refreshToken: token });
    if (!userDoc) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    jwt.verify(token, REFRESH_SECRET);
    const { accessToken, refreshToken } = generateTokens(userDoc);
    (userDoc as any).refreshToken = refreshToken;
    await userDoc.save();

    res.json({ accessToken, refreshToken });
  } catch (err: any) {
    logger.error(`Refresh Token Error: ${err.message}`);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ valid: false, message: 'No token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err: any) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  try {
    const userDoc = await User.findOne({ email });
    if (!userDoc) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    (userDoc as any).resetPasswordToken = resetToken;
    (userDoc as any).resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await userDoc.save();

    await sendPasswordResetEmail(email, resetToken, userDoc.firstName);

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (err: any) {
    logger.error(`Forgot Password Error: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;
  try {
    const userDoc = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!userDoc) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    userDoc.password = newPassword;
    (userDoc as any).resetPasswordToken = undefined;
    (userDoc as any).resetPasswordExpires = undefined;
    await userDoc.save();

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (err: any) {
    logger.error(`Reset Password Error: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};
