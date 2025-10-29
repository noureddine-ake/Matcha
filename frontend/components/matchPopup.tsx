'use client';
import { motion, AnimatePresence } from 'framer-motion';

export interface MatchData {
  id: number;
  username: string;
//   first_name: string;
//   last_name: string;
}

interface Props {
  matchData: MatchData | null;
  setMatchData: (data: null) => void;
}

const MatchPopup = ({ matchData, setMatchData }: Props) => {
  if (!matchData) return null;

  const handleSendMessage = () => {
    window.location.href = `/chat/${matchData.id}`;
  };

  return (
    <AnimatePresence>
      {matchData && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotate: 15 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed inset-0 flex items-center justify-center z-50"
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Card */}
          <motion.div
            className="relative bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl shadow-2xl text-white p-8 flex flex-col items-center gap-4 max-w-xs mx-auto"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <h2 className="text-3xl font-extrabold">{`💖 It's a Match! 💖`}</h2>
            <p className="text-center text-lg">
              You and{' '}
              <span className="font-semibold">
                {matchData.username}
              </span>{' '}
              liked each other
            </p>

            <button
              onClick={handleSendMessage}
              className="px-6 py-2 bg-white text-purple-600 font-bold rounded-full hover:bg-white/90 transition"
            >
              Send Message
            </button>
            <button
              onClick={() => setMatchData(null)}
              className="text-white/70 hover:text-white mt-2 transition"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchPopup;
