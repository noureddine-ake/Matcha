import { getUserAttr, createUser, updateUser } from '../models/userModel.js';
import { createOTP, getUserOTP } from '../models/otpModals.js';
import bcrypt from 'bcryptjs';
import JWT from '../middlewares/authMiddleware.js';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import redisClient from "../config/redisClient.js";

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
};

export const registrationControler = async (req, res) => {
  try {
    const existingUserEmail = await getUserAttr('email', req.body.email);
    if (existingUserEmail.rowCount) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const existingUsername = await getUserAttr('username', req.body.username);
    if (existingUsername.rowCount) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    const newUser = {
      email: req.body.email,
      username: req.body.username,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      password_hash: hashedPassword,
    };
    
    const user = await createUser(newUser);
    
    // Create access token (15 minutes)
    const token = JWT.createJWToken({
      sessionData: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_verified: false,
        completed_profile: user.completed_profile,
      },
      maxAge: '15m',
    });

    // Create refresh token (7 days)
    const refreshToken = JWT.createRefreshToken({
      sessionData: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_verified: false,
        completed_profile: user.completed_profile,
      },
    });

    // Set both cookies
    res.cookie('token', token, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send verification email
    const code = Math.floor(100000 + Math.random() * 900000);
    const now = new Date(Date.now() + 5 * 60 * 1000);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: user.email,
      subject: 'Verify your email',
      text: `Matcha : verification code ${code}`,
    });

    await createOTP({
      user_id: user.id,
      verification_code: code,
      expires_at: now,
    });

    res.status(200).json({ 
      message: 'User registered successfully', 
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        is_verified: false
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginController = async (req, res) => {
  console.log('Login request body:', req.body); // Debug log
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await getUserAttr('username', username);
    
    if (!existingUser.rowCount) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const user = existingUser.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Create access token (15 minutes)
    const token = JWT.createJWToken({
      sessionData: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_verified: user.is_verified,
        completed_profile: user.completed_profile,
      },
      maxAge: '15m',
    });

    // Create refresh token (7 days)
    const refreshToken = JWT.createRefreshToken({
      sessionData: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_verified: user.is_verified,
        completed_profile: user.completed_profile,
      },
    });

    // Set both cookies
    res.cookie('token', token, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        is_verified: user.is_verified,
        completed_profile: user.completed_profile,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyEmailControler = async (req, res) => {
  try {
    const user = req.user.data;
    const otpRecords = await getUserOTP(user.id);
    
    if (!otpRecords.length || req.body.code != otpRecords[0].verification_code) {
      return res.status(403).json({ error: 'Invalid OTP' });
    }

    const fields = { is_verified: true };
    await updateUser(user.id, fields);
    user.is_verified = true;

    // Create new tokens with updated verification status
    const token = JWT.createJWToken({ 
      sessionData: user, 
      maxAge: '15m' 
    });

    const refreshToken = JWT.createRefreshToken({ 
      sessionData: user 
    });

    // Update both cookies
    res.cookie('token', token, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ 
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        is_verified: true
      }
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resendCode = async (req, res) => {
  try {
    const user = req.user.data;
    
    // Generate new OTP
    const code = Math.floor(100000 + Math.random() * 900000);
    const now = new Date(Date.now() + 5 * 60 * 1000);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: user.email,
      subject: 'Verify your email',
      text: `Matcha : verification code ${code}`,
    });

    await createOTP({
      user_id: user.id,
      verification_code: code,
      expires_at: now,
    });

    res.status(200).json({ message: 'Verification code resent successfully' });
  } catch (err) {
    console.error('Resend code error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userResult = await getUserAttr('email', email);
    if (!userResult.rowCount) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const token = randomBytes(32).toString('hex');

    // Store token in Redis with expiry (1 hour = 3600 seconds)
    await redisClient.setEx(`reset:${user.id}`, 3600, token);

    // Send email
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${FRONTEND_URL}/auth/confirm?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { 
        user: process.env.MAIL_USER, 
        pass: process.env.MAIL_PASS 
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: user.email,
      subject: 'Password Reset',
      text: `Click this link to reset your password: ${resetLink}`,
    });

    res.status(200).json({ message: 'Reset link sent to your email' });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const confirmPasswordReset = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Missing token or new password" });
    }

    // Find which user has this token
    const keys = await redisClient.keys("reset:*");
    let userId = null;

    for (const key of keys) {
      const value = await redisClient.get(key);
      if (value === token) {
        userId = key.split(":")[1];
        break;
      }
    }

    if (!userId) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUser(userId, { password_hash: hashedPassword });

    // Delete token from Redis (used once)
    await redisClient.del(`reset:${userId}`);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error in confirmPasswordReset:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const refreshTokenController = async (req, res) => {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies?.refreshToken;
    
    
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    // Verify refresh token
    const userData = JWT.verifyRefreshToken(refreshToken);
    if (!userData) {
      // Clear invalid tokens
      res.clearCookie('token', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Create new access token
    const newAccessToken = JWT.createJWToken({
      sessionData: userData.data,
      maxAge: '15m',
    });

    // Create new refresh token (token rotation for security)
    const newRefreshToken = JWT.createRefreshToken({
      sessionData: userData.data,
    });

    // Set both new cookies
    res.cookie('token', newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({ 
      message: 'Token refreshed successfully',
      user: userData.data,
    });
  } catch (err) {
    console.error('Error in refreshTokenController:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logoutController = async (req, res) => {
  try {
    // Clear both cookies
    res.clearCookie('token', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user.data;
    
    // Get fresh user data from database
    const userResult = await getUserAttr('id', user.id);
    if (!userResult.rowCount) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = userResult.rows[0];
    
    res.status(200).json({
      user: {
        id: currentUser.id,
        email: currentUser.email,
        username: currentUser.username,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        is_verified: currentUser.is_verified,
        completed_profile: currentUser.completed_profile,
      }
    });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};