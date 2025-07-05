import React from 'react';
import { motion } from 'framer-motion';
import './VoiceWaveform.css';

const VoiceWaveform = ({ isActive = false, bars = 5 }) => {
  return (
    <div className={`voice-waveform ${isActive ? 'active' : ''}`}>
      {Array.from({ length: bars }).map((_, index) => (
        <motion.div
          key={index}
          className="waveform-bar"
          animate={isActive ? {
            scaleY: [0.2, 1, 0.2],
            opacity: [0.3, 1, 0.3]
          } : {
            scaleY: 0.2,
            opacity: 0.3
          }}
          transition={{
            duration: 0.6,
            repeat: isActive ? Infinity : 0,
            delay: index * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
      {isActive && (
        <motion.div
          className="voice-pulse"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  );
};

export default VoiceWaveform; 