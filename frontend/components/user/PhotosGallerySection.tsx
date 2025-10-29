// ✅ ENHANCED: Photos Gallery — fully responsive fluid grid
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Camera } from "lucide-react";
import { Photo } from "@/types/profile";


const PhotosGallerySection = ({ photos, backendUrl }: { photos: Photo[]; backendUrl: string }) => {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Camera className="w-6 h-6 text-purple-400" />
          Photos
        </h2>
  
        {photos.length > 0 ? (
          <motion.div 
            layout 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4  gap-4"
          >
            <AnimatePresence>
              {photos.map((photo: Photo, index: number) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.05,
                  }}
                  whileHover={{ y: -4 }}
                  className="group relative"
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
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                    {photo.is_profile_picture && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-1 right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-semibold border border-white/20 shadow"
                      >
                        Profile
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No photos yet</p>
          </motion.div>
        )}
      </motion.div>
    );
  };
  
export default PhotosGallerySection;