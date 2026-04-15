import { getUserAttr, createUser, updateUser } from '../models/userModel.js';
import { getUserOTP, saveVerificationToken, getUserByVerificationToken, clearVerificationToken } from '../models/otpModals.ts';
import bcrypt from 'bcryptjs';
import JWT from '../middlewares/authMiddleware.js';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import redisClient from "../config/redisClient.js";
import { validatePasswordWithRecommendations } from '../utils/passwordValidator.js';

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
};

const getVerificationEmailContent = (username, verifyLink) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Matcha, ${username}!</h1>
    <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${verifyLink}" class="button">Verify Email</a>
    </p>
    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #8b5cf6;">${verifyLink}</p>
    <p>This link will expire in 24 hours.</p>
    <div class="footer">
      <p>If you didn't create an account, please ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

export const registrationControler = async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !username || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Validate username format
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    // Validate password strength against best practices
    const passwordValidation = validatePasswordWithRecommendations(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors 
      });
    }

    // Warn about weak patterns (non-critical)
    if (passwordValidation.warnings.length > 0) {
      console.warn(`Password warnings for ${email}:`, passwordValidation.warnings);
    }

    // Validate name length
    if (firstName.length > 50 || lastName.length > 50) {
      return res.status(400).json({ error: 'Names must be less than 50 characters' });
    }

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

    // Send verification email with secure token
    const verificationToken = randomBytes(32).toString('hex');
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${FRONTEND_URL}/auth/verify-email/verify?token=${verificationToken}`;

    await saveVerificationToken(user.id, verificationToken);

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
      subject: 'Verify your email - Matcha',
      html: getVerificationEmailContent(user.username, verifyLink),
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
    console.log('User found:', user.is_verified); // Debug log
    if (!user.is_verified) {
      return res.status(403).json({ 
        error: 'Email not verified. Please verify your email to login.',
        requiresVerification: true 
      });
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

export const verifyEmailByToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const users = await getUserByVerificationToken(token);
    
    if (!users.length) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const user = users[0];
    
    if (user.is_verified) {
      return res.status(200).json({ 
        message: 'Email already verified',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          is_verified: true
        }
      });
    }

    await updateUser(user.id, { is_verified: true });
    await clearVerificationToken(user.id);

    const tokenData = JWT.createJWToken({ 
      sessionData: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_verified: true,
        completed_profile: user.completed_profile,
      }, 
      maxAge: '15m' 
    });

    const refreshToken = JWT.createRefreshToken({ 
      sessionData: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_verified: true,
        completed_profile: user.completed_profile,
      }
    });

    res.cookie('token', tokenData, {
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
    console.error('Token verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resendCode = async (req, res) => {
  try {
    const user = req.user.data;
    
    const verificationToken = randomBytes(32).toString('hex');
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${FRONTEND_URL}/auth/verify-email/verify?token=${verificationToken}`;

    await saveVerificationToken(user.id, verificationToken);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: user.email,
      subject: 'Verify your email',
      html: getVerificationEmailContent(user.username, verifyLink),
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Verification link sent successfully' });
  } catch (err) {
    console.error('Resend code error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resendVerificationPublic = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const userResult = await getUserAttr('email', email.toLowerCase());
    
    if (!userResult.rowCount) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = userResult.rows[0];

    if (user.is_verified) {
      return res.status(400).json({ error: 'This email is already verified' });
    }

    const verificationToken = randomBytes(32).toString('hex');
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${FRONTEND_URL}/auth/verify-email/verify?token=${verificationToken}`;

    await saveVerificationToken(user.id, verificationToken);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: user.email,
      subject: 'Verify your email',
      html: getVerificationEmailContent(user.username, verifyLink),
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Verification link sent successfully' });
  } catch (err) {
    console.error('Resend verification public error:', err);
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

    // Validate password strength
    const passwordValidation = validatePasswordWithRecommendations(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors 
      });
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