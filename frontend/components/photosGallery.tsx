"use client";

import { useState, useRef, useCallback, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Plus, Trash2, AlertCircle, X, RotateCcw, RotateCw, Save, X as XIcon } from "lucide-react";
import Image from "next/image";
import { useGlobal } from "@/contexts/globalcontext";
import api from "@/lib/api";
import Cropper from "react-easy-crop";
import { string } from "zod";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  
  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    sepia: 0,
  });
  const [aspect, setAspect] = useState<number | undefined>(undefined); // undefined = free, 1 = 1:1
  const previewRef = useRef<HTMLImageElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!editorFile) return;
    const url = URL.createObjectURL(editorFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [editorFile]);
  useEffect(() => {
    if (!previewRef.current || !previewUrl) return;
    const canvas = previewRef.current;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    const img = new window.Image();
    img.src = previewUrl;
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
    
      // Set canvas size same as cropped area
      const cropW = croppedAreaPixels.width;
      const cropH = croppedAreaPixels.height;
      canvas.width = cropW;
      canvas.height = cropH;
    
      ctx.clearRect(0, 0, cropW, cropH);
    
      // Apply filters
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%)`;
    
      // Move to canvas center before rotation
      ctx.save();
      ctx.translate(cropW / 2, cropH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
    
      // Apply zoom properly (react-easy-crop zoom value)
      const scaledWidth = img.width * zoom;
      const scaledHeight = img.height * zoom;
    
      // Draw image centered
      ctx.drawImage(
        img,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );
    
      ctx.restore();
    };
    
    
    
    
  }, [previewUrl, crop, zoom, rotation, filters]);
  
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
      setIsDragging(false);
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
    if (file) {
      setEditorFile(file);
      setEditorOpen(true);
    }
  };

  // Handle drag and drop
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
      if (file.type.startsWith("image/")) {
        setEditorFile(file);
        setEditorOpen(true);
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

  // Crop change handler
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Apply filters to canvas
  const applyFilters = (ctx, canvas) => {
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%)`;
    ctx.drawImage(canvas, 0, 0);
  };

  // Get cropped image
  const getCroppedImage = async (imageSrc, pixelCrop, rotation) => {
    return new Promise((resolve, reject) => {
      const image = new window.Image(); // Use window.Image instead of next/image
      image.src = imageSrc;
      
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('No 2d context'));
          return;
        }

        // Set canvas dimensions to the cropped area
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Move to center of canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Rotate the canvas if needed
        if (rotation !== 0) {
          ctx.rotate(rotation * (Math.PI / 180));
        }
        
        // Draw the image at the center of the canvas
        ctx.drawImage(
          image,
          pixelCrop.x - canvas.width / 2,
          pixelCrop.y - canvas.height / 2,
          image.naturalWidth,
          image.naturalHeight
        );

        // Create a new canvas to apply filters
        const filteredCanvas = document.createElement('canvas');
        const filteredCtx = filteredCanvas.getContext('2d');
        
        if (!filteredCtx) {
          reject(new Error('No 2d context for filtered canvas'));
          return;
        }

        // Set filtered canvas to same size as original
        filteredCanvas.width = canvas.width;
        filteredCanvas.height = canvas.height;
        
        // Apply filters to the cropped image
        filteredCtx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%)`;
        filteredCtx.drawImage(canvas, 0, 0);

        // Convert to blob
        filteredCanvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty - failed to create blob'));
            return;
          }
          resolve(blob);
        }, 'image/jpeg', 0.92);
      };
      
      image.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    });
  };

  // Handle save from editor
  const handleSave = async () => {
    if (!editorFile || !croppedAreaPixels) return;

    try {
      // Create a temporary URL for the image file
      const imageUrl = URL.createObjectURL(editorFile);
      
      // Get the cropped and filtered image as a blob
      const croppedImageBlob = await getCroppedImage(imageUrl, croppedAreaPixels, rotation);
      
      // Convert blob to file
      const editedFile = new File([croppedImageBlob], editorFile.name, { 
        type: editorFile.type 
      });
      
      // Pass to existing upload function
      await handleAddPhoto(editedFile);
      
      // Close editor and reset
      setEditorOpen(false);
      setEditorFile(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setFilters({
        brightness: 100,
        contrast: 100,
        grayscale: 0,
        sepia: 0,
      });
      setAspect(undefined);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image: ' + error.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle cancel from editor
  const handleCancel = () => {
    setEditorOpen(false);
    setEditorFile(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFilters({
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      sepia: 0,
    });
    setAspect(undefined);
  };

  return (
    <div>
      {/* Main Gallery Component */}
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

      {/* Image Editor Modal */}
      <AnimatePresence>
        {editorOpen && (
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
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-white/20 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
              {/* Editor Header */}
              <div className="flex justify-between items-center p-4 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">Edit Image</h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Editor Content */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Preview Area */}
                <div className="flex-1 flex flex-col p-4">
                  <div className="relative w-full h-80 md:h-96 bg-gray-900 rounded-xl overflow-hidden">
                    {previewUrl && (
                      <Cropper
                        image={previewUrl}
                        crop={crop}
                        rotation={rotation}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onRotationChange={setRotation}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        style={{
                          containerStyle: { width: '100%', height: '100%' }
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Controls */}
                  <div className="mt-4 space-y-4">
                    {/* Rotation Controls */}
                    <div className="flex items-center gap-3">
                      <label className="text-white w-24">Rotation</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRotation(r => r - 90)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={rotation}
                          onChange={(e) => setRotation(Number(e.target.value))}
                          className="flex-1"
                        />
                        <button
                          onClick={() => setRotation(r => r + 90)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Zoom Control */}
                    <div className="flex items-center gap-3">
                      <label className="text-white w-24">Zoom</label>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                    
                    {/* Aspect Ratio */}
                    <div className="flex items-center gap-3">
                      <label className="text-white w-24">Aspect</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAspect(undefined)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            aspect === undefined
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Free
                        </button>
                        <button
                          onClick={() => setAspect(1)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            aspect === 1
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          1:1
                        </button>
                        
                      </div>
                    </div>
                    
                    {/* Filters */}
                    <div className="space-y-3">
                      <h4 className="text-white font-medium">Filters</h4>
                      
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <label className="text-white w-24 text-sm">Brightness</label>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={filters.brightness}
                            onChange={(e) => setFilters(prev => ({ ...prev, brightness: Number(e.target.value) }))}
                            className="flex-1"
                          />
                          <span className="text-gray-400 text-sm w-12">{filters.brightness}%</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <label className="text-white w-24 text-sm">Contrast</label>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={filters.contrast}
                            onChange={(e) => setFilters(prev => ({ ...prev, contrast: Number(e.target.value) }))}
                            className="flex-1"
                          />
                          <span className="text-gray-400 text-sm w-12">{filters.contrast}%</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <label className="text-white w-24 text-sm">Grayscale</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.grayscale}
                            onChange={(e) => setFilters(prev => ({ ...prev, grayscale: Number(e.target.value) }))}
                            className="flex-1"
                          />
                          <span className="text-gray-400 text-sm w-12">{filters.grayscale}%</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <label className="text-white w-24 text-sm">Sepia</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.sepia}
                            onChange={(e) => setFilters(prev => ({ ...prev, sepia: Number(e.target.value) }))}
                            className="flex-1"
                          />
                          <span className="text-gray-400 text-sm w-12">{filters.sepia}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Preview Panel */}
                <div className="w-full md:w-80 p-4 bg-gray-900/50 border-l border-white/10">
                  <h4 className="text-white font-medium mb-4">Preview</h4>
                  <div className="relative w-full h-48 bg-gray-800 rounded-xl overflow-hidden">
                    {previewUrl && (
                      // <Image
                      // src={previewUrl}
                      // alt="Preview"
                      //   fill
                      //   className="object-contain"
                      //   style={{
                      //     filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) rotate(${rotation}deg)`,
                      //     transform: `scale(${zoom})`
                      //   }}
                      // />
                      <canvas
                        ref={previewRef}
                        className="w-full h-full rounded-xl"
                      />
                    )}
                  </div>
                  
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      <XIcon className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
