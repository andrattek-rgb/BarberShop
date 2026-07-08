import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Section, SectionHeader } from '../ui';
import { supabase } from '../../lib/supabase';
import type { GalleryImage } from '../../types';

export function Gallery() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_visible', true)
        .order('display_order');

      if (error) throw error;
      setGalleryImages(data || []);
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(galleryImages.map(img => img.category))];

  const filteredImages = selectedCategory === 'All'
    ? galleryImages
    : galleryImages.filter(img => img.category === selectedCategory);

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxImage === null) return;
    const currentIndex = galleryImages.findIndex(img => img.id === lightboxImage);
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % galleryImages.length
      : (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    setLightboxImage(galleryImages[newIndex].id);
  };

  const currentImage = galleryImages.find(img => img.id === lightboxImage);

  if (loading) {
    return (
      <Section id="gallery">
        <SectionHeader
          eyebrow="Our Work"
          title="Style Gallery"
          subtitle="See the transformations and our premium grooming environment"
        />
        <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-48 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section id="gallery">
      <SectionHeader
        eyebrow="Our Work"
        title="Style Gallery"
        subtitle="See the transformations and our premium grooming environment"
      />

      {/* Category Filter */}
      <div className="-mx-4 mb-8 sm:mb-10 overflow-x-auto px-4 scrollbar-hide">
        <div className="flex w-max min-w-full justify-start sm:justify-center gap-2">
        {categories.map((category) => (
          <motion.button
            key={category}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCategory(category)}
            className={`flex-shrink-0 px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === category
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
            }`}
          >
            {category}
          </motion.button>
        ))}
        </div>
      </div>

      {/* Masonry Grid */}
      <motion.div layout className="columns-1 min-[420px]:columns-2 md:columns-3 lg:columns-4 gap-4">
        <AnimatePresence>
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="mb-4 break-inside-avoid"
            >
              <div
                className="relative overflow-hidden rounded-xl cursor-pointer group"
                onClick={() => setLightboxImage(image.id)}
              >
                <img
                  src={image.image_url}
                  alt={image.alt_text || ''}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                  <span className="inline-block px-3 py-1 rounded bg-amber-500 text-black text-xs font-semibold mb-2">
                    {image.category}
                  </span>
                  {image.alt_text && <p className="text-white text-sm">{image.alt_text}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/95 px-4"
            onClick={() => setLightboxImage(null)}
          >
            <button onClick={() => setLightboxImage(null)} className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 text-white hover:text-amber-500 transition-colors z-10">
              <X className="w-8 h-8" />
            </button>

            <button onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }} className="absolute left-1 sm:left-4 md:left-8 p-3 text-white hover:text-amber-500 transition-colors z-10">
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }} className="absolute right-1 sm:right-4 md:right-8 p-3 text-white hover:text-amber-500 transition-colors z-10">
              <ChevronRight className="w-8 h-8" />
            </button>

            <motion.img
              key={currentImage.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={currentImage.image_url.replace('w=600', 'w=1200')}
              alt={currentImage.alt_text || ''}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-6 sm:bottom-8 left-1/2 w-[calc(100%-2rem)] -translate-x-1/2 text-center">
              <span className="inline-block px-4 py-1.5 rounded bg-amber-500 text-black text-sm font-semibold mb-2">
                {currentImage.category}
              </span>
              {currentImage.alt_text && <p className="text-white">{currentImage.alt_text}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}
