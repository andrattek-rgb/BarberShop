import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, MessageCircle, Send } from 'lucide-react';
import { Section, SectionHeader, Card, Input, Button } from '../ui';
import { supabase } from '../../lib/supabase';
import type { ContactInfo, SocialLink, OpeningHour } from '../../types';
import { getDayName } from '../../lib/utils';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contactRes, socialRes, hoursRes] = await Promise.all([
        supabase.from('contact_info').select('*').single(),
        supabase.from('social_links').select('*').eq('is_visible', true).order('display_order'),
        supabase.from('opening_hours').select('*').order('day_of_week'),
      ]);

      if (contactRes.data) setContactInfo(contactRes.data);
      if (socialRes.data) setSocialLinks(socialRes.data);
      if (hoursRes.data) setOpeningHours(hoursRes.data);
    } catch (error) {
      console.error('Error loading contact data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const currentDay = new Date().getDay();
  const todayIndex = currentDay === 0 ? 6 : currentDay - 1;

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-5 h-5" />;
      case 'facebook':
        return <Facebook className="w-5 h-5" />;
      case 'whatsapp':
        return <MessageCircle className="w-5 h-5" />;
      default:
        return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getSocialColor = (platform: string): string => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'bg-gradient-to-br from-purple-600 to-pink-500';
      case 'facebook':
        return 'bg-blue-600';
      case 'whatsapp':
        return 'bg-green-500';
      case 'tiktok':
        return 'bg-black border border-white/10';
      default:
        return 'bg-zinc-700';
    }
  };

  if (loading) {
    return (
      <Section id="contact">
        <SectionHeader
          eyebrow="Get In Touch"
          title="Contact Us"
          subtitle="We'd love to hear from you. Reach out anytime."
        />
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-zinc-800 rounded-xl" />
          <div className="h-96 bg-zinc-800 rounded-xl" />
        </div>
      </Section>
    );
  }

  return (
    <Section id="contact">
      <SectionHeader
        eyebrow="Get In Touch"
        title="Contact Us"
        subtitle="We'd love to hear from you. Reach out anytime."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Contact Info & Map */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          {/* Map */}
          <Card className="overflow-hidden">
            <iframe
              src={contactInfo?.google_maps_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3615.0028971598846!2d-57.7058!3d45.0382!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDAyJzE3LjUiTiA1N8KwNDInMjEuMCJX!5e0!3m2!1sen!2sus!4v1!5m2!1sen!2sus"}
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
              title="Location"
            />
          </Card>

          {/* Contact Details */}
          <Card className="p-6 space-y-6">
            {/* Address */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Address</h4>
                <p className="text-gray-400">{contactInfo?.address_line1}</p>
                <p className="text-gray-400">{contactInfo?.address_line2}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Phone</h4>
                <a href={`tel:${contactInfo?.phone}`} className="text-gray-400 hover:text-amber-500 transition-colors">
                  {contactInfo?.phone}
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Email</h4>
                <a href={`mailto:${contactInfo?.email}`} className="text-gray-400 hover:text-amber-500 transition-colors">
                  {contactInfo?.email}
                </a>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-grow">
                <h4 className="font-medium text-white mb-2">Opening Hours</h4>
                <div className="space-y-1">
                  {openingHours.map((hours) => (
                    <div key={hours.id} className="flex justify-between text-sm">
                      <span className={hours.day_of_week === todayIndex ? 'text-amber-500 font-medium' : 'text-gray-400'}>
                        {getDayName(hours.day_of_week)}
                      </span>
                      <span className={hours.is_closed ? 'text-red-400' : 'text-gray-300'}>
                        {hours.is_closed ? 'Closed' : hours.open_time && hours.close_time ? `${formatTime(hours.open_time)} - ${formatTime(hours.close_time)}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Social Links */}
          <Card className="p-6">
            <h4 className="font-medium text-white mb-4">Follow Us</h4>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-12 h-12 rounded-lg ${getSocialColor(social.platform)} flex items-center justify-center text-white hover:opacity-80 transition-opacity`}
                >
                  {getSocialIcon(social.platform)}
                </motion.a>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-6 lg:p-8">
            <h3 className="text-xl font-bold text-white mb-6">Send us a Message</h3>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Message Sent!</h4>
                <p className="text-gray-400 mb-4">We'll get back to you as soon as possible.</p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Your Name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="Email Address"
                  placeholder="john@example.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
                <Input
                  label="Phone Number (Optional)"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Message</label>
                  <textarea
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={5}
                    required
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-200 resize-none"
                  />
                </div>
                <Button size="lg" className="w-full" type="submit" isLoading={submitting}>
                  Send Message
                </Button>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </Section>
  );
}
