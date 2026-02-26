'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface AuthPillarProps {
  className?: string;
}

const sparklePositions = [
  { left: '8%', top: '12%', color: 'purple' },
  { left: '22%', top: '38%', color: 'pink' },
  { left: '35%', top: '22%', color: 'purple' },
  { left: '48%', top: '58%', color: 'pink' },
  { left: '62%', top: '15%', color: 'purple' },
  { left: '75%', top: '42%', color: 'pink' },
  { left: '88%', top: '28%', color: 'purple' },
  { left: '12%', top: '72%', color: 'pink' },
  { left: '28%', top: '85%', color: 'purple' },
  { left: '45%', top: '78%', color: 'pink' },
  { left: '58%', top: '92%', color: 'purple' },
  { left: '72%', top: '68%', color: 'pink' },
  { left: '85%', top: '88%', color: 'purple' },
  { left: '5%', top: '92%', color: 'pink' },
  { left: '92%', top: '65%', color: 'purple' },
];

export default function AuthPillar({ className = '' }: AuthPillarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`fixed inset-0 overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-[#0a0a0f]" />
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-[#0a0a0f]" />

      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(88, 28, 135, 0.4), transparent)',
        }}
      />

      <motion.div
        className="absolute left-1/2 top-0 bottom-0 w-[400px] -translate-x-1/2"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(139, 92, 246, 0.08) 30%, rgba(168, 85, 247, 0.12) 50%, rgba(139, 92, 246, 0.08) 70%, transparent 100%)',
            filter: 'blur(30px)',
          }}
        />
        
        <div 
          className="absolute left-1/2 top-0 bottom-0 w-20 -translate-x-1/2"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(196, 181, 253, 0.15) 40%, rgba(216, 180, 254, 0.2) 50%, rgba(196, 181, 253, 0.15) 60%, transparent 100%)',
            filter: 'blur(15px)',
          }}
        />

        <div 
          className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(232, 121, 249, 0.3) 40%, rgba(217, 70, 239, 0.4) 50%, rgba(232, 121, 249, 0.3) 60%, transparent 100%)',
            filter: 'blur(4px)',
          }}
        />
      </motion.div>

      <motion.div
        className="absolute left-[25%] top-0 bottom-0 w-[200px]"
        animate={{
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(99, 102, 241, 0.06) 50%, transparent 100%)',
            filter: 'blur(20px)',
          }}
        />
      </motion.div>

      <motion.div
        className="absolute right-[20%] top-0 bottom-0 w-[250px]"
        animate={{
          opacity: [0.08, 0.18, 0.08],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(236, 72, 153, 0.05) 50%, transparent 100%)',
            filter: 'blur(25px)',
          }}
        />
      </motion.div>

      {sparklePositions.map((sparkle, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            background: sparkle.color === 'purple' ? 'rgba(196, 181, 253, 0.6)' : 'rgba(232, 121, 249, 0.6)',
            boxShadow: sparkle.color === 'purple' 
              ? '0 0 4px rgba(196, 181, 253, 0.4)'
              : '0 0 4px rgba(232, 121, 249, 0.4)',
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.4,
            ease: 'easeOut',
          }}
        />
      ))}

      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
