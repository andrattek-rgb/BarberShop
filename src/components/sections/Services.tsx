import { motion } from 'framer-motion';
import { Scissors, Sparkles, Crown, Smile, Gem, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import type { Service } from '../../types';
import { Section, SectionHeader, Card } from '../ui';
import { formatPrice } from '../../lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  scissors: Scissors,
  sparkles: Sparkles,
  crown: Crown,
  smile: Smile,
  gem: Gem,
};

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBooking = () => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Section id="services">
        <SectionHeader
          eyebrow="Our Services"
          title="Premium Grooming Services"
          subtitle="From classic cuts to modern styles, we offer everything you need for the perfect look"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-zinc-900/50 animate-pulse" />
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section id="services">
      <SectionHeader
        eyebrow="Our Services"
        title="Premium Grooming Services"
        subtitle="From classic cuts to modern styles, we offer everything you need for the perfect look"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => {
          const IconComponent = iconMap[service.icon_name || ''] || Scissors;

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hover className="group relative overflow-hidden">
                {service.is_popular && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-semibold">
                    Popular
                  </div>
                )}
                <div className="p-6 lg:p-8">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 group-hover:border-amber-500/30 flex items-center justify-center mb-6 transition-all duration-300">
                    <IconComponent className="w-7 h-7 text-amber-500" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>

                  {service.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{service.duration_minutes} min</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-bold text-white">
                        ${formatPrice(service.price)}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={scrollToBooking}
                      className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-500 font-medium text-sm hover:bg-amber-500/20 transition-colors"
                    >
                      Book Now
                    </motion.button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
