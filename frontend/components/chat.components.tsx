import React from 'react';
import { motion } from 'framer-motion';

interface ChatLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  isMobile: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({
  sidebar,
  content,
  isMobile,
  sidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <div className="h-full max-h-[calc(100%)] relative">
      <div className="flex h-full relative z-10">
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onToggleSidebar}
          />
        )}

        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{
            x: isMobile && !sidebarOpen ? '-100%' : 0
          }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className={`w-80 border-x border-white/20 flex-1 backdrop-blur-lg flex flex-col fixed md:relative z-40 h-full  ${isMobile ? 'shadow-2xl pt-[90px]' : ''
            }`}
          style={{
            height: isMobile ? '100vh' : '100%',
            top: isMobile ? 0 : 'auto'
          }}
        >
          {sidebar}
        </motion.div>

        {/* Main content */}
        <div className={`flex-1 border-x border-white/20 flex flex-col  relative w-full
          }`}>
          {content}
        </div>
      </div>
    </div>
  );
};