import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  background?: 'dark' | 'darker' | 'gradient';
}

export function Section({ id, children, className, background = 'dark' }: SectionProps) {
  const backgrounds = {
    dark: 'bg-zinc-950',
    darker: 'bg-black',
    gradient: 'bg-gradient-to-b from-black via-zinc-950 to-black',
  };

  return (
    <section id={id} className={cn('py-20 lg:py-28', backgrounds[background], className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export function SectionHeader({ eyebrow, title, subtitle, centered = true }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={cn('mb-12 lg:mb-16', centered && 'text-center')}
    >
      {eyebrow && (
        <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
