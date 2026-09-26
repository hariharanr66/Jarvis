import React from 'react';
import { motion } from 'framer-motion';

interface JarvisOrbProps {
  state?: 'idle' | 'thinking' | 'speaking' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const JarvisOrb: React.FC<JarvisOrbProps> = ({
  state = 'idle',
  size = 'md',
  className = '',
  onClick
}) => {
  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-44 h-44 sm:w-52 sm:h-52'
  };

  const coreSizeMap = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-24 h-24 sm:w-28 sm:h-28'
  };

  const isThinking = state === 'thinking';
  const isOffline = state === 'offline';

  return (
    <div 
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none ${sizeMap[size]} ${className}`}
    >
      {/* Outer Glow Aura */}
      <motion.div
        animate={{
          scale: isThinking ? [1, 1.25, 1] : [1, 1.1, 1],
          opacity: isThinking ? [0.6, 0.9, 0.6] : [0.35, 0.5, 0.35]
        }}
        transition={{
          duration: isThinking ? 1.5 : 3.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute inset-0 rounded-full blur-2xl ${
          isOffline 
            ? 'bg-rose-900/30' 
            : isThinking 
              ? 'bg-gradient-to-tr from-cyan-500/60 via-purple-600/60 to-blue-500/60' 
              : 'bg-gradient-to-tr from-cyan-500/40 via-blue-600/30 to-indigo-500/40'
        }`}
      />

      {/* Rotating Ring 1 */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: isThinking ? 8 : 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-cyan-400/20 border-t-cyan-400/60 border-r-purple-500/50"
      />

      {/* Rotating Ring 2 (Counter direction) */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: isThinking ? 6 : 16, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2 rounded-full border border-purple-400/20 border-b-cyan-400/50 border-l-blue-400/60"
      />

      {/* Pulsing Concentric Ring */}
      <motion.div
        animate={{
          scale: isThinking ? [0.8, 1.15, 0.8] : [0.9, 1.05, 0.9],
          opacity: [0.2, 0.6, 0.2]
        }}
        transition={{
          duration: isThinking ? 1.2 : 2.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-4 rounded-full border border-cyan-300/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
      />

      {/* Core Glowing Sphere */}
      <motion.div
        animate={{
          scale: isThinking ? [0.9, 1.08, 0.9] : [0.95, 1.02, 0.95]
        }}
        transition={{
          duration: isThinking ? 0.8 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`relative ${coreSizeMap[size]} rounded-full flex items-center justify-center shadow-[0_0_35px_rgba(0,240,255,0.6)] ${
          isOffline
            ? 'bg-gradient-to-tr from-gray-900 via-rose-950 to-gray-800 border border-rose-500/40'
            : 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 border border-cyan-300/60'
        }`}
      >
        {/* Inner Core Highlight */}
        <div className="w-1/2 h-1/2 rounded-full bg-white/40 blur-xs backdrop-blur-sm shadow-inner" />
        
        {/* State Particle Effect when Thinking */}
        {isThinking && (
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-white/80"
          />
        )}
      </motion.div>
    </div>
  );
};
