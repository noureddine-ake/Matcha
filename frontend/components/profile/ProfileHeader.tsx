"use client";

import { Edit3, LogOut } from "lucide-react";
import ProfilePicture from "@/components/ProfilePicture";
import { User } from "@/contexts/globalcontext";

interface ProfileHeaderProps {
    currentProfile: User;
    backendUrl: string;
    isCurrentUser: boolean;
    onEditClick: () => void;
}

export default function ProfileHeader({
    currentProfile,
    backendUrl,
    isCurrentUser,
    onEditClick,
}: ProfileHeaderProps) {
    const handleLogout = () => {
        try {
            // remove cookie named 'token' (adjust name if different)
            document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
            // fallback using Max-Age
            document.cookie = "token=; Path=/; Max-Age=0;";
            window.location.href = "/";
        } catch (err) {
            console.error("Error during logout:", err);
        }
    };

    return (
        <div className="relative ">
            <ProfilePicture
                photos={currentProfile.photos}
                backendUrl={backendUrl}
                size={192}
                editable={isCurrentUser}
            />
            {isCurrentUser && (
                <div className="relative w-full flex flex-col items-center justify-center gap-4
                p-5">
                    <button
                        onClick={onEditClick}
                        className="w-full px-6 py-3
               bg-white-100/10 hover:bg-white/20
               text-white rounded-xl shadow-md
               transition-all duration-300
               border border-white/20 font-semibold"
                    >
                        <Edit3 className="w-5 h-5 inline mr-2" />
                        Edite
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full px-6 py-3
               bg-white-100/10 hover:bg-white/20
               text-white rounded-xl shadow-md
               transition-all duration-300
               border border-white/20 font-semibold"
                    >
                        <LogOut className="w-5 h-5 inline mr-2" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
