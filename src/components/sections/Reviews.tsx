import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Review } from '../../types';
import { Section, SectionHeader, Card, StarRating } from '../ui';

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const nextReview = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  if (loading) {
    return (
      <Section id="reviews" background="gradient">
        <SectionHeader
          eyebrow="Testimonials"
          title="What Our Clients Say"
          subtitle="Real reviews from satisfied customers"
        />
        <div className="animate-pulse space-y-8">
          <div className="h-48 bg-zinc-800 rounded-xl" />
        </div>
      </Section>
    );
  }

  return (
    <Section id="reviews" background="gradient">
      <SectionHeader
        eyebrow="Testimonials"
        title="What Our Clients Say"
        subtitle="Real reviews from satisfied customers"
      />

      {/* Rating Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="text-5xl font-bold text-white">{averageRating.toFixed(1)}</div>
          <div className="text-left">
            <StarRating rating={averageRating} size="lg" showNumber={false} />
            <p className="text-gray-400 text-sm mt-1">{reviews.length} reviews</p>
          </div>
        </div>
      </motion.div>

      {reviews.length > 0 && (
        <div className="max-w-4xl mx-auto">
          {/* Review Slider */}
          <div className="relative">
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <Card glass className="p-8 md:p-12 relative">
                    <Quote className="absolute top-6 left-6 w-10 h-10 text-amber-500/20" />

                    {reviews[currentIndex].customer_photo_url && (
                      <img
                        src={reviews[currentIndex].customer_photo_url}
                        alt={reviews[currentIndex].customer_name}
                        className="w-16 h-16 rounded-full object-cover mx-auto mb-4"
                      />
                    )}

                    <p className="text-lg md:text-xl text-gray-300 mb-6 italic">
                      "{reviews[currentIndex].comment}"
                    </p>

                    <div className="mb-4">
                      <StarRating rating={reviews[currentIndex].rating} size="md" showNumber={false} />
                    </div>

                    <h4 className="text-lg font-semibold text-white">
                      {reviews[currentIndex].customer_name}
                    </h4>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex justify-center items-center gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevReview}
                className="p-3 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="flex gap-2">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-amber-500'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextReview}
                className="p-3 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Review Grid (for larger view) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
            {reviews.slice(0, 3).map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="hidden md:block"
              >
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {review.customer_photo_url && (
                      <img
                        src={review.customer_photo_url}
                        alt={review.customer_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h5 className="font-medium text-white text-sm">{review.customer_name}</h5>
                      <StarRating rating={review.rating} size="sm" showNumber={false} />
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-3">{review.comment}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
