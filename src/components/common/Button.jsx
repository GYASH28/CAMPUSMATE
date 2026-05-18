import { motion } from 'framer-motion';

const variants = {
  primary:
    'bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 text-white shadow-glow hover:brightness-110',
  secondary:
    'border border-white/10 bg-white/10 text-white hover:border-cyan-300/40 hover:bg-white/15 hover:shadow-glow',
  ghost: 'text-slate-200 hover:bg-white/10 hover:text-white',
  danger:
    'border border-rose-300/25 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25',
  success:
    'border border-emerald-300/25 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25',
  dark: 'border border-white/10 bg-slate-950/70 text-white hover:border-white/20 hover:bg-slate-900/90',
};

const sizes = {
  sm: 'min-h-9 px-3 py-2 text-xs',
  md: 'min-h-11 px-4 py-2.5 text-sm',
  lg: 'min-h-12 px-5 py-3 text-base',
};

export default function Button({
  as,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}) {
  const Component = as || motion.button;
  const isMotionButton = Component === motion.button;
  const motionProps =
    isMotionButton
      ? {
          whileTap: disabled ? undefined : { scale: 0.98 },
          whileHover: disabled ? undefined : { y: -2, scale: 1.01 },
          transition: { type: 'spring', stiffness: 420, damping: 28 },
        }
      : {};
  const disabledProps = isMotionButton ? { disabled } : {};

  return (
    <Component
      className={`inline-flex touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold transition focus:outline-none focus:ring-4 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      aria-disabled={disabled || undefined}
      {...disabledProps}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
}
