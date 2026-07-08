import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { Barber, Service, GalleryImage, FAQItem, Review } from '../../types';
import { cn, formatDate } from '../../lib/utils';
import { Button, Card, Input, Modal } from '../ui';
import {
  Plus, Trash2, Edit, Eye, EyeOff,
  ChevronUp, ChevronDown, Star, X
} from 'lucide-react';

// Toast context - imported from AdminDashboard
const ToastContext = React.createContext<{
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}>({ showToast: () => {} });

// Barbers Tab
export function BarbersTab() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Barber>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadBarbers(); }, []);

  const loadBarbers = async () => {
    try {
      const { data, error } = await supabase.from('barbers').select('*').order('display_order');
      if (error) throw error;
      setBarbers(data || []);
    } catch (error) {
      showToast('Failed to load barbers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveBarber = async () => {
    if (!editingId || !editForm.name) return;
    try {
      const { error } = await supabase
        .from('barbers')
        .update({ ...editForm, updated_at: new Date().toISOString() })
        .eq('id', editingId);
      if (error) throw error;
      setEditingId(null);
      setEditForm({});
      loadBarbers();
      showToast('Barber updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update barber', 'error');
    }
  };

  const addBarber = async (barber: Partial<Barber>) => {
    try {
      const { error } = await supabase.from('barbers').insert({
        ...barber,
        is_active: true,
        rating: 5.0,
        review_count: 0,
        display_order: barbers.length + 1,
      });
      if (error) throw error;
      setIsAddModalOpen(false);
      loadBarbers();
      showToast('Barber added successfully', 'success');
    } catch (error) {
      showToast('Failed to add barber', 'error');
    }
  };

  const deleteBarber = async (id: string) => {
    if (!confirm('Are you sure you want to delete this barber?')) return;
    try {
      await supabase.from('barbers').delete().eq('id', id);
      loadBarbers();
      showToast('Barber deleted', 'success');
    } catch (error) {
      showToast('Failed to delete barber', 'error');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await supabase.from('barbers').update({ is_active: !isActive }).eq('id', id);
      loadBarbers();
      showToast(`Barber ${isActive ? 'disabled' : 'enabled'}`, 'success');
    } catch (error) {
      showToast('Failed to update barber', 'error');
    }
  };

  const moveOrder = async (id: string, direction: 'up' | 'down') => {
    const index = barbers.findIndex(b => b.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === barbers.length - 1)) return;

    const newBarbers = [...barbers];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newBarbers[index], newBarbers[swapIndex]] = [newBarbers[swapIndex], newBarbers[index]];

    try {
      await Promise.all([
        supabase.from('barbers').update({ display_order: index }).eq('id', newBarbers[swapIndex].id),
        supabase.from('barbers').update({ display_order: swapIndex }).eq('id', newBarbers[index].id),
      ]);
      loadBarbers();
    } catch (error) {
      showToast('Failed to reorder', 'error');
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Barbers</h2>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Barber
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.map((barber, index) => (
          <Card key={barber.id} className="p-5">
            {editingId === barber.id ? (
              <div className="space-y-4">
                <Input label="Name" value={editForm.name || ''} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
                <Input label="Photo URL" value={editForm.photo_url || ''} onChange={(e) => setEditForm(prev => ({ ...prev, photo_url: e.target.value }))} />
                <Input label="Experience Years" type="number" value={editForm.experience_years || 0} onChange={(e) => setEditForm(prev => ({ ...prev, experience_years: parseInt(e.target.value) }))} />
                <Input label="Instagram URL" value={editForm.instagram_url || ''} onChange={(e) => setEditForm(prev => ({ ...prev, instagram_url: e.target.value }))} />
                <div className="flex gap-2">
                  <Button onClick={saveBarber}>Save</Button>
                  <Button variant="secondary" onClick={() => { setEditingId(null); setEditForm({}); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <img src={barber.photo_url || 'https://images.pexels.com/photo-2379005/pexels-photo-2379005.jpeg?w=80&h=80&fit=crop'} alt={barber.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">{barber.name}</h3>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveOrder(barber.id, 'up')} className="p-1 hover:bg-white/10 rounded" disabled={index === 0}>
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        </button>
                        <button onClick={() => moveOrder(barber.id, 'down')} className="p-1 hover:bg-white/10 rounded" disabled={index === barbers.length - 1}>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{barber.experience_years}+ years</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span className="text-sm text-gray-300">{barber.rating.toFixed(1)} ({barber.review_count})</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <span className={cn('px-2 py-1 rounded text-xs', barber.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500')}>
                    {barber.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(barber.id, barber.is_active)} className="p-2 hover:bg-white/10 rounded">
                      {barber.is_active ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={() => { setEditingId(barber.id); setEditForm(barber); }} className="p-2 hover:bg-amber-500/20 rounded">
                      <Edit className="w-4 h-4 text-amber-500" />
                    </button>
                    <button onClick={() => deleteBarber(barber.id)} className="p-2 hover:bg-red-500/20 rounded">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Barber">
        <AddBarberForm onSubmit={addBarber} onCancel={() => setIsAddModalOpen(false)} />
      </Modal>
    </motion.div>
  );
}

function AddBarberForm({ onSubmit, onCancel }: { onSubmit: (barber: Partial<Barber>) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<Barber>>({
    name: '',
    photo_url: '',
    bio: '',
    experience_years: 0,
    specialties: [],
    instagram_url: '',
    facebook_url: '',
    tiktok_url: '',
  });
  const [specialty, setSpecialty] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Name" value={form.name || ''} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
      <Input label="Photo URL" value={form.photo_url || ''} onChange={(e) => setForm(prev => ({ ...prev, photo_url: e.target.value }))} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Bio</label>
        <textarea value={form.bio || ''} onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))} rows={3} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white resize-none" />
      </div>
      <Input label="Experience Years" type="number" value={form.experience_years || 0} onChange={(e) => setForm(prev => ({ ...prev, experience_years: parseInt(e.target.value) }))} />
      <Input label="Instagram URL" value={form.instagram_url || ''} onChange={(e) => setForm(prev => ({ ...prev, instagram_url: e.target.value }))} />
      <Input label="Facebook URL" value={form.facebook_url || ''} onChange={(e) => setForm(prev => ({ ...prev, facebook_url: e.target.value }))} />
      <Input label="TikTok URL" value={form.tiktok_url || ''} onChange={(e) => setForm(prev => ({ ...prev, tiktok_url: e.target.value }))} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Specialties</label>
        <div className="flex gap-2">
          <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Add specialty" />
          <Button type="button" onClick={() => {
            if (specialty.trim()) {
              setForm(prev => ({ ...prev, specialties: [...(prev.specialties || []), specialty.trim()] }));
              setSpecialty('');
            }
          }}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(form.specialties || []).map((s, i) => (
            <span key={i} className="px-2 py-1 bg-zinc-800 rounded text-sm text-gray-300 flex items-center gap-1">
              {s}
              <button type="button" onClick={() => setForm(prev => ({ ...prev, specialties: prev.specialties?.filter((_, idx) => idx !== i) }))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Add Barber</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// Services Tab
export function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Service>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadServices(); }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase.from('services').select('*').order('display_order');
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveService = async () => {
    if (!editingId || !editForm.name) return;
    try {
      await supabase.from('services').update({ ...editForm, updated_at: new Date().toISOString() }).eq('id', editingId);
      setEditingId(null);
      setEditForm({});
      loadServices();
      showToast('Service updated', 'success');
    } catch (error) {
      showToast('Failed to update service', 'error');
    }
  };

  const addService = async (service: Partial<Service>) => {
    try {
      await supabase.from('services').insert({
        ...service,
        is_active: true,
        display_order: services.length + 1,
      });
      setIsAddModalOpen(false);
      loadServices();
      showToast('Service added', 'success');
    } catch (error) {
      showToast('Failed to add service', 'error');
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    try {
      await supabase.from('services').delete().eq('id', id);
      loadServices();
      showToast('Service deleted', 'success');
    } catch (error) {
      showToast('Failed to delete service', 'error');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await supabase.from('services').update({ is_active: !isActive }).eq('id', id);
      loadServices();
      showToast(`Service ${isActive ? 'disabled' : 'enabled'}`, 'success');
    } catch (error) {
      showToast('Failed to update', 'error');
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Services</h2>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Service
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Service</th>
              <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Duration</th>
              <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Price</th>
              <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Status</th>
              <th className="text-right py-4 px-4 text-gray-400 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-b border-white/5 hover:bg-white/5">
                {editingId === service.id ? (
                  <>
                    <td className="py-4 px-4">
                      <Input value={editForm.name || ''} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
                    </td>
                    <td className="py-4 px-4">
                      <Input type="number" value={editForm.duration_minutes || 0} onChange={(e) => setEditForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))} />
                    </td>
                    <td className="py-4 px-4">
                      <Input type="number" step="0.01" value={editForm.price || 0} onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))} />
                    </td>
                    <td className="py-4 px-4">
                      <Button size="sm" onClick={saveService}>Save</Button>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setEditForm({}); }}>Cancel</Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-4 px-4">
                      <p className="text-white font-medium">{service.name}</p>
                      <p className="text-sm text-gray-400 truncate max-w-xs">{service.description}</p>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{service.duration_minutes} min</td>
                    <td className="py-4 px-4 text-white font-semibold">${service.price.toFixed(2)}</td>
                    <td className="py-4 px-4">
                      <span className={cn('px-2 py-1 rounded text-xs', service.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500')}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => toggleActive(service.id, service.is_active)} className="p-2 hover:bg-white/10 rounded">
                          {service.is_active ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                        <button onClick={() => { setEditingId(service.id); setEditForm(service); }} className="p-2 hover:bg-amber-500/20 rounded">
                          <Edit className="w-4 h-4 text-amber-500" />
                        </button>
                        <button onClick={() => deleteService(service.id)} className="p-2 hover:bg-red-500/20 rounded">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Service">
        <AddServiceForm onSubmit={addService} onCancel={() => setIsAddModalOpen(false)} />
      </Modal>
    </motion.div>
  );
}

function AddServiceForm({ onSubmit, onCancel }: { onSubmit: (service: Partial<Service>) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<Service>>({ name: '', description: '', price: 0, duration_minutes: 30, category: 'Haircuts' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Service Name" value={form.name || ''} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Description</label>
        <textarea value={form.description || ''} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Price ($)" type="number" step="0.01" value={form.price || 0} onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))} required />
        <Input label="Duration (min)" type="number" value={form.duration_minutes || 30} onChange={(e) => setForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Category</label>
        <select value={form.category || 'Haircuts'} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white">
          <option value="Haircuts">Haircuts</option>
          <option value="Beard">Beard</option>
          <option value="Shaves">Shaves</option>
          <option value="Premium">Premium</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Add Service</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// Gallery Tab
export function GalleryTab() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadImages(); }, []);

  const loadImages = async () => {
    try {
      const { data, error } = await supabase.from('gallery_images').select('*').order('display_order');
      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      showToast('Failed to load gallery', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addImage = async (image: Partial<GalleryImage>) => {
    try {
      await supabase.from('gallery_images').insert({
        ...image,
        display_order: images.length + 1,
        is_visible: true,
      });
      setIsAddModalOpen(false);
      loadImages();
      showToast('Image added', 'success');
    } catch (error) {
      showToast('Failed to add image', 'error');
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm('Delete this image?')) return;
    try {
      await supabase.from('gallery_images').delete().eq('id', id);
      loadImages();
      showToast('Image deleted', 'success');
    } catch (error) {
      showToast('Failed to delete image', 'error');
    }
  };

  const toggleVisible = async (id: string, isVisible: boolean) => {
    try {
      await supabase.from('gallery_images').update({ is_visible: !isVisible }).eq('id', id);
      loadImages();
    } catch (error) {
      showToast('Failed to update', 'error');
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Gallery</h2>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Image
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="relative overflow-hidden group">
            <img src={image.image_url} alt={image.alt_text || ''} className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={() => toggleVisible(image.id, image.is_visible)} className="p-2 bg-zinc-900 rounded-lg">
                {image.is_visible ? <EyeOff className="w-4 h-4 text-white" /> : <Eye className="w-4 h-4 text-white" />}
              </button>
              <button onClick={() => deleteImage(image.id)} className="p-2 bg-red-500/20 rounded-lg">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
            <div className="absolute top-2 left-2">
              <span className="px-2 py-1 text-xs bg-black/50 rounded text-white">{image.category}</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Gallery Image">
        <AddImageForm onSubmit={addImage} onCancel={() => setIsAddModalOpen(false)} />
      </Modal>
    </motion.div>
  );
}

function AddImageForm({ onSubmit, onCancel }: { onSubmit: (image: Partial<GalleryImage>) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<GalleryImage>>({ image_url: '', alt_text: '', category: 'Haircuts' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Image URL" value={form.image_url || ''} onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))} required placeholder="https://..." />
      <Input label="Alt Text" value={form.alt_text || ''} onChange={(e) => setForm(prev => ({ ...prev, alt_text: e.target.value }))} placeholder="Image description for SEO" />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Category</label>
        <select value={form.category || 'Haircuts'} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white">
          <option value="Haircuts">Haircuts</option>
          <option value="Beard">Beard</option>
          <option value="Shaves">Shaves</option>
          <option value="Shop">Shop</option>
        </select>
      </div>
      {form.image_url && <img src={form.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg" />}
      <div className="flex gap-2">
        <Button type="submit">Add Image</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// Reviews Tab
export function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      showToast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleApproved = async (id: string, isApproved: boolean) => {
    try {
      await supabase.from('reviews').update({ is_approved: !isApproved }).eq('id', id);
      loadReviews();
      showToast(`Review ${isApproved ? 'hidden' : 'approved'}`, 'success');
    } catch (error) {
      showToast('Failed to update review', 'error');
    }
  };

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      await supabase.from('reviews').update({ is_featured: !isFeatured } as any).eq('id', id);
      loadReviews();
      showToast(`Review ${isFeatured ? 'unfeatured' : 'featured'}`, 'success');
    } catch (error) {
      showToast('Failed to update review', 'error');
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await supabase.from('reviews').delete().eq('id', id);
      loadReviews();
      showToast('Review deleted', 'success');
    } catch (error) {
      showToast('Failed to delete review', 'error');
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Reviews</h2>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <img src={review.customer_photo_url || 'https://images.pexels.com/photo-220453/pexels-photo-220453.jpeg?w=60&h=60&fit=crop'} alt={review.customer_name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h3 className="font-semibold text-white">{review.customer_name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn('w-4 h-4', i < review.rating ? 'fill-amber-500 text-amber-500' : 'fill-zinc-700 text-zinc-700')} />
                    ))}
                  </div>
                  <p className="text-gray-400 mt-2">{review.comment}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatDate(review.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {review.is_featured && <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-500 rounded">Featured</span>}
                <span className={cn('px-2 py-1 text-xs rounded', review.is_approved ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500')}>
                  {review.is_approved ? 'Approved' : 'Hidden'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
              <Button size="sm" variant="secondary" onClick={() => toggleApproved(review.id, review.is_approved)}>
                {review.is_approved ? 'Hide' : 'Approve'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => toggleFeatured(review.id, review.is_featured || false)}>
                {review.is_featured ? 'Unfeature' : 'Feature'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => deleteReview(review.id)} className="text-red-500">
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// FAQ Tab
export function FAQTab() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showToast } = useContext(ToastContext);

  useEffect(() => { loadFAQs(); }, []);

  const loadFAQs = async () => {
    try {
      const { data, error } = await supabase.from('faq_items').select('*').order('display_order');
      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      showToast('Failed to load FAQs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addFAQ = async (faq: Partial<FAQItem>) => {
    try {
      await supabase.from('faq_items').insert({ ...faq, display_order: faqs.length + 1, is_visible: true });
      setIsAddModalOpen(false);
      loadFAQs();
      showToast('FAQ added', 'success');
    } catch (error) {
      showToast('Failed to add FAQ', 'error');
    }
  };

  const updateFAQ = async (id: string, faq: Partial<FAQItem>) => {
    try {
      await supabase.from('faq_items').update(faq).eq('id', id);
      setEditingId(null);
      loadFAQs();
      showToast('FAQ updated', 'success');
    } catch (error) {
      showToast('Failed to update FAQ', 'error');
    }
  };

  const deleteFAQ = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await supabase.from('faq_items').delete().eq('id', id);
      loadFAQs();
      showToast('FAQ deleted', 'success');
    } catch (error) {
      showToast('Failed to delete FAQ', 'error');
    }
  };

  const moveOrder = async (id: string, direction: 'up' | 'down') => {
    const index = faqs.findIndex(f => f.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === faqs.length - 1)) return;

    const newFaqs = [...faqs];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newFaqs[index], newFaqs[swapIndex]] = [newFaqs[swapIndex], newFaqs[index]];

    try {
      await Promise.all([
        supabase.from('faq_items').update({ display_order: index }).eq('id', newFaqs[swapIndex].id),
        supabase.from('faq_items').update({ display_order: swapIndex }).eq('id', newFaqs[index].id),
      ]);
      loadFAQs();
    } catch (error) {
      showToast('Failed to reorder', 'error');
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">FAQ</h2>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add FAQ
        </Button>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <Card key={faq.id} className="p-5">
            {editingId === faq.id ? (
              <FAQEditForm faq={faq} onSave={(updated) => updateFAQ(faq.id, updated)} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs bg-zinc-800 text-gray-400 rounded">{faq.category}</span>
                    {!faq.is_visible && <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-500 rounded">Hidden</span>}
                  </div>
                  <h3 className="font-semibold text-white">{faq.question}</h3>
                  <p className="text-gray-400 mt-2">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveOrder(faq.id, 'up')} className="p-1 hover:bg-white/10 rounded" disabled={index === 0}>
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => moveOrder(faq.id, 'down')} className="p-1 hover:bg-white/10 rounded" disabled={index === faqs.length - 1}>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => setEditingId(faq.id)} className="p-2 hover:bg-amber-500/20 rounded">
                    <Edit className="w-4 h-4 text-amber-500" />
                  </button>
                  <button onClick={() => deleteFAQ(faq.id)} className="p-2 hover:bg-red-500/20 rounded">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add FAQ">
        <FAQEditForm onSave={addFAQ} onCancel={() => setIsAddModalOpen(false)} />
      </Modal>
    </motion.div>
  );
}

function FAQEditForm({ faq, onSave, onCancel }: { faq?: FAQItem; onSave: (faq: Partial<FAQItem>) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<FAQItem>>(faq || { question: '', answer: '', category: 'General', is_visible: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question || !form.answer) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Question" value={form.question || ''} onChange={(e) => setForm(prev => ({ ...prev, question: e.target.value }))} required />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Answer</label>
        <textarea value={form.answer || ''} onChange={(e) => setForm(prev => ({ ...prev, answer: e.target.value }))} rows={4} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white resize-none" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Category</label>
        <select value={form.category || 'General'} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white">
          <option value="General">General</option>
          <option value="Booking">Booking</option>
          <option value="Services">Services</option>
          <option value="Payment">Payment</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="visible" checked={form.is_visible} onChange={(e) => setForm(prev => ({ ...prev, is_visible: e.target.checked }))} className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-amber-500" />
        <label htmlFor="visible" className="text-sm text-gray-300">Visible on website</label>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// Additional tab components will be added in the next file
export { ToastContext };
