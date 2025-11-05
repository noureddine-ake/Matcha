import { Menu, Users } from "lucide-react";
import { motion } from 'framer-motion';


interface ChatEmptyStateProps {
  isMobile: boolean;
  sidebarOpen: boolean;
  currentUserId: string;
  onOpenSidebar: () => void;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  isMobile,
  sidebarOpen,
  currentUserId,
  onOpenSidebar,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-white p-6">
      <Users className="w-20 h-20 md:w-24 md:h-24 mb-6 opacity-50" />
      <h3 className="text-xl md:text-2xl font-bold mb-2 text-center">Select a conversation</h3>
      <p className="text-white/60 text-center mb-6 px-4">
        {isMobile ? 'Tap the menu icon to browse users' : 'Choose a user from the sidebar to start chatting'}
      </p>
      {isMobile && !sidebarOpen && (
        <motion.button
          onClick={onOpenSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg flex items-center gap-2"
        >
          <Menu className="w-5 h-5" />
          Browse Users
        </motion.button>
      )}
      <div className="mt-4 text-sm text-white/40 text-center px-4">
        Current User ID: {currentUserId || "Loading..."}
      </div>
    </div>
  );
};
