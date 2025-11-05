// Profile Picture Display + Upload
import { Photo } from '@/types/profile';
import Image from 'next/image';
const ProfilePictureSection = ({ photos, backendUrl }: { photos: Photo[]; backendUrl: string }) => {
    const profilePhoto = photos.find((p: Photo) => p.is_profile_picture);
    const size = 192;
  
    return (
      <div className="relative flex-shrink-0">
        <div
          className="relative rounded-3xl overflow-hidden border-4 border-transparent bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 shadow-xl"
          style={{ width: size, height: size }}
        >
          {profilePhoto ? (
            <Image
              src={`${backendUrl}${profilePhoto.photo_url}`}
              alt="Profile"
              width={size}
              height={size}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
              <div className="flex flex-col items-center justify-center text-center p-4">
                <Camera className="w-12 h-12 text-white/70 mb-2" />
                <p className="text-white/70 text-sm">No profile picture</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

export default ProfilePictureSection;