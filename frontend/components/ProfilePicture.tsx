// ```jsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Camera, Trash2, Upload, X, Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import api from '@/lib/api';
import { useGlobal } from '@/contexts/globalcontext';

interface Photo {
  photo_url: string;
  is_profile_picture: boolean;
}

interface ProfilePictureUploaderProps {
  photos: Photo[];
  backendUrl: string;
  size?: number;
  onUpdated?: () => void;
}

const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
  photos,
  backendUrl,
  size = 192,
  onUpdated,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {fetchProfile } = useGlobal()

  
  const profilePhoto = photos.find((p) => p.is_profile_picture);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (!file.type.match('image.*')) {
      setMessage('⚠️ Please select an image file');
      return;
    }
    
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setMessage('');
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!preview) return;
    setIsDraggingImage(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingImage || !preview) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDraggingImage(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!preview) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 3));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('⚠️ Please select a file first.');
      return;
    }
    
    setIsUploading(true);
    setMessage('');
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      const res = await api.put('profile/update-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Refresh user profile after upload
        await fetchProfile();
    

      setMessage(`✅ ${res.data.message}`);
      setPreview(null);
      setSelectedFile(null);
      onUpdated?.()
    } catch (err: unknown) {
      console.error(err);
    
      if (err instanceof Error) {
        setMessage(err.message || '❌ Upload failed');
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        // @ts-expect-error: for axios error typing
        setMessage(err.response?.data?.error || '❌ Upload failed');
      } else {
        setMessage('❌ Upload failed');
      }
    }
    finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setMessage('');
    
    try {
      const res = await api.delete('profile/delete-profile-picture');
        // Refresh user profile after deletion
        await fetchProfile();
      setMessage(`✅ ${res.data.message}`);
      onUpdated?.();
    } catch (err: unknown) {
      console.error(err);
    
      if (err instanceof Error) {
        setMessage(err.message || '❌ Deletion failed');
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        // @ts-expect-error: axios error type
        setMessage(err.response?.data?.error || '❌ Deletion failed');
      } else {
        setMessage('❌ Deletion failed');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const resetPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setMessage('');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetTransform = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Profile Picture Container */}
      <div 
        ref={containerRef}
        className={`relative rounded-3xl overflow-hidden border-4 transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-blue-400 bg-blue-50 scale-[1.02]' 
            : 'border-transparent bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600'}
          shadow-xl hover:shadow-2xl hover:shadow-purple-500/30`}
        style={{ width: size, height: size }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {preview ? (
          <div 
            className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <div 
              className="absolute inset-0 transition-transform duration-300 ease-out"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center center'
              }}
            >
              <Image
                src={preview}
                alt="Preview"
                width={size}
                height={size}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Action Controls Overlay */}
            <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              {/* Reset Button */}
              <button
                onClick={resetPreview}
                className="w-8 h-8 flex items-center justify-center bg-red-500/80 backdrop-blur-sm rounded-full text-white hover:bg-red-600 transition-all duration-200 hover:scale-110 shadow-lg"
                aria-label="Cancel upload"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* Reset Transform Button */}
              <button
                onClick={resetTransform}
                className="w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-all duration-200 hover:scale-110 shadow-lg"
                aria-label="Reset position"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            
            {/* Zoom Controls */}
            <div className={`absolute bottom-3 right-3 flex gap-2 bg-black/50 backdrop-blur-sm rounded-xl p-1 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <button 
                onClick={() => setScale(prev => Math.min(prev + 0.2, 3))}
                className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all duration-200 hover:scale-110"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))}
                className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all duration-200 hover:scale-110"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
            
            {/* Position Controls */}
            <div className={`absolute bottom-3 left-3 flex gap-2 bg-black/50 backdrop-blur-sm rounded-xl p-1 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-white text-xs px-2 py-1 bg-black/30 rounded-lg">
                {Math.round(scale * 100)}%
              </span>
            </div>
          </div>
        ) : profilePhoto ? (
          <>
            <Image
              src={`${backendUrl}${profilePhoto.photo_url}`}
              alt="Profile"
              width={size}
              height={size}
              className="w-full h-full object-cover"
            />
            
            {/* Action Controls for existing profile photo */}
            <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center gap-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={triggerFileInput}
                className="w-12 h-12 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-all duration-200 hover:scale-110 shadow-lg"
                aria-label="Update profile picture"
              >
                <Upload className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-12 h-12 flex items-center justify-center bg-red-500/80 backdrop-blur-sm rounded-full text-white hover:bg-red-600 transition-all duration-200 hover:scale-110 shadow-lg disabled:opacity-50"
                aria-label="Delete profile picture"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
            <div className="flex flex-col items-center justify-center text-center p-4">
              <Camera className="w-12 h-12 text-white/70 mb-2" />
              <p className="text-white/70 text-sm">No profile picture</p>
            </div>
          </div>
        )}

        {/* Drag and drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-100/80 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-700 font-medium">Drop your image here</p>
            </div>
          </div>
        )}
      </div>

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        id="fileInput"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Upload Controls */}
      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        <button
          onClick={triggerFileInput}
          className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] font-medium"
          aria-label="Choose image"
        >
          <Upload className="w-5 h-5" />
          <span>Choose Image</span>
        </button>

        <div className="flex gap-3 w-full">
          <button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 font-medium ${
              isUploading || !selectedFile
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transform hover:scale-[1.02] active:scale-[0.98]'
            }`}
            aria-label="Upload profile picture"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{isUploading ? 'Uploading...' : 'Set as Profile'}</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting || !profilePhoto}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all duration-300 font-medium ${
              isDeleting || !profilePhoto
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white transform hover:scale-[1.02] active:scale-[0.98]'
            }`}
            aria-label="Delete profile picture"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{isDeleting ? 'Deleting...' : 'Remove'}</span>
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mt-3 p-3 rounded-lg w-full text-center text-sm font-medium ${
            message.startsWith('✅') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Instructions */}
        <p className="text-xs text-gray-500 text-center mt-2">
          Drag & drop an image here or click to browse • JPG, PNG, WEBP
        </p>
      </div>
    </div>
  );
};

export default ProfilePictureUploader;
// ```