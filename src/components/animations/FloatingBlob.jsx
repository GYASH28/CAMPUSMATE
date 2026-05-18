import { motion, useReducedMotion } from 'framer-motion';

export default function FloatingBlob({ className = '' }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      animate={
        reduceMotion
          ? undefined
          : {
              x: ['-4%', '4%', '-4%'],
              opacity: [0.5, 0.72, 0.5],
            }
      }
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      className={`pointer-events-none absolute h-64 w-[64rem] max-w-[120vw] rounded-[40%] bg-gradient-to-r from-cyan-400/10 via-blue-500/10 to-violet-500/10 blur-3xl ${className}`}
    />
  );
}
