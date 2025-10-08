import { createPhoto, isPhotoExisted } from '../models/photosModal.js';
import { createProfile, checkExistedProfiles } from '../models/profileModel.js';
import {
  createTag,
  createUserTag,
  getTagByName,
  isUserTagExisted,
} from '../models/tagModel.js';
import { updateUser } from '../models/userModel.js';

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
        // console.log(req.files[key][0]);
        console.log("filename", file.filename);
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
