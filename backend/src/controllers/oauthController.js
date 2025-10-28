import JWT from '../middlewares/authMiddleware.js';
import { createUser, getUserAttr, updateUser } from '../models/userModel.js';
import crypto from 'crypto'
import bcrypt from 'bcryptjs'


const GOOGLE_OAUTH_URL = process.env.GOOGLE_OAUTH_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_ACCESS_TOKEN_URL = process.env.GOOGLE_ACCESS_TOKEN_URL;
// const GOOGLE_TOKEN_INFO_URL = process.env.GOOGLE_TOKEN_INFO_URL;
const GOOGLE_CALLBACK_URL = 'http://localhost:5000/google/callback';
const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',

  'https://www.googleapis.com/auth/userinfo.profile',
];

export const googleOauthController = async (req, res) => {
  const state = 'some_state';
  const scopes = GOOGLE_OAUTH_SCOPES.join(' ');
  const GOOGLE_OAUTH_CONSENT_SCREEN_URL = `${GOOGLE_OAUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&access_type=offline&response_type=code&state=${state}&scope=${scopes}`;
  res.redirect(GOOGLE_OAUTH_CONSENT_SCREEN_URL);
};

export const googleCallbackController = async (req, res) => {
  const { code } = req.query;

  if (!code) return res.status(400).send('No code received');

  const params = new URLSearchParams();
  params.append('code', code);
  params.append('client_id', GOOGLE_CLIENT_ID);
  params.append('client_secret', GOOGLE_CLIENT_SECRET);
  params.append('redirect_uri', GOOGLE_CALLBACK_URL);
  params.append('grant_type', 'authorization_code');

  try {
    // 1. Exchange code for tokens
    const response = await fetch(GOOGLE_ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const tokenData = await response.json();

    // 2. Fetch user info from Google
    const userResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const userData = await userResponse.json();

    let rows = await getUserAttr("email", userData.email);
    let user = rows.rows[0]
    if (!rows.rowCount) {
        const randomPassword = crypto.randomBytes(12).toString("base64");
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const newUser = {
          email: userData.email,
          username: userData.name,
          first_name: userData.given_name,
          last_name: userData.family_name,
          password_hash: hashedPassword,
        };
        user = await createUser(newUser);
        await updateUser(user.id, { is_verified: true });
    }
    const token = JWT.createJWToken({
      sessionData: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_verified: true,
        completed_profile: user.completed_profile,
      },
      maxAge: '2 days',
    });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
    });

    const redirectUrl  = user.completed_profile ? "http://localhost:3000/profile" : 'http://localhost:3000/profile/complete'
    res.redirect(redirectUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to exchange code for token');
  }
};
