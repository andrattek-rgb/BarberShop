import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import type { Barber } from '../../types';
import { Section, SectionHeader, Card, StarRating } from '../ui';

export function Team() {
  const [barbers, setBarbers] = useState<Barber[]>([]);

  useEffect(() => {
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      setBarbers(data || []);
    } catch (error) {
      console.error('Error loading barbers:', error);
    }
  };

  const scrollToBooking = () => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Section id="team" background="gradient">
      <SectionHeader
        eyebrow="Meet Our Team"
        title="Master Barbers"
        subtitle="Experienced craftsmen dedicated to perfecting your style"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {barbers.map((barber, index) => (
          <motion.div
            key={barber.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card hover glass className="relative overflow-hidden group">
              {/* Photo */}
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={barber.photo_url || 'https://images.pexels.com/photo-2379005/pexels-photo-2379005.jpeg?w=400&h=500&fit=crop'}
                  alt={barber.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {/* Rating badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-sm mb-3"
                >
                  <StarRating rating={barber.rating} size="sm" showNumber />
                  <span className="text-xs text-gray-400 ml-1">
                    ({barber.review_count})
                  </span>
                </motion.div>

                <h3 className="text-xl font-bold text-white mb-1">{barber.name}</h3>
                <p className="text-amber-500 text-sm font-medium mb-3">
                  {barber.experience_years}+ years experience
                </p>

                {barber.bio && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {barber.bio}
                  </p>
                )}

                {/* Specialties */}
                {barber.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {barber.specialties.slice(0, 3).map((specialty) => (
                      <span
                        key={specialty}
                        className="px-2 py-0.5 text-xs rounded bg-white/5 text-gray-300"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      localStorage.setItem('selectedBarber', barber.id);
                      scrollToBooking();
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
                  >
                    Book
                  </motion.button>
                  {barber.instagram_url && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={barber.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <Instagram className="w-5 h-5 text-white" />
                    </motion.a>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
