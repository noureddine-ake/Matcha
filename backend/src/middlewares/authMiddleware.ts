/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';

function createJWToken(details: any) {
  const token = jwt.sign(
    {
      data: details.sessionData,
    },
    JWT_SECRET,
    {
      expiresIn: details.maxAge,
      algorithm: 'HS256',
    }
  );
  return token;
}

const decodeToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const getTokeFromCookies = (req: Request) => {
  if (!req.headers.cookie) return null;

  const cookies = req.headers.cookie.split('; ');
  const tokenCookie = cookies.find((c: string) => c.startsWith('token='));

  if (!tokenCookie) return null;
  return tokenCookie.split('=')[1];
};

const getRefreshTokenFromCookies = (req: Request) => {
  if (!req.headers.cookie) return null;

  const cookies = req.headers.cookie.split('; ');
  const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));

  if (!refreshCookie) return null;
  return refreshCookie.split('=')[1];
};

const createRefreshToken = (details: any) => {
  const token = jwt.sign(
    { data: details.sessionData },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7 days', algorithm: 'HS256' }
  );
  return token;
};

const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

const verifyAndDecodeToken = (req: any, res: Response, next: NextFunction) => {
  const token = getTokeFromCookies(req);
  if (!token) {
    return res.status(401).json({ error: 'no token provided' });
  }

  const userData = decodeToken(token);
  if (!userData) {
    return res.status(403).json({ error: 'Invalid or Expired token' });
  }

  req.user = userData;
  next();
};

export default {
  createJWToken,
  decodeToken,
  getTokeFromCookies,
  verifyAndDecodeToken,
  getRefreshTokenFromCookies,
  createRefreshToken,
  verifyRefreshToken,
};
