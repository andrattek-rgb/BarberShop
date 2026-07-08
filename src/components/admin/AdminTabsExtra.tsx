import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { OpeningHour, HeroContent, ContactInfo, SocialLink, SiteSetting, BlockedDate } from '../../types';
import { getDayName } from '../../lib/utils';
import { Button, Card, Input } from '../ui';
import { Trash2, Save, MapPin, Phone, Mail, Globe } from 'lucide-react';

// Toast context from parent
const ToastContext = React.createContext<{
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}>({ showToast: () => {} });

// Opening Hours Tab
export function HoursTab() {
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadHours(); }, []);

  const loadHours = async () => {
    try {
      const { data, error } = await supabase.from('opening_hours').select('*').order('day_of_week');
      if (error) throw error;
      setHours(data || []);
    } catch (error) {
      showToast('Failed to load hours', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateHours = async (id: string, updates: Partial<OpeningHour>) => {
    setSaving(id);
    try {
      const { error } = await supabase.from('opening_hours').update(updates).eq('id', id);
      if (error) throw error;
      await loadHours();
      showToast('Hours updated', 'success');
    } catch (error) {
      showToast('Failed to update hours', 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Opening Hours</h2>

      <Card className="overflow-hidden">
        <div className="divide-y divide-white/5">
          {hours.map((hour) => (
            <div key={hour.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-4">
                <span className="text-white font-medium w-28">{getDayName(hour.day_of_week)}</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hour.is_closed}
                    onChange={(e) => updateHours(hour.id, { is_closed: e.target.checked, open_time: null, close_time: null })}
                    className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-amber-500"
                  />
                  <span className="text-gray-400 text-sm">Closed</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                {!hour.is_closed && (
                  <>
                    <input
                      type="time"
                      value={hour.open_time || ''}
                      onChange={(e) => updateHours(hour.id, { open_time: e.target.value })}
                      disabled={saving === hour.id}
                      className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={hour.close_time || ''}
                      onChange={(e) => updateHours(hour.id, { close_time: e.target.value })}
                      disabled={saving === hour.id}
                      className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </>
                )}
                {saving === hour.id && <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

// Blocked Dates Tab
export function BlockedDatesTab() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [blockedRes, barbersRes] = await Promise.all([
        supabase.from('blocked_dates').select('*').order('blocked_date'),
        supabase.from('barbers').select('id, name'),
      ]);
      setBlockedDates(blockedRes.data || []);
      setBarbers(barbersRes.data || []);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteBlockedDate = async (id: string) => {
    try {
      await supabase.from('blocked_dates').delete().eq('id', id);
      loadData();
      showToast('Block removed', 'success');
    } catch (error) {
      showToast('Failed to remove block', 'error');
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Blocked Dates</h2>

      <Card className="p-6">
        <div className="space-y-3">
          {blockedDates.map((block) => (
            <div key={block.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
              <div>
                <p className="text-white font-medium">{block.blocked_date}</p>
                <p className="text-sm text-gray-400">
                  {block.is_full_day ? 'Full day' : block.blocked_time}
                  {block.barber_id && ` - ${barbers.find(b => b.id === block.barber_id)?.name}`}
                  {block.reason && ` - ${block.reason}`}
                </p>
              </div>
              <button onClick={() => deleteBlockedDate(block.id)} className="p-2 hover:bg-red-500/20 rounded">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
          {blockedDates.length === 0 && (
            <p className="text-gray-400 text-center py-4">No blocked dates</p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Hero Section Tab
export function HeroTab() {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadHero(); }, []);

  const loadHero = async () => {
    try {
      const { data, error } = await supabase.from('hero_content').select('*').single();
      if (error) throw error;
      setHero(data);
    } catch (error) {
      showToast('Failed to load hero content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveHero = async () => {
    if (!hero) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('hero_content').update({
        headline: hero.headline,
        subtitle: hero.subtitle,
        badge_text: hero.badge_text,
        primary_cta_text: hero.primary_cta_text,
        secondary_cta_text: hero.secondary_cta_text,
        background_type: hero.background_type,
        background_url: hero.background_url,
        updated_at: new Date().toISOString(),
      }).eq('id', hero.id);
      if (error) throw error;
      showToast('Hero content saved', 'success');
    } catch (error) {
      showToast('Failed to save hero content', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;
  if (!hero) return <div className="text-gray-400">No hero content found</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Hero Section</h2>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Badge Text"
              value={hero.badge_text || ''}
              onChange={(e) => setHero(prev => prev ? { ...prev, badge_text: e.target.value } : null)}
            />
            <Input
              label="Headline"
              value={hero.headline}
              onChange={(e) => setHero(prev => prev ? { ...prev, headline: e.target.value } : null)}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Subtitle</label>
              <textarea
                value={hero.subtitle}
                onChange={(e) => setHero(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
                rows={3}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white resize-none"
              />
            </div>
            <Input
              label="Primary CTA Button Text"
              value={hero.primary_cta_text}
              onChange={(e) => setHero(prev => prev ? { ...prev, primary_cta_text: e.target.value } : null)}
            />
            <Input
              label="Secondary CTA Button Text"
              value={hero.secondary_cta_text}
              onChange={(e) => setHero(prev => prev ? { ...prev, secondary_cta_text: e.target.value } : null)}
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Background Type</label>
              <select
                value={hero.background_type}
                onChange={(e) => setHero(prev => prev ? { ...prev, background_type: e.target.value as HeroContent['background_type'] } : null)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white"
              >
                <option value="gradient">Gradient</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            {hero.background_type !== 'gradient' && (
              <Input
                label="Background URL"
                value={hero.background_url || ''}
                onChange={(e) => setHero(prev => prev ? { ...prev, background_url: e.target.value } : null)}
                placeholder={hero.background_type === 'image' ? 'https://...' : 'https://...mp4'}
              />
            )}
            {hero.background_type === 'image' && hero.background_url && (
              <img src={hero.background_url} alt="Background preview" className="w-full h-40 object-cover rounded-lg" />
            )}
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={saveHero} isLoading={saving} className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// Contact Info Tab
export function ContactTab() {
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadContact(); }, []);

  const loadContact = async () => {
    try {
      const { data, error } = await supabase.from('contact_info').select('*').single();
      if (error) throw error;
      setContact(data);
    } catch (error) {
      showToast('Failed to load contact info', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveContact = async () => {
    if (!contact) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('contact_info').update({
        business_name: contact.business_name,
        phone: contact.phone,
        email: contact.email,
        whatsapp: contact.whatsapp,
        address_line1: contact.address_line1,
        address_line2: contact.address_line2,
        google_maps_url: contact.google_maps_url,
        emergency_contact: contact.emergency_contact,
        updated_at: new Date().toISOString(),
      }).eq('id', contact.id);
      if (error) throw error;
      showToast('Contact info saved', 'success');
    } catch (error) {
      showToast('Failed to save contact info', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Contact Information</h2>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Business Name" value={contact?.business_name || ''} onChange={(e) => setContact(prev => prev ? { ...prev, business_name: e.target.value } : null)} />
          <Input label="Phone" value={contact?.phone || ''} onChange={(e) => setContact(prev => prev ? { ...prev, phone: e.target.value } : null)} icon={<Phone className="w-5 h-5" />} />
          <Input label="Email" value={contact?.email || ''} onChange={(e) => setContact(prev => prev ? { ...prev, email: e.target.value } : null)} icon={<Mail className="w-5 h-5" />} />
          <Input label="WhatsApp" value={contact?.whatsapp || ''} onChange={(e) => setContact(prev => prev ? { ...prev, whatsapp: e.target.value } : null)} />
          <Input label="Address Line 1" value={contact?.address_line1 || ''} onChange={(e) => setContact(prev => prev ? { ...prev, address_line1: e.target.value } : null)} icon={<MapPin className="w-5 h-5" />} />
          <Input label="Address Line 2" value={contact?.address_line2 || ''} onChange={(e) => setContact(prev => prev ? { ...prev, address_line2: e.target.value } : null)} />
          <Input label="Google Maps URL" value={contact?.google_maps_url || ''} onChange={(e) => setContact(prev => prev ? { ...prev, google_maps_url: e.target.value } : null)} icon={<Globe className="w-5 h-5" />} />
          <Input label="Emergency Contact" value={contact?.emergency_contact || ''} onChange={(e) => setContact(prev => prev ? { ...prev, emergency_contact: e.target.value } : null)} />
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={saveContact} isLoading={saving} className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// Social Links Tab
export function SocialTab() {
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadSocials(); }, []);

  const loadSocials = async () => {
    try {
      const { data, error } = await supabase.from('social_links').select('*').order('display_order');
      if (error) throw error;
      setSocials(data || []);
    } catch (error) {
      showToast('Failed to load social links', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateSocial = async (id: string, updates: Partial<SocialLink>) => {
    try {
      await supabase.from('social_links').update(updates).eq('id', id);
      loadSocials();
      showToast('Social link updated', 'success');
    } catch (error) {
      showToast('Failed to update', 'error');
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Social Media Links</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {socials.map((social) => (
          <Card key={social.id} className="p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium capitalize">{social.platform}</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={social.is_visible}
                    onChange={(e) => updateSocial(social.id, { is_visible: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-amber-500"
                  />
                  <span className="text-gray-400 text-sm">Visible</span>
                </label>
              </div>
              <Input
                placeholder="URL"
                value={social.url}
                onChange={(e) => updateSocial(social.id, { url: e.target.value })}
              />
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// Site Settings Tab
export function SettingsTab() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*').order('key');
      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (id: string, value: string) => {
    setSaving(id);
    try {
      await supabase.from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('id', id);
      showToast('Setting saved', 'success');
    } catch (error) {
      showToast('Failed to save setting', 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  const groupedSettings = {
    branding: settings.filter(s => ['logo_url', 'favicon_url', 'primary_color', 'secondary_color', 'accent_color'].includes(s.key)),
    seo: settings.filter(s => ['seo_title', 'seo_description', 'seo_keywords', 'og_image_url'].includes(s.key)),
    integration: settings.filter(s => ['analytics_code', 'meta_pixel'].includes(s.key)),
    content: settings.filter(s => ['footer_text'].includes(s.key)),
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Website Settings</h2>

      {/* Branding */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedSettings.branding.map((setting) => (
            <div key={setting.id} className="flex gap-2">
              <Input
                label={setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                value={setting.value || ''}
                onChange={(e) => {
                  setSettings(prev => prev.map(s => s.id === setting.id ? { ...s, value: e.target.value } : s));
                  updateSetting(setting.id, e.target.value);
                }}
              />
              {saving === setting.id && <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin self-end mb-3" />}
            </div>
          ))}
        </div>
      </Card>

      {/* SEO */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">SEO Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedSettings.seo.map((setting) => (
            <div key={setting.id} className="flex gap-2">
              <Input
                label={setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                value={setting.value || ''}
                onChange={(e) => {
                  setSettings(prev => prev.map(s => s.id === setting.id ? { ...s, value: e.target.value } : s));
                  updateSetting(setting.id, e.target.value);
                }}
              />
              {saving === setting.id && <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin self-end mb-3" />}
            </div>
          ))}
        </div>
      </Card>

      {/* Integrations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedSettings.integration.map((setting) => (
            <div key={setting.id} className="flex gap-2">
              <Input
                label={setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                value={setting.value || ''}
                onChange={(e) => {
                  setSettings(prev => prev.map(s => s.id === setting.id ? { ...s, value: e.target.value } : s));
                  updateSetting(setting.id, e.target.value);
                }}
              />
              {saving === setting.id && <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin self-end mb-3" />}
            </div>
          ))}
        </div>
      </Card>

      {/* Content */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Content</h3>
        <div className="space-y-4">
          {groupedSettings.content.map((setting) => (
            <div key={setting.id} className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
              <textarea
                value={setting.value || ''}
                onChange={(e) => {
                  setSettings(prev => prev.map(s => s.id === setting.id ? { ...s, value: e.target.value } : s));
                  updateSetting(setting.id, e.target.value);
                }}
                rows={3}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white resize-none"
              />
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

// Analytics Tab
export function AnalyticsTab() {
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalBookings: 0,
    conversionRate: 0,
    topService: 'N/A',
    topBarber: 'N/A',
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    try {
      const [appointmentsRes, servicesRes, barbersRes] = await Promise.all([
        supabase.from('appointments').select('*'),
        supabase.from('services').select('*'),
        supabase.from('barbers').select('*'),
      ]);

      const appointments = appointmentsRes.data || [];
      const services = servicesRes.data || [];
      const barbers = barbersRes.data || [];

      // Calculate top service
      const serviceCounts: Record<string, number> = {};
      appointments.forEach(apt => {
        if (apt.service_id) {
          serviceCounts[apt.service_id] = (serviceCounts[apt.service_id] || 0) + 1;
        }
      });
      const topServiceId = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topService = services.find(s => s.id === topServiceId)?.name || 'N/A';

      // Calculate top barber
      const barberCounts: Record<string, number> = {};
      appointments.forEach(apt => {
        if (apt.barber_id) {
          barberCounts[apt.barber_id] = (barberCounts[apt.barber_id] || 0) + 1;
        }
      });
      const topBarberId = Object.entries(barberCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topBarber = barbers.find(b => b.id === topBarberId)?.name || 'N/A';

      // Calculate revenue
      const revenue = appointments
        .filter(a => a.status === 'completed')
        .reduce((sum, apt) => {
          const service = services.find(s => s.id === apt.service_id);
          return sum + (service?.price || 0);
        }, 0);

      setStats({
        totalVisits: appointments.length * 3, // Mock estimate
        totalBookings: appointments.length,
        conversionRate: appointments.length > 0 ? 15.5 : 0, // Mock
        topService,
        topBarber,
        revenue,
      });
    } catch (error) {
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Analytics</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-gray-400 text-sm">Total Visits</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalVisits}</p>
        </Card>
        <Card className="p-5">
          <p className="text-gray-400 text-sm">Total Bookings</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalBookings}</p>
        </Card>
        <Card className="p-5">
          <p className="text-gray-400 text-sm">Conversion Rate</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.conversionRate}%</p>
        </Card>
        <Card className="p-5">
          <p className="text-gray-400 text-sm">Top Service</p>
          <p className="text-xl font-bold text-white mt-1">{stats.topService}</p>
        </Card>
        <Card className="p-5">
          <p className="text-gray-400 text-sm">Top Barber</p>
          <p className="text-xl font-bold text-white mt-1">{stats.topBarber}</p>
        </Card>
        <Card className="p-5">
          <p className="text-gray-400 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold text-white mt-1">${stats.revenue.toFixed(0)}</p>
        </Card>
      </div>
    </motion.div>
  );
}

// Users Tab
export function UsersTab() {
  const [users, setUsers] = useState<{ id: string; email: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      // Get auth users - simplified for demo
      setUsers([{ id: 'current', email: 'admin@example.com', role: 'admin' }]);
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Users Management</h2>

      <Card className="p-6">
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
              <div>
                <p className="text-white font-medium">{user.email}</p>
                <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-500 rounded capitalize">{user.role}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-sm mt-4">
          User management requires Supabase Auth integration. Create additional admin users through the Supabase dashboard.
        </p>
      </Card>
    </motion.div>
  );
}
