import { getUserAttr, createUser, updateUser } from '../models/userModel.js';
import { createOTP, getUserOTP } from '../models/otpModals.js';
import bcrypt from 'bcryptjs';
import JWT from '../middlewares/authMiddleware.js';
import nodemailer from 'nodemailer';

export const registrationControler = async (req, res) => {
  try {
    const existingUserEmail = await getUserAttr('email', [req.body.email]);
    if (existingUserEmail.rowCount) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const existingUsername = await getUserAttr('username', [req.body.username]);
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
    console.log(token);
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    const code = Math.floor(100000 + Math.random() * 900000);
    const now = new Date(Date.now() + 5 * 60 * 1000);
    console.log('mail', process.env.MAIL_USER, process.env.MAIL_PASS);
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

export const verifyEmailControler = async (req, res) => {
  try {
    const uid = req.user.data.id;
    const row = await getUserOTP(uid);
    console.log("codes : ", req.body.code, row[0].verification_code);
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
