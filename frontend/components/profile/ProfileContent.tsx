"use client";

import PhotosGallery from "@/components/photosGallery";
import UserTags from "@/components/UserTags";
import { User } from "@/contexts/globalcontext";

interface ProfileContentProps {
    currentProfile: User;
    backendUrl: string;
    isCurrentUser: boolean;
    isEditing?: boolean;
    setIsEditing?: (value: boolean) => void;
}

export default function ProfileContent({
    currentProfile,
    backendUrl,
    isCurrentUser,
}: ProfileContentProps) {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Interests/Tags Section */}
                <div className="lg:col-span-1">
                    <UserTags tags={currentProfile.tags} editable={isCurrentUser} />
                </div>

                {/* Photos Grid */}
                <div className="lg:col-span-2">
                    <PhotosGallery
                        photos={currentProfile.photos}
                        backendUrl={backendUrl}
                        editable={isCurrentUser}
                    />
                </div>
            </div>
        </div>
    );
}
