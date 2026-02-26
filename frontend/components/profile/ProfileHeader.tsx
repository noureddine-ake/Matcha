"use client";

import { useState } from "react";
import { Settings, LogOut, Loader2 } from "lucide-react";
import ProfilePicture from "@/components/ProfilePicture";
import { User } from "@/contexts/globalcontext";
import api from "@/lib/api";

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
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await api.post("/profile/logout");
            document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
            document.cookie = "token=; Path=/; Max-Age=0;";
            window.location.href = "/auth/login";
        } catch (err) {
            console.error("Error during logout:", err);
            document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
            document.cookie = "token=; Path=/; Max-Age=0;";
            window.location.href = "/auth/login";
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <ProfilePicture
                photos={currentProfile.photos}
                backendUrl={backendUrl}
                size={192}
                editable={isCurrentUser}
            />
            {isCurrentUser && (
                <div className="relative w-full flex flex-col items-center justify-center gap-4 p-5">
                    <button
                        onClick={onEditClick}
                        className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl shadow-md transition-all duration-300 border border-white/20 font-semibold flex items-center justify-center gap-2"
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </button>

                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl shadow-md transition-all duration-300 border border-white/20 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Logging out...
                            </>
                        ) : (
                            <>
                                <LogOut className="w-5 h-5" />
                                Logout
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
