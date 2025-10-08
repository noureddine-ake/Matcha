import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

function verifyJWT(req, res, next) {
const authHeader = req.headers['authorization'];
    console.log(authHeader)
}

function createJWToken(details) {
    const token = jwt.sign(
        {
            data: details.sessionData
        },
        JWT_SECRET,
        {
            expiresIn: details.maxAge,
            algorithm: 'HS256'
        }
    )
    return token
}

const decodeToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        console.log("Invalid Token", err.message);
        return null;
    }
}

const getTokeFromCookies = (req) => {
    if (!req.headers.cookie) return null;
    
    const cookies = req.headers.cookie.split("; ");
    const tokenCookie = cookies.find((c) => c.startsWith("token="));

    if (!tokenCookie) return null;
    return tokenCookie.split("=")[1];
};

const verifyAndDecodeToken = (req, res, next) => {
    const token = getTokeFromCookies(req);
    if (!token) {
        return res.status(401).json({error: "no token provided"});
    }

    const userData = decodeToken(token);
    if (!userData) {
        return res.status(403).json({error: "Invalid or Expired token"});
    }

    req.user = userData
    next();
}

export default {
    createJWToken,
    decodeToken,
    verifyJWT,
    getTokeFromCookies,
    verifyAndDecodeToken
}
