import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import { User } from '../../database/entities/users.entity.js';

const getEmailUpdateContent = (username, verifyLink, newEmail) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Email Change Request, ${username}</h1>
          <p>You requested to change your email address to:</p>
          <p style="font-weight: bold; color: #8b5cf6;">${newEmail}</p>
          
          <div class="warning">
            <strong>Important:</strong> Please verify this is your new email address by clicking the button below.
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" class="button">Confirm New Email</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #8b5cf6;">${verifyLink}</p>
          <p>This link will expire in 24 hours.</p>
          <div class="footer">
            <p>If you didn't request this change, please ignore this email and your current email will remain unchanged.</p>
          </div>
        </div>
      </body>
    </html>
  `.trim();
};

export const requestEmailUpdate = async (req, res) => {
  try {
    const user = req.user.data;
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({ error: 'New email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const ret = await User.select(['*']).where('id', user.id).run();

    const currentUser = ret.rows[0];
    if (newEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      return res.status(400).json({ error: 'New email is the same as your current email' });
    }

    const existingEmail = await User.select(['*']).where('email', newEmail.toLowerCase()).run();
    if (existingEmail.rowCount && existingEmail.rowCount > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const token = randomBytes(32).toString('hex');
    await User.update({ pending_email: newEmail.toLowerCase(), pending_email_token: token, updated_at: new Date() }).where('id', user.id).run();

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${FRONTEND_URL}/settings/email-update/verify?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: newEmail,
      subject: 'Confirm your new email address - Matcha',
      html: getEmailUpdateContent(user.username, verifyLink, newEmail),
    });

    res.status(200).json({
      message: 'Verification link sent to your new email address',
      pendingEmail: newEmail
    });
  } catch (err) {
    console.error('Request email update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyPendingEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const ret = await User.select(['*']).where('pending_email_token', token).run();
    const user = ret.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const ret2 = await User.update({
      email: user.pending_email,
      pending_email: null,
      pending_email_token: null,
      is_verified: false,
      verification_token: null,
      updated_at: new Date(),
    }).where('id', user.id).returning(['*']).run();
    const updatedUser = ret2.rows[0];

    res.status(200).json({
      message: 'Email updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
      }
    });
  } catch (err) {
    console.error('Verify pending email error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const cancelEmailUpdate = async (req, res) => {
  try {
    const user = req.user.data;

    const ret = await User.select(['*']).where('id', user.id).run();
    const currentUser = ret.rows[0];

    if (!currentUser.pending_email) {
      return res.status(400).json({ error: 'No pending email change to cancel' });
    }

    await User.update({ pending_email: null, pending_email_token: null, updated_at: new Date() }).where('id', user.id).run();

    res.status(200).json({ message: 'Email change cancelled successfully' });
  } catch (err) {
    console.error('Cancel email update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPendingEmailStatus = async (req, res) => {
  try {
    const user = req.user.data;
    const ret = await User.select(['*']).where('id', user.id).run();
    const currentUser = ret.rows[0];

    res.status(200).json({
      hasPendingEmail: !!currentUser.pending_email,
      pendingEmail: currentUser.pending_email || null,
      currentEmail: currentUser.email,
    });
  } catch (err) {
    console.error('Get pending email status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
