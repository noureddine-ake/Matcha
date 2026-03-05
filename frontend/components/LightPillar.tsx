'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface LightPillarProps {
  className?: string;
}

const sparklePositions = [
  { left: '5%', top: '15%', color: 'purple' },
  { left: '15%', top: '45%', color: 'pink' },
  { left: '25%', top: '25%', color: 'purple' },
  { left: '35%', top: '65%', color: 'pink' },
  { left: '45%', top: '35%', color: 'purple' },
  { left: '55%', top: '75%', color: 'pink' },
  { left: '65%', top: '20%', color: 'purple' },
  { left: '75%', top: '55%', color: 'pink' },
  { left: '85%', top: '30%', color: 'purple' },
  { left: '95%', top: '80%', color: 'pink' },
  { left: '10%', top: '70%', color: 'pink' },
  { left: '20%', top: '90%', color: 'purple' },
  { left: '30%', top: '50%', color: 'pink' },
  { left: '40%', top: '85%', color: 'purple' },
  { left: '50%', top: '10%', color: 'pink' },
  { left: '60%', top: '60%', color: 'purple' },
  { left: '70%', top: '40%', color: 'pink' },
  { left: '80%', top: '95%', color: 'purple' },
  { left: '90%', top: '15%', color: 'pink' },
  { left: '3%', top: '95%', color: 'purple' },
];

export default function LightPillar({ className = '' }: LightPillarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>
        <div className="absolute inset-0 bg-[#030014]" />
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute inset-0 bg-[#030014]" />

      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent)',
        }}
      />

      <motion.div
        className="absolute left-1/2 top-0 bottom-0 w-125 -translate-x-1/2"
        animate={{
          opacity: [0.4, 0.6, 0.4],
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
            background: 'linear-gradient(to bottom, transparent 0%, rgba(139, 92, 246, 0.15) 20%, rgba(168, 85, 247, 0.25) 50%, rgba(139, 92, 246, 0.15) 80%, transparent 100%)',
            filter: 'blur(40px)',
          }}
        />
        
        <div 
          className="absolute left-1/2 top-0 bottom-0 w-32 -translate-x-1/2"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(196, 181, 253, 0.3) 30%, rgba(216, 180, 254, 0.4) 50%, rgba(196, 181, 253, 0.3) 70%, transparent 100%)',
            filter: 'blur(20px)',
          }}
        />

        <div 
          className="absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(232, 121, 249, 0.6) 30%, rgba(217, 70, 239, 0.8) 50%, rgba(232, 121, 249, 0.6) 70%, transparent 100%)',
            filter: 'blur(8px)',
          }}
        />
      </motion.div>

      <motion.div
        className="absolute left-[20%] top-0 bottom-0 w-75"
        animate={{
          opacity: [0.2, 0.35, 0.2],
          x: [0, 20, 0],
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
            background: 'linear-gradient(to bottom, transparent 0%, rgba(99, 102, 241, 0.1) 40%, rgba(129, 140, 248, 0.15) 60%, transparent 100%)',
            filter: 'blur(30px)',
          }}
        />
      </motion.div>

      <motion.div
        className="absolute right-[15%] top-0 bottom-0 w-87.5"
        animate={{
          opacity: [0.15, 0.3, 0.15],
          x: [0, -25, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(236, 72, 153, 0.1) 40%, rgba(244, 114, 182, 0.15) 60%, transparent 100%)',
            filter: 'blur(35px)',
          }}
        />
      </motion.div>

      {sparklePositions.map((sparkle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            background: sparkle.color === 'purple' ? 'rgba(196, 181, 253, 0.8)' : 'rgba(232, 121, 249, 0.8)',
            boxShadow: sparkle.color === 'purple' 
              ? '0 0 6px rgba(196, 181, 253, 0.6)'
              : '0 0 6px rgba(232, 121, 249, 0.6)',
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5],
            y: [0, -80],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.3,
            ease: 'easeOut',
          }}
        />
      ))}

      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}
