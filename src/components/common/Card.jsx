import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  interactive = false,
  delay = 0,
  tone = 'default',
}) {
  const toneClass =
    tone === 'highlight'
      ? 'border-cyan-300/20 bg-cyan-300/[0.08]'
      : tone === 'violet'
        ? 'border-violet-300/20 bg-violet-300/[0.08]'
        : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay }}
      whileHover={interactive ? { y: -5, scale: 1.01 } : undefined}
      className={`glass-card rounded-3xl p-5 ${
        interactive ? 'premium-card-hover' : ''
      } ${toneClass} ${className}`}
    >
      {children}
    </motion.div>
  );
}
