import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { PRODUCT_MESSAGE } from '../../utils/constants';

export default function ProductBanner({ compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-violet-500/15 p-[1px] shadow-glow"
    >
      <div className="flex items-start gap-3 rounded-3xl bg-slate-950/72 p-4 backdrop-blur-xl">
        <div className="rounded-2xl bg-cyan-300/15 p-3 text-cyan-200">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
            CampusMate
          </p>
          <p className={`mt-1 text-sm leading-6 text-slate-200 ${compact ? 'line-clamp-3' : ''}`}>
            {PRODUCT_MESSAGE}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
