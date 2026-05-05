import fs from 'fs';
import path from 'path';
import express from 'express';
// @ts-ignore
import multer from 'multer';
import JWT from '../middlewares/authMiddleware.js';
import { 
  completeProfile, 
  getProfile, 
  logoutController,
  updateProfile,
  updateProfilePicture,
  deleteProfilePicture,
  addGalleryPicture,
  deleteGalleryPicture,
  addUserTag,
  removeUserTag,
  updateUserTags,
  getAvailableTags,
  getProfileUser,
  updateLocation,
  getWhoViewedYou
} from '../controllers/profileContreoller.js';

// Initialize router for profile-related endpoints
export const profileRoute = express.Router();

/**
 * Ensures the uploads directory exists on application startup
 * Creates directory recursively if it doesn't exist
 */
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Configure Multer storage for file uploads
 * Sets destination directory and generates unique filenames
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, uploadsDir),
  filename: (req: any, file: any, cb: any) => cb(null, Date.now() + '-' + file.originalname),
});

const fileFilter = (req: any, file: any, cb: any) => {
  const ext = file.originalname.toLowerCase().split('.').pop();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
    cb(new Error('Invalid file format. Allowed: jpg, jpeg, png, webp, gif'), false);
    return;
  }
  cb(null, true);
};

const upload = multer({ 
  storage, 
  fileFilter, 
  limits: { fileSize: 5 * 1024 * 1024 } 
});

const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof (multer as any).MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// =============================================================================
// PROFILE COMPLETION & RETRIEVAL ROUTES
// =============================================================================

/**
 * Complete user profile setup with initial data and photos
 * @route POST /profile/complete
 * @access Protected (JWT authentication required)
 * @middleware JWT verification, file upload handling
 */
profileRoute.post(
  '/complete',
  JWT.verifyAndDecodeToken,
  upload.any(),
  handleMulterError,
  completeProfile
);

/**
 * Retrieve current authenticated user's complete profile
 * @route GET /profile/
 * @access Protected (JWT authentication required)
 */
profileRoute.get('/', JWT.verifyAndDecodeToken, getProfile);

// get another user's profile by username
profileRoute.get('/user/:username', JWT.verifyAndDecodeToken, getProfileUser);
// =============================================================================
// PROFILE UPDATE ROUTES
// =============================================================================

/**
 * Update user profile information including personal details and photos
 * @route PUT /profile/update
 * @access Protected (JWT authentication required)
 * @middleware JWT verification, file upload handling
 */
profileRoute.put(
  '/update',
  JWT.verifyAndDecodeToken,
  upload.any(),
  handleMulterError,
  updateProfile
);


// POST /api/profile/update-tags

/**
 * Add a tag to user profile
 */
profileRoute.post(
  '/add-tag',
  JWT.verifyAndDecodeToken,
  addUserTag
);

/**
 * Remove a tag from user profile
 */
profileRoute.delete(
  '/remove-tag/:tagId',
  JWT.verifyAndDecodeToken,
  removeUserTag
);

/**
 * Update all user tags (replace existing)
 */
profileRoute.put(
  '/update-tags',
  JWT.verifyAndDecodeToken,
  updateUserTags
);

/**
 * Get available tags for suggestions
 */
profileRoute.get(
  '/available-tags',
  JWT.verifyAndDecodeToken,
  getAvailableTags
);


// =============================================================================
// PROFILE PICTURE MANAGEMENT ROUTES
// =============================================================================

/**
 * Update user's profile picture
 * @route PUT /profile/update-profile-picture
 * @access Protected (JWT authentication required)
 * @middleware JWT verification, single file upload
 */
profileRoute.put(
  '/update-profile-picture',
  JWT.verifyAndDecodeToken,
  upload.single('profilePicture'),
  handleMulterError,
  updateProfilePicture
);

/**
 * Delete user's current profile picture
 * @route DELETE /profile/delete-profile-picture
 * @access Protected (JWT authentication required)
 */
profileRoute.delete(
  '/delete-profile-picture',
  JWT.verifyAndDecodeToken,
  deleteProfilePicture
);


// =============================================================================
// GALLERY MANAGEMENT ROUTES
// =============================================================================

/**
 * Add a new photo to user's gallery
 * @route POST /profile/add-gallery-picture
 * @access Protected (JWT authentication required)
 * @middleware JWT verification, single file upload
 */
profileRoute.post(
  '/add-gallery-picture',
  JWT.verifyAndDecodeToken,
  upload.single('galleryPicture'),
  handleMulterError,
  addGalleryPicture
);

/**
 * Delete a specific photo from user's gallery
 * @route DELETE /profile/delete-gallery-picture/:pictureId
 * @param {string} pictureId - ID of the photo to delete
 * @access Protected (JWT authentication required)
 */
profileRoute.delete(
  '/delete-gallery-picture/:pictureId',
  JWT.verifyAndDecodeToken,
  deleteGalleryPicture
);

// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

// updae latitude and longitude in user model 
profileRoute.put('/update-location', JWT.verifyAndDecodeToken, updateLocation);
/**
 * Logout current user by clearing authentication token
 * @route POST /profile/logout
 * @access Protected (JWT authentication required)
 */
profileRoute.post('/logout', JWT.verifyAndDecodeToken, logoutController);


profileRoute.get('/views', JWT.verifyAndDecodeToken, getWhoViewedYou);
