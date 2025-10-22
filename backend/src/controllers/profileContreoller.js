import {
  createPhoto,
  isPhotoExisted,
  getPhotosByUserId,
} from '../models/photosModal.js';
import {
  createProfile,
  checkExistedProfiles,
  getProfileByUserId,
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

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.data.id;

    // Fetch main profile
    const profile = await getProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Fetch tags
    const tags = await getUserTags(userId);

    // Fetch photos
    const photos = await getPhotosByUserId(userId);

    // Optional: fetch basic user info (like name, email)
    const rows = await getUserAttr('id', userId);
    const user = rows.rows[0];

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
      sexual_preference: profile.sexual_preference == 'male' ? 'men' : profile.sexual_preference == 'female' ? 'women' : 'both',
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

// updateProfile controller can be added here similarly
export const updateProfile = async (req, res) => {
  try {
    const uid = req.user.data.id;

    console.log("HEHHEE", req.body);

    // 1️⃣ Check if profile exists
    const existingProfile = await getProfileByUserId(uid);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // 2️⃣ Update user’s base info
    const userUpdates = {};
    if (req.body.first_name) userUpdates.first_name = req.body.first_name;
    if (req.body.last_name) userUpdates.last_name = req.body.last_name;
    if (req.body.email) userUpdates.email = req.body.email;
    if (req.body.username) userUpdates.username = req.body.username;

    if (Object.keys(userUpdates).length > 0) {
      await updateUser(uid, userUpdates);
    }

    // 3️⃣ Update profile info
    const profileUpdates = {};
    if (req.body.gender) profileUpdates.gender = req.body.gender;
    if (req.body.sexual_preference)
      profileUpdates.sexual_preference = req.body.sexual_preference == 'men' ? "male" : req.body.sexual_preference == 'women' ? "female" : 'both'
        req.body.sexual_preference;
    if (req.body.biography) profileUpdates.biography = req.body.biography;
    if (req.body.latitude) profileUpdates.latitude = req.body.latitude;
    if (req.body.longitude) profileUpdates.longitude = req.body.longitude;
    if (req.body.birth_date && !isNaN(Date.parse(req.body.birth_date))) {
      // console.error('Parsed birth_date:', req.body.birth_date);
      profileUpdates.birth_date = req.body.birth_date;
    }
    if (req.body.city) profileUpdates.city = req.body.city;
    if (req.body.country) profileUpdates.country = req.body.country;

    if (Object.keys(profileUpdates).length > 0) {
      // TODO: crraet model for that sql commnad
      await pool.query(
        `UPDATE profiles
         SET ${Object.keys(profileUpdates)
           .map((key, i) => `${key} = $${i + 1}`)
           .join(', ')}
         WHERE user_id = $${Object.keys(profileUpdates).length + 1}`,
        [...Object.values(profileUpdates), uid]
      );
    }

    // 4️⃣ Update user tags (interests)
    if (req.body.interests) {
      const interests = JSON.parse(req.body.interests);

      // Clear old tags
      await pool.query('DELETE FROM user_tags WHERE user_id = $1', [uid]);

      for (const tagName of interests) {
        let tag = await getTagByName(tagName);
        if (!tag) {
          const now = new Date();
          tag = await createTag({ name: tagName, create_at: now });
        }
        await createUserTag({ user_id: uid, tag_id: tag.id });
      }
    }

    // 5️⃣ Update uploaded photos
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const photoPath = `/uploads/${file.filename}`;
        const index = parseInt(file.fieldname.replace('photo', '')); // now works
        const existedPhoto = await isPhotoExisted(photoPath);
        console.log('Processing file:', file.fieldname, 'as index', index);
        if (!existedPhoto) {
          await createPhoto({
            user_id: uid,
            photo_url: photoPath,
            is_profile_picture: index === parseInt(req.body.profilePhotoIndex),
          });
        }
      }
    }

    // 6️⃣ Return updated data
    const updatedProfile = await getProfileByUserId(uid);
    const tags = await getUserTags(uid);
    const photos = await getPhotosByUserId(uid);
    const rows = await getUserAttr('id', uid);

    const user = rows.rows[0];

    res.status(200).json({
      id: uid,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      gender: updatedProfile.gender,
      sexual_preference:
        updatedProfile.sexual_preference == 'male' ? 'men' : updatedProfile.sexual_preference == 'female' ? 'women' : 'both',
      biography: updatedProfile.biography,
      birth_date: updatedProfile.birth_date,
      city: 'ifrane',
      country: 'morocco',
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
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    const uid = req.user.data.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photoPath = `/uploads/${req.file.filename}`;
    const existedPhoto = await isPhotoExisted(photoPath);

    if (existedPhoto) {
      return res.status(400).json({ error: 'Photo already exists' });
    }

    await createPhoto({
      user_id: uid,
      photo_url: photoPath,
      is_profile_picture: true,
    });

    res.status(200).json({ message: 'Profile picture updated successfully' });
  } catch (err) {
    console.error('Error updating profile picture:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logoutController = (req, res) => {
  // Clear the JWT cookie
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    expires: new Date(0), // expire immediately
  });

  // console.log("User logged out successfully!");
  res.status(200).json({ message: 'Logged out successfully' });
};

export const completeProfile = async (req, res) => {
  try {
    const uid = req.user.data.id;

    const is_profile_existed = await checkExistedProfiles(uid);
    if (is_profile_existed) {
      return res.status(403).json({
        error: 'Profile already created',
      });
    }
    await createProfile({
      user_id: uid,
      gender: req.body.gender,
      sexual_preference: req.body.sexualPreference == 'men' ? 'male' : 'female',
      biography: req.body.biography,
    });

    const interests = JSON.parse(req.body.interests);

    for (const tag of interests) {
      let existed_tag = await getTagByName(tag);
      const date = new Date(Date.now());
      if (!existed_tag) {
        existed_tag = await createTag({ name: tag, create_at: date });
      }
      let existed_usertag = await isUserTagExisted({
        user_id: uid,
        tag_id: existed_tag.id,
      });
      if (!existed_usertag) {
        await createUserTag({ user_id: uid, tag_id: existed_tag.id });
      }
    }

    // console.log('Uploaded files:', req.files);

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const photoPath = `/uploads/${file.filename}`;
        const index = parseInt(file.fieldname.replace('photo', '')); // get index if you need

        const existed_photo = await isPhotoExisted(photoPath);
        if (!existed_photo) {
          await createPhoto({
            user_id: uid,
            photo_url: photoPath,
            is_profile_picture: index === parseInt(req.body.profilePhotoIndex),
          });
        }
      }
    } else {
      // console.log('No files uploaded');
    }

    await updateUser(uid, { completed_profile: true });

    res.status(200).json({
      message: 'profile completed',
    });
  } catch (err) {
    // console.log(err);
    res.status(500).json({
      err: 'Internal sevser error',
    });
  }
};
