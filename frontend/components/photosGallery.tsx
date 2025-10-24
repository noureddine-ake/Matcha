"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Plus, Trash2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useGlobal } from "@/contexts/globalcontext";
import api from "@/lib/api";

interface Photo {
  id: string | number;
  photo_url: string;
  is_profile_picture?: boolean;
}

interface PhotosGalleryProps {
  photos: Photo[];
  backendUrl: string;
}

export default function PhotosGallery({
  photos,
  backendUrl,
}: PhotosGalleryProps) {
  const { fetchProfile } = useGlobal();
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false); // 👈 NEW: drag state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null); // 👈 NEW: ref for drop area

  // ----------------------------
  // Add gallery photo
  // ----------------------------
  const handleAddPhoto = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("galleryPicture", file);

    setUploading(true);
    setError(null);

    try {
      await api.post("/profile/add-gallery-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchProfile();
    } catch (err: unknown) {
      let message = "Failed to upload photo";
    
      if (err instanceof Error) {
        message = err.message || message;
      } else if (typeof err === "object" && err !== null && "response" in err) {
        // @ts-expect-error: axios error type
        message = err.response?.data?.error || message;
      }
    
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
    
    
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsDragging(false); // 👈 Reset drag state
    }
  }, [fetchProfile]);

  // ----------------------------
  // Delete gallery photo
  // ----------------------------
  const handleDeletePhoto = useCallback(async (photoId: string | number) => {
    setDeletingId(photoId);
    setError(null);

    try {
      await api.delete(`/profile/delete-gallery-picture/${photoId}`);
      await fetchProfile();
    } catch (err: unknown) {
      let message = "Failed to delete photo";
    
      if (err instanceof Error) {
        message = err.message || message;
      } else if (typeof err === "object" && err !== null && "response" in err) {
        // @ts-expect-error: axios error type
        message = err.response?.data?.error || message;
      }
    
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
    
    finally {
      setDeletingId(null);
    }
  }, [fetchProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAddPhoto(file);
  };

  // 👇 NEW: Drag event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only remove if not over child elements
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        handleAddPhoto(file);
      } else {
        setError("Only image files are allowed.");
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  // Auto-fit grid
  const getGridCols = () => {
    if (photos.length >= 6) return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
    if (photos.length >= 4) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2";
  };

  // 👇 NEW: Add event listeners if needed (optional for robustness)
  useEffect(() => {
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const preventDefaults = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, preventDefaults, false);
    });

    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.removeEventListener(eventName, preventDefaults, false);
      });
    };
  }, []);

  return (
    <motion.div
      ref={dropAreaRef} // 👈 Attach ref to main container
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl overflow-hidden transition-all duration-300 ${
        isDragging ? "ring-2 ring-purple-400/80 bg-purple-500/5" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <motion.h2
          layout
          className="text-2xl font-bold text-white flex items-center gap-2"
        >
          <Camera className="w-6 h-6 text-purple-400" />
          Photos
        </motion.h2>

        <motion.label
          layout
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-purple-500/30 ${
            uploading ? "opacity-80 pointer-events-none" : "hover:opacity-95"
          }`}
        >
          {uploading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-t-2 border-white rounded-full"
              />
              Uploading...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Photo
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </motion.label>
      </div>

      {/* Drag hint (only when empty or dragging) */}
      {photos.length === 0 && !uploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isDragging ? 1 : 0.6 }}
          className="text-center mb-6"
        >
          <p className="text-purple-300 text-sm">
            {isDragging ? "Drop your photo here!" : "Drag & drop an image, or click 'Add Photo'"}
          </p>
        </motion.div>
      )}

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="mb-5 p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl flex items-center gap-2 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <motion.div
          layout
          className={`grid ${getGridCols()} gap-4`}
        >
          <AnimatePresence>
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, height: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: index * 0.05,
                }}
                whileHover={{ y: -4 }}
                className="group relative cursor-pointer"
              >
                <div
                  className={`rounded-xl overflow-hidden aspect-square transition-all duration-300 shadow-md ${
                    photo.is_profile_picture
                      ? "ring-4 ring-purple-500/80 shadow-purple-500/20"
                      : "group-hover:ring-2 group-hover:ring-purple-400/60"
                  }`}
                >
                  <Image
                    src={`${backendUrl}${photo.photo_url}`}
                    alt="Gallery photo"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                  {photo.is_profile_picture && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-semibold border border-white/20 shadow"
                    >
                      Profile
                    </motion.div>
                  )}
                </div>

                {/* Delete Button – only for non-profile */}
                {!photo.is_profile_picture && (
                  <motion.button
                    layout
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
                    disabled={deletingId === photo.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute -top-2 -right-2 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                  >
                    {deletingId === photo.id ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border-t-2 border-white rounded-full"
                      />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-block"
          >
            <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-400 text-lg">No photos uploaded yet.</p>
          <p className="text-gray-500 text-sm mt-2">Add your first photo to get started!</p>
        </motion.div>
      )}
    </motion.div>
  );
}