import { getUserAttr, createUser, updateUser } from '../models/userModel.js';
import { createOTP, getUserOTP } from '../models/otpModals.js';
import bcrypt from 'bcryptjs';
import JWT from '../middlewares/authMiddleware.js';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import redisClient from "../config/redisClient.js";


export const registrationControler = async (req, res) => {
  try {
    const existingUserEmail = await getUserAttr('email', req.body.email);
    if (existingUserEmail.rowCount) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const existingUsername = await getUserAttr('username', req.body.username);
    if (existingUsername.rowCount) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = {
      email: req.body.email,
      username: req.body.username,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      password_hash: hashedPassword,
    };
    const user = await createUser(newUser);
    const token = JWT.createJWToken({
      sessionData: {
        id: user.id,
        username: newUser.username,
        email: newUser.email,
      },
      maxAge: '2 days',
    });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    const code = Math.floor(100000 + Math.random() * 900000);
    const now = new Date(Date.now() + 5 * 60 * 1000);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail(
      {
        from: process.env.MAIL_USER,
        to: user.email,
        subject: 'Verify your email',
        text: `Matcha : verification code ${code}`,
      },
      (err, info) => {
        if (err) console.error(err);
        else console.log('Email sent: ' + info.response);
      }
    );

    await createOTP({
      user_id: user.id,
      verification_code: code,
      expires_at: now,
    });

    res.status(200).json({ message: 'user added successfully', user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginController = async (req, res) => {
  try {
    // Check if username and password are provided
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username
    const existingUser = await getUserAttr('username', username);
    
    if (!existingUser.rowCount) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const user = existingUser.rows[0];

    // Compare provided password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Check if user is verified
    // if (!user.is_verified) {
    //   return res.status(400).json({ error: 'Please verify your email before logging in' });
    // }

    // Create JWT token
    const token = JWT.createJWToken({
      sessionData: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      maxAge: '2 days',
    });

    // Set cookie with token
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    // Return success response with user data (excluding sensitive info)
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const verifyEmailControler = async (req, res) => {
  try {
    const uid = req.user.data.id;
    const row = await getUserOTP(uid);
    if (req.body.code != row[0].verification_code) {
      return res.status(403).json({ error: 'wrog OTP' });
    }
    const fields = {
      is_verified: true,
    };
    await updateUser(uid, fields);
    res.status(200).json({ message: 'done!' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resendCode = (req, res) => {
  console.log('verifyEmailControler', req.body, Date.now());
  res.status(200).json({ message: 'done!' });
};



const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
// ----------------------------
// Step 1: Request reset link
// ----------------------------
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userResult = await getUserAttr('email', email);
    if (!userResult.rowCount) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Generate unique token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token in DB (implement saveResetToken in your model)
    // await saveResetToken(user.id, token, expiresAt);

    // Store token in Redis with expiry (1 hour = 3600 seconds)
    await redisClient.setEx(`reset:${user.id}`, 3600, token);

    // Send email
    const resetLink = `${FRONTEND_URL}/auth/confirm?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: MAIL_USER, pass: MAIL_PASS },
    });

    await transporter.sendMail({
      from: MAIL_USER,
      to: user.email,
      subject: 'Password Reset',
      text: `Click this link to reset your password: ${resetLink}`,
    });

    res.status(200).json({ message: 'Reset link sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ----------------------------
// Step 2: Confirm reset and set new password
// ----------------------------
export const confirmPasswordReset = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ error: "Missing token or new password" });

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

    // TODO: hash newPassword and update user in DB
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