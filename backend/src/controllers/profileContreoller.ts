import type { Request, Response } from 'express';
import { reverseGeocode } from '../utils/geocode.js';
import { pool } from '../config/config.js';
import fs from 'fs';
import path from 'path';
import JWT from '../middlewares/authMiddleware.js';

interface AuthRequest {
  user?: { data: { id: number; username?: string; email?: string } };
  files?: any[];
  file?: any;
  body: any;
  params: any;
}

const MIN_AGE = 18;

const isValidAge = (birthDateStr: string) => {
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= MIN_AGE;
};
import { getMatchesCount } from '../models/matchModel.js';
import { createAndSendNotification } from '../utils/notificationHelper.js';
import { notificationTypes } from './matchingController.js';
import { Likes, User, Tags, UserTags, ProfileViews, Profiles, Photos } from '../../database/entities/index.js';
import { Raw } from '../../database/raw.js';
/**
 * Retrieves the complete user profile including personal information, photos, and tags
 * @param {Object} req - Express request object containing user authentication data
 * @param {Object} res - Express response object to send profile data
 * @returns {Object} JSON response with user profile details and statistics
 */
export const getProfile = async (req: any, res: any): Promise<void | Response> => {
  try {
    const userId = req.user?.data.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Fetch main profile data
    const profile = await Profiles.select(['*']).where('user_id', userId).run().then(result => result.rows[0]);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Fetch user's associated tags
    const tags = await UserTags.select(['t.id', 't.name']).from('user_tags ut')
      .join('', 'tags t', 'ut.tag_id = t.id').where('ut.user_id', userId)
      .run().then((result) => result.rows);

    // Fetch user's photo gallery
    const photos = await Photos.select(['*']).where('user_id', userId).run().then(result => result.rows);

    // Fetch basic user account information
    const userResult = await User.select(['*']).where('id', userId).run();
    const user = userResult.rows[0];

    const views = await ProfileViews.select(['COUNT(*)::int AS total_views'])
      .where('viewed_user_id', userId)
      .run().then((result) => (result.rows[0] as any).total_views);
    const ret = await Likes.select(['COUNT(*)::int AS total_likes']).where('liked_user_id', userId).run();
    const likes = (ret.rows[0] as any).total_likes;
    const matches = await getMatchesCount(userId)
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
      sexual_preference:
        profile.sexual_preference === 'male'
          ? 'men'
          : profile.sexual_preference === 'female'
            ? 'women'
            : 'both',
      tags: tags,
      photos: photos,
      stats: {
        views,
        likes,
        matches,
        messages: 5,
      },
    });
  } catch (err: unknown) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Retrieves another user's public profile by username
 * @route GET /profile/:username
 * @access Protected (or Public, depending on your policy)
 */

export const getProfileUser = async (req: any, res: any): Promise<void | Response> => {
  try {
    const { username } = req.params;
    const viewerId = req.user?.data?.id; // logged-in user ID

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // 1. Get user by username
    const userResult = await User.select(['*']).where('username', username).run();
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const viewedId = user.id;

    if (viewerId && viewerId !== viewedId) {
      const blockCheck = await pool.query(
        `SELECT
          EXISTS(SELECT 1 FROM blocks WHERE blocker_user_id = $1 AND blocked_user_id = $2) AS "iBlocked",
          EXISTS(SELECT 1 FROM blocks WHERE blocker_user_id = $2 AND blocked_user_id = $1) AS "theyBlocked"`,
        [viewerId, viewedId]
      );
      const { iBlocked, theyBlocked } = blockCheck.rows[0];
      if (iBlocked || theyBlocked) {
        return res.status(403).json({
          error: 'blocked',
          iBlocked,
          theyBlocked,
          username: user.username,
        });
      }
    }

    if (viewerId && viewerId !== viewedId) {
      await createAndSendNotification(viewedId, notificationTypes.VIEW, viewerId);

      const lastviewscount = await ProfileViews.select(['viewed_at'])
        .where('viewer_user_id', viewerId).where('viewed_user_id', viewedId)
        .where('viewed_at', new Raw(`NOW() - INTERVAL '24 hours'`), '>')
        .run().then(result => result.rowCount);
      if (lastviewscount <= 0) {
        await ProfileViews.insert({
          viewer_user_id: viewerId,
          viewed_user_id: viewedId,
          viewed_at: new Raw('NOW()'),
        }).run();
      }
    }

    // 3. Get profile
    const profile = await Profiles.select(['*']).where('user_id', viewedId).run().then(result => result.rows[0]);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // 4. Get tags, photos, and total views
    const tags = await UserTags.select(['t.id', 't.name']).from('user_tags ut')
      .join('INNER', 'tags t', 'ut.tag_id = t.id').where('ut.user_id', viewedId)
      .run().then((result) => result.rows);
    const photos = await Photos.select(['*']).where('user_id', viewedId).run().then(result => result.rows);
    const views = await ProfileViews.select(['COUNT(*)::int AS total_views'])
      .where('viewed_user_id', viewedId)
      .run().then((result) => (result.rows[0] as any).total_views);
    const ret = await Likes.select(['COUNT(*)::int AS total_likes']).where('liked_user_id', viewedId).run();
    const likes = (ret.rows[0] as any).total_likes;
    const matches = await getMatchesCount(viewedId)
    // 5. Return full profile
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
        profile.sexual_preference === 'male'
          ? 'men'
          : profile.sexual_preference === 'female'
            ? 'women'
            : 'both',
      tags,
      photos,
      stats: {
        views: views, // ✅ dynamic
        likes,
        matches,
        // messages: profile.messages || 0,
      },
    });
  } catch (err: unknown) {
    console.error('Error fetching user profile by username:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// get lsit of ppl who viwed u

export const getWhoViewedYou = async (req: any, res: any): Promise<void | Response> => {
  try {
    const userId = req.user?.data.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Fetch all unique viewers
    const viewers = await ProfileViews.select([
      'DISTINCT ON (pv.viewer_user_id) u.id', 'u.username', 'u.first_name', 'u.last_name', 'u.completed_profile', 'p.photo_url AS profile_picture', ' pv.viewed_at'])
      .from('profile_views pv')
      .join('', 'users u', 'pv.viewer_user_id = u.id')
      .join('LEFT', 'photos p', 'p.user_id = u.id AND p.is_profile_picture = TRUE')
      .where('pv.viewed_user_id', userId)
      .orderBy('pv.viewer_user_id, pv.viewed_at', 'DESC')
      .run().then((result) => result.rows);

    res.status(200).json({
      totalViewers: viewers.length,
      viewers: viewers.map((v: any) => ({
        id: v.id,
        username: v.username,
        first_name: v.first_name,
        last_name: v.last_name,
        completed_profile: v.completed_profile,
        picture: v.profile_picture,
        viewed_at: v.viewed_at,
      })),
    });
  } catch (err: unknown) {
    console.error('Error fetching profile viewers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Updates user profile information including personal details, photos, and tags
 * @param {Object} req - Express request object containing user data and authentication
 * @param {Object} res - Express response object to send updated profile
 * @returns {Object} JSON response with updated user profile
 */
export const updateProfile = async (req: any, res: any): Promise<void | Response> => {
  try {
    const userId = req.user?.data.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Verify profile exists for the authenticated user
    const existingProfile = await Profiles.select(['*']).where('user_id', userId).run().then(result => result.rowCount > 0);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Prepare updates for user account information (name, email, username)
    const userUpdates: any = {};
    if (req.body.first_name) userUpdates.first_name = req.body.first_name;
    if (req.body.last_name) userUpdates.last_name = req.body.last_name;

    // Validate and update email if provided
    if (req.body.email) {
      const emailResult = await User.select(['*']).where('email', req.body.email.toLowerCase()).run();
      if (emailResult.rowCount > 0 && emailResult.rows[0].id !== userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      userUpdates.email = req.body.email;
      // update flag is_verified to false when email is changed
      userUpdates.is_verified = false;
    }

    // Validate and update username if provided
    if (req.body.username) {
      const usernameResult = await User.select(['*']).where('username', req.body.username).run();
      if (
        usernameResult.rows.length > 0 &&
        usernameResult.rows[0].id !== userId
      ) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      userUpdates.username = req.body.username;
    }

    // Apply user account updates if any changes exist
    if (Object.keys(userUpdates).length > 0) {
      await User.update(userUpdates).where('id', userId).run();
    }

    // Prepare updates for profile-specific information
    const profileUpdates: any = {};
    if (req.body.gender) profileUpdates.gender = req.body.gender;

    // Map user-friendly sexual preference values to database format
    if (req.body.sexual_preference) {
      profileUpdates.sexual_preference =
        req.body.sexual_preference === 'men'
          ? 'male'
          : req.body.sexual_preference === 'women'
            ? 'female'
            : 'both';
    }
    if (req.body.biography && req.body.biography.length <= 150) profileUpdates.biography = req.body.biography;
    if (req.body.latitude) profileUpdates.latitude = req.body.latitude;
    if (req.body.longitude) profileUpdates.longitude = req.body.longitude;

    // Validate and update birth date if provided
    if (req.body.birth_date && !isNaN(Date.parse(req.body.birth_date))) {
      if (!isValidAge(req.body.birth_date)) {
        return res.status(400).json({
          error: `You must be at least ${MIN_AGE} years old`,
        });
      }
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
        const ref = await Tags.select(['*']).where('name', tagName).run();
        let tag = ref.rows[0];
        // Create new tag if it doesn't exist
        if (!tag) {
          const now = new Date();
          const ret = await Tags.insert({ name: tagName, created_at: now }).returning(['*']).run();
          tag = ret.rows[0];
        }
        // Associate user with the tag
        await UserTags.insert({ user_id: userId, tag_id: tag.id }).run();
      }
    }

    // Handle photo uploads
    if (req.files && (req.files as any[]).length > 0) {
      for (const file of (req.files as any[])) {
        const photoPath = `/uploads/${file.filename}`;
        const photoIndex = parseInt(file.fieldname.replace('photo', ''));
        const existedPhoto = await Photos.select(['*'])
          .where('photo_url', photoPath)
          .run().then(result => result.rowCount > 0);

        // Only create new photo if it doesn't already exist
        if (!existedPhoto) {
          await Photos.insert({
            user_id: userId,
            photo_url: photoPath,
            is_profile_picture: photoIndex === parseInt(req.body.profilePhotoIndex as string),
          }).returning(['*']).run();
        }
      }
    }

    // Fetch updated data to return to client
    const updatedProfile = await Profiles.select(['*']).where('user_id', userId).run().then(result => result.rows[0]);
    const tags = await UserTags.select(['t.id', 't.name']).from('user_tags ut')
      .join('INNER', 'tags t', 'ut.tag_id = t.id').where('ut.user_id', userId)
      .run().then((result) => result.rows);
    const photos = await Photos.select(['*']).where('user_id', userId).run().then(result => result.rows);
    const userResult = await User.select(['*']).where('id', userId).run();
    const user = userResult.rows[0];

    res.status(200).json({
      id: userId,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      gender: updatedProfile.gender,
      // Map database values back to user-friendly format
      sexual_preference:
        updatedProfile.sexual_preference === 'male'
          ? 'men'
          : updatedProfile.sexual_preference === 'female'
            ? 'women'
            : 'both',
      biography: updatedProfile.biography,
      birth_date: updatedProfile.birth_date,
      city: updatedProfile.city,
      country: updatedProfile.country,
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
    } catch (err: unknown) {
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
  export const updateProfilePicture = async (req: any, res: any): Promise<void | Response> => {
    try {
      const userId = req.user?.data.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // Validate that a file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const photoPath = `/uploads/${req.file.filename}`;

      // Check if photo already exists in the system
      const existedPhoto = await Photos.select(['*'])
        .where('photo_url', photoPath)
        .run().then(result => result.rowCount > 0);
      if (existedPhoto) {
        return res.status(400).json({ error: 'Photo already exists' });
      }

      // Retrieve current profile picture to clean up old file
      const oldProfile = await Photos.select(['photo_url'])
        .where('user_id', userId)
        .where('is_profile_picture', true)
        .run();

      if (oldProfile.rows.length > 0) {
        const oldPhotoPath = path.join(
          process.cwd(),
          (oldProfile.rows[0] as any).photo_url
        );

        // Remove old profile picture file from server
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      // Remove old profile picture from database
      const isprofilePhotoExists = await Photos.select(['*']).where('user_id', userId).where('is_profile_picture', true).run().then(result => result.rowCount > 0);
      if (isprofilePhotoExists) {
        await Photos.delete().where('user_id', userId).where('is_profile_picture', true).run();
      }


      // Create new profile picture record
      await Photos.insert({
        user_id: userId,
        photo_url: photoPath,
        is_profile_picture: true,
      }).returning(['*']).run();

      res.status(200).json({ message: 'Profile picture updated successfully' });
    } catch (err: unknown) {
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
  export const deleteProfilePicture = async (req: any, res: any): Promise<void | Response> => {
    try {
      const userId = req.user?.data.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // Retrieve current profile picture
      const oldProfile = await Photos.select(['photo_url'])
        .where('user_id', userId)
        .where('is_profile_picture', true)
        .run();
      if (oldProfile.rows.length === 0) {
        return res.status(404).json({ error: 'No profile picture to delete' });
      }

      const oldPhotoPath = path.join(process.cwd(), (oldProfile.rows[0] as any).photo_url);

      // Remove profile picture file from server
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }

      // Remove profile picture record from database
      const isprofilePhotoExists = await Photos.select(['*']).where('user_id', userId).where('is_profile_picture', true).run().then(result => result.rowCount > 0);
      if (isprofilePhotoExists) {
        await Photos.delete().where('user_id', userId).where('is_profile_picture', true).run();
      }

      res.status(200).json({ message: 'Profile picture deleted successfully' });
    } catch (err: unknown) {
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
  export const addGalleryPicture = async (req: any, res: any): Promise<void | Response> => {
    try {
      const userId = req.user?.data.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // Validate that a file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const photoPath = `/uploads/${req.file.filename}`;

      // Check if photo already exists in the system
      const existedPhoto = await Photos.select(['*'])
        .where('photo_url', photoPath)
        .run().then(result => result.rowCount > 0);
      if (existedPhoto) {
        return res.status(400).json({ error: 'Photo already exists' });
      }

      // Create new gallery photo record
      await Photos.insert({
        user_id: userId,
        photo_url: photoPath,
        is_profile_picture: false,
      }).returning(['*']).run();

      res.status(200).json({ message: 'Gallery picture added successfully' });
    } catch (err: unknown) {
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
  export const deleteGalleryPicture = async (req: any, res: any): Promise<void | Response> => {
    try {
      const userId = req.user?.data.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const photoId = req.params.pictureId;

      // Retrieve the photo to verify ownership and existence
      const photoResult = await Photos.select(['photo_url'])
        .where('id', photoId)
        .where('user_id', userId)
        .where('is_profile_picture', false)
        .run().then(result => result.rows[0]);
      if (!photoResult) {
        return res.status(404).json({ error: 'Gallery picture not found' });
      }

      const photoPath = path.join(process.cwd(), (photoResult as any).photo_url);

      // Remove photo file from server if it exists
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }

      // Remove photo record from database
      await Photos.delete().where('id', photoId).run();

      res.status(200).json({ message: 'Gallery picture deleted successfully' });
    } catch (err: unknown) {
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
  export const logoutController = (req: any, res: any): void => {
    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'strict' : 'lax') as 'strict' | 'lax',
      path: '/',
    };

    // Clear the JWT authentication cookie
    res.clearCookie('token', cookieOptions);

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', cookieOptions);

    res.status(200).json({ message: 'Logged out successfully' });
  };

  /**
   * Completes user profile setup with initial data, tags, and photos
   * @param {Object} req - Express request object containing profile data and files
   * @param {Object} res - Express response object to send success/error message
   * @returns {Object} JSON response indicating success or error
   */
  export const completeProfile = async (req: any, res: any): Promise<void | Response> => {
    try {
      const userTokenData = req.user?.data;
      if (!userTokenData) return res.status(401).json({ error: 'Unauthorized' });

      // Validate age
      if (req.body.birth_date) {
        if (!isValidAge(req.body.birth_date)) {
          return res.status(400).json({
            error: `You must be at least ${MIN_AGE} years old`,
          });
        }
      }

      // Check if profile already exists
      const isProfileExisted = await Profiles.select(['*']).where('user_id', userTokenData.id).run().then(result => result.rowCount > 0);
      if (isProfileExisted) {
        return res.status(403).json({
          error: 'Profile already created',
        });
      }

      await Profiles.insert({
        user_id: userTokenData.id,
        gender: req.body.gender,
        sexual_preference:
          req.body.sexualPreference === 'men' ? 'male' : 'female',
        biography: req.body.biography,
        birth_date: req.body.birth_date,
      }).run();

      // Process and create user interest tags
      const interests = JSON.parse(req.body.interests);
      for (const tag of interests) {
        let existingTag = await Tags.select(['*']).where('name', tag).run().then(result => result.rows[0]);
        const now = new Date(Date.now());

        // Create new tag if it doesn't exist
        if (!existingTag) {
          const ret = await Tags.insert({ name: tag, created_at: now })
            .returning(['*']).run();
          existingTag = ret.rows[0];
        }
        // Check if user-tag association already exists
        const UserTagExisted = await UserTags.select(['*'])
          .where('user_id', userTokenData.id).where('tag_id', (existingTag as any).id)
          .run().then(result => result.rows[0]);
        if (!UserTagExisted) {
          await UserTags.insert({
            user_id: userTokenData.id,
            tag_id: (existingTag as any).id,
          }).run();
        }
      }

      // Handle profile photo uploads
      if (req.files && (req.files as any[]).length > 0) {
        for (const file of (req.files as any[])) {
          const photoPath = `/uploads/${file.filename}`;
          const photoIndex = parseInt(file.fieldname.replace('photo', ''));

          const existedPhoto = await Photos.select(['*'])
            .where('photo_url', photoPath)
            .run().then(result => result.rowCount > 0);
          if (!existedPhoto) {
            await Photos.insert({
              user_id: userTokenData.id,
              photo_url: photoPath,
              is_profile_picture:
                photoIndex === parseInt(req.body.profilePhotoIndex as string),
            }).returning(['*']).run();
          }
        }
      }

      // Mark profile as completed in user record
      await User.update({ completed_profile: true }).where('id', userTokenData.id).run();
      (userTokenData as any).completed_profile = true;

      const token = JWT.createJWToken({
        sessionData: userTokenData,
        maxAge: '2 days',
      });
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      res.status(200).json({
        message: 'profile completed',
        username: userTokenData.username,
      });
    } catch (err: unknown) {
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
  export const addUserTag = async (req: any, res: any): Promise<void | Response> => {
    try {
      const userId = req.user?.data.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      let { tagName } = req.body;

      if (!tagName)
        return res.status(400).json({ error: 'Tag name is required' });
      if (typeof tagName !== 'string' || tagName.trim() === '')
        return res.status(400).json({ error: 'Invalid tag name' });
      if (tagName.length > 30)
        return res
          .status(400)
          .json({ error: 'Tag name too long (max 30 characters)' });
      tagName = tagName.trim();
      const tagNameWithHash = tagName.startsWith('#') ? tagName : `#${tagName}`;
      const ref = await Tags.select(['*']).where('name', tagNameWithHash).run();
      let tag = ref.rows[0];
      if (!tag) {
        try {
          const ret = await Tags.insert({ name: tagNameWithHash, created_at: new Date() }).returning(['*']).run();
          tag = ret.rows[0];
        } catch (createErr: any) {
          if (createErr.code === '23505') {
            const ref = await Tags.select(['*']).where('name', tagNameWithHash).run();
            tag = ref.rows[0];
            if (!tag) {
              return res.status(500).json({ error: 'Failed to create tag' });
            }
          } else {
            throw createErr;
          }
        }
      }

      // Check if user already has this tag
      const userTagExists = await UserTags.select(['*']).where('user_id', userId)
        .where('tag_id', (tag as any).id)
        .run()
        .then((result) => result.rows[0]);
      if (userTagExists) {
        return res.status(400).json({ error: 'User already has this tag' });
      }

      // Create user-tag association
      await UserTags.insert({ user_id: userId, tag_id: (tag as any).id }).run();

      res.status(200).json({ message: 'Tag added successfully', tag });
    } catch (err: unknown) {
      console.error('Error adding tag:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Remove a tag from user's profile
   * @route DELETE /profile/remove-tag/:tagId
   * @access Protected
   */
  export const removeUserTag = async (req: any, res: any): Promise<void | Response> => {
    try {
      const userId = req.user?.data.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { tagId } = req.params;

      // Verify tag exists and belongs to user
      const userTags = await UserTags.select(['t.id', 't.name']).from('user_tags ut')
        .join('INNER', 'tags t', 'ut.tag_id = t.id').where('ut.user_id', userId)
        .run().then((result) => result.rows);
      const tagExists = userTags.some((tag: any) => tag.id == tagId);

      if (!tagExists) {
        return res.status(404).json({ error: 'Tag not found in user profile' });
      }

      // Remove user-tag association
      await pool.query(
        'DELETE FROM user_tags WHERE user_id = $1 AND tag_id = $2',
        [userId, tagId]
      );

      res.status(200).json({ message: 'Tag removed successfully' });
    } catch (err: unknown) {
      console.error('Error removing tag:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Update user's tags (replace all current tags with new ones)
   * @route PUT /profile/update-tags
   * @access Protected
   */
  export const updateUserTags = async (req: any, res: any): Promise<void | Response> => {
    try {
      const userId = req.user?.data.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { tags } = req.body; // Array of tag names

      if (!Array.isArray(tags)) {
        return res.status(400).json({ error: 'Tags must be an array' });
      }

      // Remove all existing user tags
      await pool.query('DELETE FROM user_tags WHERE user_id = $1', [userId]);

      // Add new tags
      for (const tagName of tags) {
        const ref = await Tags.select(['*']).where('name', tagName).run();
        let tag = ref.rows[0];
        if (!tag) {
          const ret = await Tags.insert({ name: tagName, created_at: new Date() }).returning(['*']).run();
          tag = ret.rows[0];
        }
        await UserTags.insert({ user_id: userId, tag_id: (tag as any).id }).run();
      }

      // Return updated tags
      const updatedTags = await UserTags.select(['t.id', 't.name']).from('user_tags ut')
        .join('INNER', 'tags t', 'ut.tag_id = t.id').where('ut.user_id', userId)
        .run().then((result) => result.rows);
      res
        .status(200)
        .json({ message: 'Tags updated successfully', tags: updatedTags });
    } catch (err: unknown) {
      console.error('Error updating tags:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Get all available tags (for tag suggestions)
   * @route GET /profile/available-tags
   * @access Protected
   */
  export const getAvailableTags = async (req: any, res: any): Promise<void> => {
    try {
      const result = await pool.query('SELECT id, name FROM tags ORDER BY name');
      res.status(200).json(result.rows);
    } catch (err: unknown) {
      console.error('Error fetching available tags:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // // =============================================================================
  // // LOCATION MANAGEMENT ROUTES
  // // =============================================================================

  /**
   * Updates the user's location (latitude, longitude) and reverse geocodes to get city and country
   * @route PUT /profile/location
   * @access Protected
   */
  export const updateLocation = async (req: any, res: any): Promise<void | Response> => {
    const { latitude, longitude } = req.body;
    const userId = req.user?.data.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (latitude == null || longitude == null) {
      return res
        .status(400)
        .json({ message: 'Latitude and longitude are required' });
    }

    try {
      let city, country;
      try {
        const geo = await reverseGeocode(latitude, longitude);
        city = geo.city;
        country = geo.country;
      } catch (geoError) {
        console.warn(`Reverse geocode failed for (${latitude}, ${longitude}):`, geoError);
      }

      console.log(`Updating location for user ${userId}: (${latitude}, ${longitude})`);
      
      const updateData: any = {
        latitude: latitude,
        longitude: longitude,
        updated_at: new Date(),
      };
      
      if (city) updateData.city = city;
      if (country) updateData.country = country;

      const updatedUser = await Profiles.update(updateData).where('user_id', userId).returning(['*'])
        .run().then(result => result.rows[0]);
      console.log('Location updated successfully:', updatedUser);
      res
        .status(200)
        .json({ message: 'Location updated successfully', user: updatedUser });
    } catch (error: unknown) {
      res
        .status(500)
        .json({ message: 'Error updating location' });
    }
  };
