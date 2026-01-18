"use client";

interface ProfileBioProps {
    biography: string | undefined;
}

export default function ProfileBio({ biography }: ProfileBioProps) {
    if (!biography) {
        return null;
    }

    return (
        <div className="w-full overflow-hidden py-4">
            <h3 className="text-lg font-semibold text-white mb-2">About</h3>
            <p className="text-gray-300 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 wrap-break-word whitespace-pre-wrap overflow-y-auto">
                {biography}
            </p>
        </div>
    );
}
