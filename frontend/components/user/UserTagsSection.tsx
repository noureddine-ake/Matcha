import { Hash } from "lucide-react";
import { motion } from "framer-motion";


const UserTagsSection = ({ tags }: { tags: any[] }) => {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Hash className="w-6 h-6 text-purple-400" />
          Interests
        </h2>
  
        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag: any) => (
              <motion.span
                key={tag.id}
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xs sm:text-sm font-medium border border-white/20 whitespace-nowrap"
              >
                {tag.name}
              </motion.span>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No interests added</p>
          )}
        </div>
      </motion.div>
    );
  };
export default UserTagsSection;