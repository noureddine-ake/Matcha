"use client";

import { Loader } from "lucide-react";

interface ProfileLoadingProps {
    variant?: "skeleton" | "spinner";
}

export default function ProfileLoading({ variant = "skeleton" }: ProfileLoadingProps) {
    if (variant === "spinner") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="animate-spin w-12 h-12 text-purple-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br p-4">
            <div className="max-w-6xl mx-auto">
                <div className="animate-pulse space-y-6">
                    <div className="h-32 bg-gray-800/60 rounded-xl"></div>
                    <div className="h-64 bg-gray-800/60 rounded-xl"></div>
                    <div className="h-48 bg-gray-800/60 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
}
