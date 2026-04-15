import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
}

function createJWToken(details) {
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

const decodeToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.log('Invalid Token', err.message);
    return null;
  }
};

const getTokeFromCookies = (req) => {
  if (!req.headers.cookie) return null;

  const cookies = req.headers.cookie.split('; ');
  const tokenCookie = cookies.find((c) => c.startsWith('token='));

  if (!tokenCookie) return null;
  return tokenCookie.split('=')[1];
};

const getRefreshTokenFromCookies = (req) => {
  if (!req.headers.cookie) return null;

  const cookies = req.headers.cookie.split('; ');
  const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));

  if (!refreshCookie) return null;
  return refreshCookie.split('=')[1];
};

const createRefreshToken = (details) => {
  const token = jwt.sign(
    { data: details.sessionData },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7 days', algorithm: 'HS256' }
  );
  return token;
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (err) {
    console.log('Invalid Refresh Token', err.message);
    return null;
  }
};

const verifyAndDecodeToken = (req, res, next) => {
  console.log('======================', req.headers.cookie);
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
  verifyJWT,
  getTokeFromCookies,
  verifyAndDecodeToken,
  getRefreshTokenFromCookies,
  createRefreshToken,
  verifyRefreshToken,
};
