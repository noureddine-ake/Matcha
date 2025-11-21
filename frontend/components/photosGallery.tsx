"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Plus, Trash2, AlertCircle, RotateCw, ZoomIn, Crop, Filter, Download } from "lucide-react";
import Image from "next/image";
import { useGlobal } from "@/contexts/globalcontext";
import api from "@/lib/api";
import AvatarEditor from 'react-avatar-editor';

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
  const [isDragging, setIsDragging] = useState(false);
  
  // Image Editor States
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const [editorScale, setEditorScale] = useState<number>(1.2);
  const [editorRotation, setEditorRotation] = useState<number>(0);
  const [editorBrightness, setEditorBrightness] = useState<number>(100);
  const [editorContrast, setEditorContrast] = useState<number>(100);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<AvatarEditor>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // ----------------------------
  // Update preview with filters
  // ----------------------------

  useEffect(() => {
    if (!editorRef.current || !previewCanvasRef.current || !editingImage) return;

    const canvas = editorRef.current.getImageScaledToCanvas();
    const previewCtx = previewCanvasRef.current.getContext('2d');
    
    if (!previewCtx) return;

    // Set canvas dimensions
    previewCanvasRef.current.width = canvas.width;
    previewCanvasRef.current.height = canvas.height;
    
    // Apply filters and draw
    previewCtx.filter = `brightness(${editorBrightness}%) contrast(${editorContrast}%)`;
    previewCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
  }, [editingImage, editorBrightness, editorContrast, editorScale, editorRotation]);

  // ----------------------------
  // Handle edited image upload
  // ----------------------------
  const handleUploadEditedImage = useCallback(async () => {
    if (!editorRef.current || !editingImage) return;

    setUploading(true);
    setError(null);

    try {
      // Get the canvas from editor
      const canvas = editorRef.current.getImageScaledToCanvas();
      
      // Create a new canvas to apply filters
      const filteredCanvas = document.createElement('canvas');
      const ctx = filteredCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Set canvas dimensions
      filteredCanvas.width = canvas.width;
      filteredCanvas.height = canvas.height;

      // Apply filters to context before drawing
      ctx.filter = `brightness(${editorBrightness}%) contrast(${editorContrast}%)`;
      
      // Draw the image with filters applied
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);

      // Convert to blob with filters baked in
      filteredCanvas.toBlob(async (blob) => {
        if (!blob) {
          setError("Failed to process image");
          return;
        }

        // Convert blob to file
        const editedFile = new File([blob], editingImage.name, {
          type: editingImage.type,
          lastModified: Date.now(),
        });

        const formData = new FormData();
        formData.append("galleryPicture", editedFile);

        await api.post("/profile/add-gallery-picture", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        await fetchProfile();
        setEditingImage(null);
        resetEditor();
      }, editingImage.type);

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
    } finally {
      setUploading(false);
    }
  }, [editingImage, editorBrightness, editorContrast, fetchProfile]);

  // ----------------------------
  // Reset editor to default state
  // ----------------------------
  const resetEditor = () => {
    setEditorScale(1.2);
    setEditorRotation(0);
    setEditorBrightness(100);
    setEditorContrast(100);
    setEditingImage(null);
  };

  // ----------------------------
  // Handle file selection (start editing)
  // ----------------------------
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Start editing instead of direct upload
    setEditingImage(file);
    setIsDragging(false);
  }, []);

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
    } finally {
      setDeletingId(null);
    }
  }, [fetchProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Drag event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      handleFileSelect(file);
    }
  };

  // Quick edit actions
  const quickActions = [
    { 
      label: "Rotate", 
      icon: RotateCw, 
      action: () => setEditorRotation(prev => (prev + 90) % 360) 
    },
    { 
      label: "Zoom In", 
      icon: ZoomIn, 
      action: () => setEditorScale(prev => Math.min(prev + 0.2, 3)) 
    },
    { 
      label: "Zoom Out", 
      icon: ZoomIn, 
      action: () => setEditorScale(prev => Math.max(prev - 0.2, 1)),
      rotate: true 
    },
    { 
      label: "Reset", 
      icon: Crop, 
      action: () => {
        setEditorScale(1.2);
        setEditorRotation(0);
        setEditorBrightness(100);
        setEditorContrast(100);
      }
    },
  ];

  // Auto-fit grid
  const getGridCols = () => {
    if (photos.length >= 6) return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
    if (photos.length >= 4) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2";
  };

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
    <>
      {/* Image Editor Modal */}
      <AnimatePresence>
        {editingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Edit Image</h3>
                <button
                  onClick={() => setEditingImage(null)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Editor Section */}
                <div className="space-y-4">
                  {/* Preview with filters */}
                  <div className="bg-black rounded-lg p-4 flex items-center justify-center min-h-[300px]">
                    <canvas 
                      ref={previewCanvasRef}
                      className="rounded-lg max-w-full max-h-[300px]"
                    />
                  </div>

                  {/* Hidden editor for processing */}
                  <div style={{ display: 'none' }}>
                    <AvatarEditor
                      ref={editorRef}
                      image={editingImage}
                      width={300}
                      height={300}
                      border={20}
                      borderRadius={10}
                      color={[0, 0, 0, 0.6]}
                      scale={editorScale}
                      rotate={editorRotation}
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-4 gap-2">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className="flex flex-col items-center gap-1 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white text-xs"
                      >
                        <action.icon 
                          className={`w-4 h-4 ${action.rotate ? 'rotate-180' : ''}`} 
                        />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Controls Section */}
                <div className="space-y-6">
                  {/* Scale Control */}
                  <div>
                    <label className="block text-white mb-2 flex justify-between">
                      <span>Zoom</span>
                      <span className="text-purple-400">{Math.round(editorScale * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={editorScale}
                      onChange={(e) => setEditorScale(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Rotation Control */}
                  <div>
                    <label className="block text-white mb-2 flex justify-between">
                      <span>Rotation</span>
                      <span className="text-purple-400">{editorRotation}°</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={editorRotation}
                      onChange={(e) => setEditorRotation(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Brightness Control */}
                  <div>
                    <label className="block text-white mb-2 flex justify-between">
                      <span>Brightness</span>
                      <span className="text-purple-400">{editorBrightness}%</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      step="1"
                      value={editorBrightness}
                      onChange={(e) => setEditorBrightness(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Contrast Control */}
                  <div>
                    <label className="block text-white mb-2 flex justify-between">
                      <span>Contrast</span>
                      <span className="text-purple-400">{editorContrast}%</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      step="1"
                      value={editorContrast}
                      onChange={(e) => setEditorContrast(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Filter Presets */}
                  <div>
                    <label className="block text-white mb-2">Filter Presets</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { name: "Normal", brightness: 100, contrast: 100 },
                        { name: "Bright", brightness: 120, contrast: 110 },
                        { name: "Vivid", brightness: 110, contrast: 130 },
                        { name: "Muted", brightness: 90, contrast: 90 },
                        { name: "Warm", brightness: 110, contrast: 105 },
                        { name: "Cool", brightness: 95, contrast: 110 }
                      ].map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setEditorBrightness(preset.brightness);
                            setEditorContrast(preset.contrast);
                          }}
                          className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white text-xs"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setEditingImage(null)}
                      className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadEditedImage}
                      disabled={uploading}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium flex items-center justify-center gap-2"
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
                          <Download className="w-4 h-4" />
                          Save & Upload
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Gallery */}
      <motion.div
        ref={dropAreaRef}
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

        {/* Drag hint */}
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

                  {/* Delete Button */}
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

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .slider::-webkit-slider-track {
          background: #4b5563;
          border-radius: 10px;
          height: 8px;
        }
        .slider::-moz-range-track {
          background: #4b5563;
          border-radius: 10px;
          height: 8px;
          border: none;
        }
      `}</style>
    </>
  );
}