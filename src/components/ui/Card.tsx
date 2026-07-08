import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export function Card({ children, className, hover = false, glass = false }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'rounded-xl border border-white/5',
        glass
          ? 'bg-white/5 backdrop-blur-xl'
          : 'bg-zinc-900/50',
        hover && 'cursor-pointer hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
