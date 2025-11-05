import {
  createPhoto,
  isPhotoExisted,
  getPhotosByUserId,
  getProfilePictureByUserId,
  deleteProfilePictureByUserId,
  getGalleryPhotoById,
  deletePhotoById
} from '../models/photosModal.js';
import {
  createProfile,
  checkExistedProfiles,
  getProfileByUserId,
  updateUserLocation
} from '../models/profileModel.js';
import {
  createTag,
  createUserTag,
  getTagByName,
  isUserTagExisted,
} from '../models/tagModel.js';
import { updateUser, getUserAttr } from '../models/userModel.js';
import { getUserTags } from '../models/tagModel.js';
import { pool } from '../config/config.js';
import fs from 'fs';
import path from 'path';
import JWT from '../middlewares/authMiddleware.js';

/**
 * Retrieves the complete user profile including personal information, photos, and tags
 * @param {Object} req - Express request object containing user authentication data
 * @param {Object} res - Express response object to send profile data
 * @returns {Object} JSON response with user profile details and statistics
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.data.id;

    // Fetch main profile data
    const profile = await getProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Fetch user's associated tags
    const tags = await getUserTags(userId);

    // Fetch user's photo gallery
    const photos = await getPhotosByUserId(userId);

    // Fetch basic user account information
    const userResult = await getUserAttr('id', userId);
    const user = userResult.rows[0];

    // Send comprehensive profile response
    res.status(200).json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      biography: profile.biography,
      birth_date: profile.birth_date,
      city: profile.city,
      country: profile.country,
      fame_rating: profile.fame_rating,
      gender: profile.gender,
      is_online: profile.is_online,
      last_seen: profile.last_seen,
      latitude: profile.latitude,
      longitude: profile.longitude,
      // Map database sexual preference values to user-friendly format
      sexual_preference: profile.sexual_preference === 'male' ? 'men' : 
                       profile.sexual_preference === 'female' ? 'women' : 'both',
      tags: tags,
      photos: photos,
      stats: {
        views: 128,
        likes: 42,
        matches: 8,
        messages: 5,
      },
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Retrieves another user's public profile by username
 * @route GET /profile/:username
 * @access Protected (or Public, depending on your policy)
 */
export const getProfileUser = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // 1. Get user by username
    const userResult = await getUserAttr('username', username);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];
    const userId = user.id;
    // check if logged in user is trying to access their own profile
    // if (req.user.data.id === userId) {
    //   return res.status(400).json({ error: 'Use /profile to get your own profile' });
    // }
   


    // 2. Get profile
    const profile = await getProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // 3. Get tags and photos
    const tags = await getUserTags(userId);
    const photos = await getPhotosByUserId(userId);

    // 4. Return full profile (same structure as getProfile)
    res.status(200).json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      biography: profile.biography,
      birth_date: profile.birth_date,
      city: profile.city,
      country: profile.country,
      fame_rating: profile.fame_rating,
      gender: profile.gender,
      is_online: profile.is_online,
      last_seen: profile.last_seen,
      latitude: profile.latitude,
      longitude: profile.longitude,
      sexual_preference:
        profile.sexual_preference === 'male' ? 'men' :
        profile.sexual_preference === 'female' ? 'women' : 'both',
      tags: tags,
      photos: photos,
      stats: {
        views: profile.views || 0,
        likes: profile.likes || 0,
        matches: profile.matches || 0,
        messages: profile.messages || 0,
      },
    });
  } catch (err) {
    console.error('Error fetching user profile by username:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


/**
 * Updates user profile information including personal details, photos, and tags
 * @param {Object} req - Express request object containing user data and authentication
 * @param {Object} res - Express response object to send updated profile
 * @returns {Object} JSON response with updated user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.data.id;

    // Verify profile exists for the authenticated user
    const existingProfile = await getProfileByUserId(userId);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Prepare updates for user account information (name, email, username)
    const userUpdates = {};
    if (req.body.first_name) userUpdates.first_name = req.body.first_name;
    if (req.body.last_name) userUpdates.last_name = req.body.last_name;
    
    // Validate and update email if provided
    if (req.body.email) {
      const emailResult = await getUserAttr('email', req.body.email);
      if (emailResult.rows.length > 0 && emailResult.rows[0].id !== userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      userUpdates.email = req.body.email;
    }
    
    // Validate and update username if provided
    if (req.body.username) {
      const usernameResult = await getUserAttr('username', req.body.username);
      if (usernameResult.rows.length > 0 && usernameResult.rows[0].id !== userId) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      userUpdates.username = req.body.username;
    }

    // Apply user account updates if any changes exist
    if (Object.keys(userUpdates).length > 0) {
      await updateUser(userId, userUpdates);
    }

    // Prepare updates for profile-specific information
    const profileUpdates = {};
    if (req.body.gender) profileUpdates.gender = req.body.gender;
    
    // Map user-friendly sexual preference values to database format
    if (req.body.sexual_preference) {
      profileUpdates.sexual_preference = 
        req.body.sexual_preference === 'men' ? 'male' : 
        req.body.sexual_preference === 'women' ? 'female' : 'both';
    }
    
    if (req.body.biography) profileUpdates.biography = req.body.biography;
    if (req.body.latitude) profileUpdates.latitude = req.body.latitude;
    if (req.body.longitude) profileUpdates.longitude = req.body.longitude;
    
    // Validate and update birth date if provided
    if (req.body.birth_date && !isNaN(Date.parse(req.body.birth_date))) {
      profileUpdates.birth_date = req.body.birth_date;
    }
    
    if (req.body.city) profileUpdates.city = req.body.city;
    if (req.body.country) profileUpdates.country = req.body.country;

    // Apply profile updates using direct SQL query
    if (Object.keys(profileUpdates).length > 0) {
      await pool.query(
        `UPDATE profiles
         SET ${Object.keys(profileUpdates)
           .map((key, i) => `${key} = $${i + 1}`)
           .join(', ')}
         WHERE user_id = $${Object.keys(profileUpdates).length + 1}`,
        [...Object.values(profileUpdates), userId]
      );
    }

    // Handle user interests/tags update
    if (req.body.interests) {
      const interests = JSON.parse(req.body.interests);

      // Remove all existing user tags
      await pool.query('DELETE FROM user_tags WHERE user_id = $1', [userId]);

      // Process each interest tag
      for (const tagName of interests) {
        let tag = await getTagByName(tagName);
        // Create new tag if it doesn't exist
        if (!tag) {
          const now = new Date();
          tag = await createTag({ name: tagName, create_at: now });
        }
        // Associate user with the tag
        await createUserTag({ user_id: userId, tag_id: tag.id });
      }
    }

    // Handle photo uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const photoPath = `/uploads/${file.filename}`;
        const photoIndex = parseInt(file.fieldname.replace('photo', ''));
        const existedPhoto = await isPhotoExisted(photoPath);
        
        // Only create new photo if it doesn't already exist
        if (!existedPhoto) {
          await createPhoto({
            user_id: userId,
            photo_url: photoPath,
            is_profile_picture: photoIndex === parseInt(req.body.profilePhotoIndex),
          });
        }
      }
    }

    // Fetch updated data to return to client
    const updatedProfile = await getProfileByUserId(userId);
    const tags = await getUserTags(userId);
    const photos = await getPhotosByUserId(userId);
    const userResult = await getUserAttr('id', userId);
    const user = userResult.rows[0];

    res.status(200).json({
      id: userId,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      gender: updatedProfile.gender,
      // Map database values back to user-friendly format
      sexual_preference: updatedProfile.sexual_preference === 'male' ? 'men' : 
                        updatedProfile.sexual_preference === 'female' ? 'women' : 'both',
      biography: updatedProfile.biography,
      birth_date: updatedProfile.birth_date,
      city: 'ifrane', // Note: This seems hardcoded - consider using updatedProfile.city
      country: 'morocco', // Note: This seems hardcoded - consider using updatedProfile.country
      photos: photos,
      tags: tags,
      position: {
        latitude: updatedProfile.latitude,
        longitude: updatedProfile.longitude,
      },
      stats: {
        views: updatedProfile.views,
        likes: updatedProfile.likes,
        matches: updatedProfile.matches,
        messages: updatedProfile.messages,
      },
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(400).json({ error: 'Internal server error' });
  }
};

/**
 * Updates user's profile picture, replacing the existing one
 * @param {Object} req - Express request object containing the uploaded image file
 * @param {Object} res - Express response object to send success/error message
 * @returns {Object} JSON response indicating success or error
 */
export const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.data.id;
    
    // Validate that a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photoPath = `/uploads/${req.file.filename}`;

    // Check if photo already exists in the system
    const existedPhoto = await isPhotoExisted(photoPath);
    if (existedPhoto) {
      return res.status(400).json({ error: 'Photo already exists' });
    }
    
    // Retrieve current profile picture to clean up old file
    const oldProfile = await getProfilePictureByUserId(userId);
    
    if (oldProfile.rows.length > 0) {
      const oldPhotoPath = path.join(process.cwd(), oldProfile.rows[0].photo_url);
      
      // Remove old profile picture file from server
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Remove old profile picture from database
    await deleteProfilePictureByUserId(userId);
    
    // Create new profile picture record
    await createPhoto({
      user_id: userId,
      photo_url: photoPath,
      is_profile_picture: true,
    });

    res.status(200).json({ message: 'Profile picture updated successfully' });
  } catch (err) {
    console.error('Error updating profile picture:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Deletes the user's current profile picture
 * @param {Object} req - Express request object with user authentication
 * @param {Object} res - Express response object to send success/error message
 * @returns {Object} JSON response indicating success or error
 */
export const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.data.id;
    
    // Retrieve current profile picture
    const oldProfile = await getProfilePictureByUserId(userId);
    if (oldProfile.rows.length === 0) {
      return res.status(404).json({ error: 'No profile picture to delete' });
    }
    
    const oldPhotoPath = path.join(process.cwd(), oldProfile.rows[0].photo_url);
    
    // Remove profile picture file from server
    if (fs.existsSync(oldPhotoPath)) {
      fs.unlinkSync(oldPhotoPath);
    }
    
    // Remove profile picture record from database
    await deleteProfilePictureByUserId(userId);
  
    res.status(200).json({ message: 'Profile picture deleted successfully' });
  } catch (err) {
    console.error('Error deleting profile picture:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Adds a new photo to user's gallery
 * @param {Object} req - Express request object containing the uploaded image file
 * @param {Object} res - Express response object to send success/error message
 * @returns {Object} JSON response indicating success or error
 */
export const addGalleryPicture = async (req, res) => {
  try {
    const userId = req.user.data.id;
    
    // Validate that a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photoPath = `/uploads/${req.file.filename}`;

    // Check if photo already exists in the system
    const existedPhoto = await isPhotoExisted(photoPath);
    if (existedPhoto) {
      return res.status(400).json({ error: 'Photo already exists' });
    }

    // Create new gallery photo record
    await createPhoto({
      user_id: userId,
      photo_url: photoPath,
      is_profile_picture: false,
    });

    res.status(200).json({ message: 'Gallery picture added successfully' });
  } catch (err) {
    console.error('Error adding gallery picture:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Deletes a specific gallery photo by ID
 * @param {Object} req - Express request object with photo ID parameter
 * @param {Object} res - Express response object to send success/error message
 * @returns {Object} JSON response indicating success or error
 */
export const deleteGalleryPicture = async (req, res) => {
  try {
    const userId = req.user.data.id;
    const photoId = req.params.pictureId;
   
    // Retrieve the photo to verify ownership and existence
    const photoResult = await getGalleryPhotoById(photoId, userId);
    if (!photoResult) {
      return res.status(404).json({ error: 'Gallery picture not found' });
    }

    const photoPath = path.join(process.cwd(), photoResult.photo_url);

    // Remove photo file from server if it exists
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // Remove photo record from database
    await deletePhotoById(photoId);
    
    res.status(200).json({ message: 'Gallery picture deleted successfully' });
  } catch (err) {
    console.error('Error deleting gallery picture:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles user logout by clearing authentication cookie
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object to clear cookie and send success message
 * @returns {Object} JSON response confirming logout
 */
export const logoutController = (req, res) => {
  // Clear the JWT authentication cookie
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    expires: new Date(0), // Expire immediately
  });

  res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * Completes user profile setup with initial data, tags, and photos
 * @param {Object} req - Express request object containing profile data and files
 * @param {Object} res - Express response object to send success/error message
 * @returns {Object} JSON response indicating success or error
 */
export const completeProfile = async (req, res) => {
  try {
    const userTokenData = req.user.data;

    // Check if profile already exists
    const isProfileExisted = await checkExistedProfiles(userTokenData.id);
    if (isProfileExisted) {
      return res.status(403).json({
        error: 'Profile already created',
      });
    }
    
    // Create initial profile record
    await createProfile({
      user_id: userTokenData.id,
      gender: req.body.gender,
      sexual_preference: req.body.sexualPreference === 'men' ? 'male' : 'female',
      biography: req.body.biography,
    });

    // Process and create user interest tags
    const interests = JSON.parse(req.body.interests);
    for (const tag of interests) {
      let existingTag = await getTagByName(tag);
      const now = new Date(Date.now());
      
      console.log("existingTag", existingTag);
      // Create new tag if it doesn't exist
      if (!existingTag) {
        existingTag = await createTag({ name: tag, create_at: now });
      }
      // Check if user-tag association already exists
      const UserTagExisted = await isUserTagExisted({
        user_id: userTokenData.id,
        tag_id: existingTag.id,
      });      
      // Create user-tag association if it doesn't exist
      if (!UserTagExisted) {
        await createUserTag({ user_id: userTokenData.id, tag_id: existingTag.id });
      }
    }

    // Handle profile photo uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const photoPath = `/uploads/${file.filename}`;
        const photoIndex = parseInt(file.fieldname.replace('photo', ''));
        
        const existedPhoto = await isPhotoExisted(photoPath);
        if (!existedPhoto) {
          await createPhoto({
            user_id: userTokenData.id,
            photo_url: photoPath,
            is_profile_picture: photoIndex === parseInt(req.body.profilePhotoIndex),
          });
        }
      }
    }

    // Mark profile as completed in user record
    await updateUser(userTokenData.id, { completed_profile: true });
    userTokenData.completed_profile = true;

    const token = JWT.createJWToken({ sessionData: userTokenData, maxAge: '2 days' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
    });

    res.status(200).json({
      message: 'profile completed',
    });
  } catch (err) {
    res.status(500).json({
      err: 'Internal server error',
    });
  }
};

// users tags routes handled in tagController.js

/**
 * Add a new tag to user's profile
 * @route POST /profile/add-tag
 * @access Protected
 */
export const addUserTag = async (req, res) => {
  try {
    const userId = req.user.data.id;
    let { tagName } = req.body;

    if (!tagName)
      return res.status(400).json({ error: 'Tag name is required' });
    if (typeof tagName !== 'string' || tagName.trim() === '')
      return res.status(400).json({ error: 'Invalid tag name' });
    if (tagName.length > 30)
      return res.status(400).json({ error: 'Tag name too long (max 30 characters)' });
    tagName = tagName.trim();
    // Check if tag already exists
    let tag = await getTagByName(tagName);
    if (!tag) {
      if (!tagName.startsWith('#')) {
        tagName = `#${tagName}`;
      }
      tag = await createTag({ name: tagName, create_at: new Date() });
    }

    // Check if user already has this tag
    const userTagExists = await isUserTagExisted({ user_id: userId, tag_id: tag.id });
    if (userTagExists) {
      return res.status(400).json({ error: 'User already has this tag' });
    }

    // Create user-tag association
    await createUserTag({ user_id: userId, tag_id: tag.id });

    res.status(200).json({ message: 'Tag added successfully', tag });
  } catch (err) {
    console.error('Error adding tag:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Remove a tag from user's profile
 * @route DELETE /profile/remove-tag/:tagId
 * @access Protected
 */
export const removeUserTag = async (req, res) => {
  try {
    const userId = req.user.data.id;
    const { tagId } = req.params;

    // Verify tag exists and belongs to user
    const userTags = await getUserTags(userId);
    const tagExists = userTags.some(tag => tag.id == tagId);

    if (!tagExists) {
      return res.status(404).json({ error: 'Tag not found in user profile' });
    }

    // Remove user-tag association
    await pool.query(
      'DELETE FROM user_tags WHERE user_id = $1 AND tag_id = $2',
      [userId, tagId]
    );

    res.status(200).json({ message: 'Tag removed successfully' });
  } catch (err) {
    console.error('Error removing tag:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user's tags (replace all current tags with new ones)
 * @route PUT /profile/update-tags
 * @access Protected
 */
export const updateUserTags = async (req, res) => {
  try {
    const userId = req.user.data.id;
    const { tags } = req.body; // Array of tag names

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }

    // Remove all existing user tags
    await pool.query('DELETE FROM user_tags WHERE user_id = $1', [userId]);

    // Add new tags
    for (const tagName of tags) {
      let tag = await getTagByName(tagName);
      if (!tag) {
        tag = await createTag({ name: tagName, create_at: new Date() });
      }
      await createUserTag({ user_id: userId, tag_id: tag.id });
    }

    // Return updated tags
    const updatedTags = await getUserTags(userId);
    res.status(200).json({ message: 'Tags updated successfully', tags: updatedTags });
  } catch (err) {
    console.error('Error updating tags:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all available tags (for tag suggestions)
 * @route GET /profile/available-tags
 * @access Protected
 */
export const getAvailableTags = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM tags ORDER BY name');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching available tags:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// // =============================================================================
// // LOCATION MANAGEMENT ROUTES
// // =============================================================================
export const updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;
  const userId = req.user.data.id;;

  if (latitude == null || longitude == null) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  try {
    console.log(`USER ID: ${userId}, LATITUDE: ${latitude}, LONGITUDE: ${longitude}`);
    const updatedUser = await updateUserLocation(userId, latitude, longitude);
    res.status(200).json({ message: 'Location updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
}