import { createPhoto, isPhotoExisted } from '../models/photosModal.js';
import { createProfile, checkExistedProfiles } from '../models/profileModel.js';
import {
  createTag,
  createUserTag,
  getTagByName,
  isUserTagExisted,
} from '../models/tagModel.js';
import { updateUser, getUserAttr } from '../models/userModel.js';



export const getProfile = async (req, res) => {
  try {
    const userId = req.user.data.id;

    const userResult = await getUserAttr('id', userId);
    if (!userResult.rowCount) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Exclude sensitive fields
    console.log(user);
    const profile = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_verified: user.is_verified,
      avatar: user.avatar || null,
    };

    res.status(200).json({ profile });
  } catch (err) {
    console.error(err);
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

  console.log("User logged out successfully!");
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
      id: uid,
      gender: req.body.gender,
      sexual_preference: req.body.sexualPreference,
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
    
    const photoKeys = ['photo0', 'photo1', 'photo2', 'photo3', 'photo4'];

    

    for (const key of photoKeys) {
      if (req.files && req.files[key] && req.files[key][0]) {
        const file = req.files[key][0];
        const photoPath = `/uploads/${file.filename}`;

        let existed_photo = await isPhotoExisted(photoPath);
        if (!existed_photo && req.files[key]) {
          await createPhoto({
            user_id: uid,
            photo_url: photoPath,
            is_profile_picture: key === `photo${req.body.profilePhotoIndex}`,
          });
        }
      }
    }

    await updateUser(uid, { completed_profile: true });
    
    res.status(200).json({
      message: 'profile completed',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      err: 'Internal sevser error',
    });
  }
};
