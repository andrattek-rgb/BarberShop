import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ChevronDown, Scissors, Sparkles, Clock } from 'lucide-react';
import { Button } from '../ui';
import { supabase } from '../../lib/supabase';
import type { HeroContent } from '../../types';

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.9]);
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);

  useEffect(() => {
    loadHeroContent();
  }, []);

  const loadHeroContent = async () => {
    try {
      const { data, error } = await supabase.from('hero_content').select('*').single();
      if (!error && data) {
        setHeroContent(data);
      }
    } catch (error) {
      console.error('Error loading hero content:', error);
    }
  };

  const scrollToBooking = () => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={ref} className="relative min-h-[100svh] w-full overflow-hidden flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-black to-black" />
        {heroContent?.background_type === 'image' && heroContent.background_url && (
          <img src={heroContent.background_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        )}
        <motion.div
          style={{ y }}
          className="absolute inset-0 opacity-30"
        >
          <div className="absolute top-1/4 left-1/2 sm:left-1/4 h-72 w-72 sm:w-96 sm:h-96 -translate-x-1/2 sm:translate-x-0 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/2 sm:right-1/4 h-72 w-72 sm:w-96 sm:h-96 translate-x-1/2 sm:translate-x-0 bg-amber-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-[320px] h-[320px] sm:w-[600px] sm:h-[600px] -translate-x-1/2 -translate-y-1/2 bg-amber-500/5 rounded-full blur-3xl" />
        </motion.div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTAgMGg2MHY2MEgwem01MCAwaDEwdjEwSDUwek0wIDUwaDEwdjEwSDB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
      </div>

      {/* Content */}
      <motion.div
        style={{ opacity, scale }}
        className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 text-center pt-20 sm:pt-24"
      >
        {/* Glassmorphism badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block max-w-full mb-6 sm:mb-8"
        >
          <div className="px-4 sm:px-6 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-amber-500 text-xs sm:text-sm font-semibold tracking-wider">
            {heroContent?.badge_text || 'Premium Grooming Experience'}
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-5 sm:mb-6 leading-tight"
        >
          {heroContent?.headline?.split(' ').slice(0, 2).join(' ') || 'Your Style'}
          <br />
          <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
            {heroContent?.headline?.split(' ').slice(2).join(' ') || 'Starts Here'}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-base sm:text-xl lg:text-2xl text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto"
        >
          {heroContent?.subtitle || 'Book your appointment in seconds with the city\'s most trusted barbers.'}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-16"
        >
          <Button size="lg" onClick={scrollToBooking} className="w-full sm:w-auto">
            {heroContent?.primary_cta_text || 'Book Appointment'}
          </Button>
          <Button size="lg" variant="outline" onClick={scrollToServices} className="w-full sm:w-auto">
            {heroContent?.secondary_cta_text || 'View Services'}
          </Button>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6"
        >
          {[
            { icon: Scissors, title: 'Expert Barbers', desc: 'Master craftsmen with years of experience' },
            { icon: Sparkles, title: 'Premium Service', desc: 'Luxury grooming experience guaranteed' },
            { icon: Clock, title: 'Easy Booking', desc: 'Schedule in seconds, arrive anytime' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 + i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-amber-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center mb-4 mx-auto transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="cursor-pointer"
          onClick={scrollToServices}
        >
          <ChevronDown className="w-8 h-8 text-amber-500" />
        </motion.div>
      </motion.div>
    </section>
  );
}
