import { createPhoto, isPhotoExisted,getPhotosByUserId } from '../models/photosModal.js';
import { createProfile, checkExistedProfiles, getProfileByUserId } from '../models/profileModel.js';
import {
  createTag,
  createUserTag,
  getTagByName,
  isUserTagExisted,
} from '../models/tagModel.js';
import { updateUser, getUserAttr } from '../models/userModel.js';
import { getUserTags } from '../models/tagModel.js';



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
    const user = await getUserAttr('id', userId);
    console.log("profile :", profile);
    console.log("tags :", tags);
    console.log("photos :", photos);

    res.status(200).json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
      profile,
      tags,
      photos,
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
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
      user_id: uid,
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
    
    console.log('Uploaded files:', req.files);

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
      console.log('No files uploaded');
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
