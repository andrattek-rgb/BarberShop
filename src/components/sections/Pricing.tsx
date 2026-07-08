import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Service } from '../../types';
import { Section, SectionHeader, Card, Button } from '../ui';
import { cn } from '../../lib/utils';

export function Pricing() {
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

  const packageFeatures: Record<string, string[]> = {
    'Haircut': ['Professional consultation', 'Precision cutting', 'Styling & finish', 'Aftercare advice'],
    'Beard Trim': ['Beard shaping', 'Hot towel treatment', 'Scissors & clippers', 'Beard oil application'],
    'Hair + Beard': ['Complete grooming', 'Haircut & styling', 'Beard trim & shape', 'Hot towel treatment'],
    'Kids Cut': ['Patient, friendly service', 'Age-appropriate styles', 'Complimentary snack', 'Lollipop reward'],
    'VIP Package': ['Premium haircut', 'Beard styling', 'Facial treatment', 'Hot towel shave', 'Complimentary beverage', 'Extended consultation'],
  };

  if (loading) {
    return (
      <Section id="pricing">
        <SectionHeader
          eyebrow="Our Prices"
          title="Transparent Pricing"
          subtitle="Quality grooming at competitive prices"
        />
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section id="pricing">
      <SectionHeader
        eyebrow="Our Prices"
        title="Transparent Pricing"
        subtitle="Quality grooming at competitive prices"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {services.map((service, index) => {
          const features = packageFeatures[service.name] || [];
          const isPopular = service.is_popular;

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                hover
                className={cn(
                  'relative p-6 h-full flex flex-col',
                  isPopular && 'ring-2 ring-amber-500'
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-gray-400">{service.description}</p>
                  )}
                </div>

                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-white">${service.price.toFixed(2)}</span>
                  <p className="text-gray-500 text-sm mt-1">{service.duration_minutes} minutes</p>
                </div>

                {features.length > 0 && (
                  <ul className="space-y-3 mb-6 flex-grow">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  variant={isPopular ? 'primary' : 'secondary'}
                  onClick={scrollToBooking}
                  className="w-full mt-auto"
                >
                  Book Now
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-16"
      >
        <h3 className="text-xl font-semibold text-white text-center mb-6">Service Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Service</th>
                <th className="text-center py-4 px-4 text-gray-400 font-medium">Duration</th>
                <th className="text-center py-4 px-4 text-gray-400 font-medium">Price</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Book</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => (
                <motion.tr
                  key={service.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-white">{service.name}</span>
                      {service.is_popular && (
                        <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-500">
                          Popular
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center py-4 px-4 text-gray-300">{service.duration_minutes} min</td>
                  <td className="text-center py-4 px-4 text-white font-semibold">${service.price.toFixed(2)}</td>
                  <td className="text-right py-4 px-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={scrollToBooking}
                      className="px-4 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-sm font-medium hover:bg-amber-500/20 transition-colors"
                    >
                      Book
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </Section>
  );
}
