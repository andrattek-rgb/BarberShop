import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../../lib/supabase';
import type {
  Barber, Service, Appointment, Review,
  DashboardStats, AdminProfile
} from '../../types';
import { formatDate, formatTime, cn } from '../../lib/utils';
import {
  LayoutDashboard, Calendar, User, Scissors, Image, Star, HelpCircle,
  Clock, Settings, Users, LogOut, Menu,
  TrendingUp, DollarSign, Check, X,
  MapPin, Globe,
  CheckCircle, Download,
  BarChart3, AlertCircle
} from 'lucide-react';
import { Button, Card, Input } from '../ui';
import { BarbersTab, ServicesTab, GalleryTab, ReviewsTab, FAQTab, ToastContext } from './AdminTabs';
import { HoursTab, HeroTab, ContactTab, SocialTab, SettingsTab, AnalyticsTab, UsersTab } from './AdminTabsExtra';

// Types
type AdminTab =
  | 'dashboard'
  | 'appointments'
  | 'barbers'
  | 'services'
  | 'gallery'
  | 'reviews'
  | 'faq'
  | 'hours'
  | 'hero'
  | 'contact'
  | 'settings'
  | 'social'
  | 'analytics'
  | 'users';

// Auth Context
const AuthContext = createContext<{
  user: any;
  profile: AdminProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}>({ user: null, profile: null, loading: true, logout: async () => {} });

// Toast Component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <AlertCircle className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColors[type]} backdrop-blur-sm`}
    >
      {icons[type]}
      <span className="text-white text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// Main Admin Dashboard Component
export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profileData, error: profileError } = await supabase
          .from('admin_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profileData) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          return;
        }

        setUser(session.user);
        setProfile(profileData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profileData, error: profileError } = await supabase
          .from('admin_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profileData) {
          await supabase.auth.signOut();
          throw new Error('This account is not authorized for the admin panel');
        }

        setUser(session.user);
        setProfile(profileData);
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      setLoginError(error.message || 'Failed to login');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setProfile(null);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthContext.Provider value={{ user, profile, loading: isLoading, logout: handleLogout }}>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-8 h-8 text-black" />
                </div>
                <h1 className="text-2xl font-bold text-white">Admin Login</h1>
                <p className="text-gray-400 mt-2">Access the dashboard to manage your shop</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {loginError && (
                  <p className="text-sm text-red-500">{loginError}</p>
                )}
                <Button type="submit" className="w-full" isLoading={loggingIn}>
                  Login
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </AuthContext.Provider>
    );
  }

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { key: 'appointments', label: 'Appointments', icon: <Calendar className="w-5 h-5" /> },
    { key: 'barbers', label: 'Barbers', icon: <User className="w-5 h-5" /> },
    { key: 'services', label: 'Services', icon: <Scissors className="w-5 h-5" /> },
    { key: 'gallery', label: 'Gallery', icon: <Image className="w-5 h-5" /> },
    { key: 'reviews', label: 'Reviews', icon: <Star className="w-5 h-5" /> },
    { key: 'faq', label: 'FAQ', icon: <HelpCircle className="w-5 h-5" /> },
    { key: 'hours', label: 'Opening Hours', icon: <Clock className="w-5 h-5" /> },
    { key: 'hero', label: 'Hero Section', icon: <TrendingUp className="w-5 h-5" /> },
    { key: 'contact', label: 'Contact', icon: <MapPin className="w-5 h-5" /> },
    { key: 'social', label: 'Social Media', icon: <Globe className="w-5 h-5" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { key: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <AuthContext.Provider value={{ user, profile, loading: false, logout: handleLogout }}>
      <ToastContext.Provider value={{ showToast }}>
        <div className="min-h-screen bg-black">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">
                      Admin<span className="text-amber-500">Panel</span>
                    </h1>
                    <p className="text-xs text-gray-500">Welcome back, {user?.email?.split('@')[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={handleLogout} className="gap-2">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="flex">
            {/* Sidebar */}
            <aside className="w-64 min-h-screen bg-zinc-950 border-r border-white/5 flex-shrink-0 hidden lg:block">
              <nav className="p-4 space-y-1 sticky top-16">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all text-sm',
                      activeTab === tab.key
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Mobile menu button */}
            <div className="lg:hidden fixed bottom-4 right-4 z-50">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-black" /> : <Menu className="w-6 h-6 text-black" />}
              </button>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: '100%' }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: '100%' }}
                  className="fixed inset-0 z-40 bg-black lg:hidden"
                >
                  <div className="p-4 space-y-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                          activeTab === tab.key
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-grow p-6 lg:p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && <DashboardTab key="dashboard" />}
                {activeTab === 'appointments' && <AppointmentsTab key="appointments" />}
                {activeTab === 'barbers' && <BarbersTab key="barbers" />}
                {activeTab === 'services' && <ServicesTab key="services" />}
                {activeTab === 'gallery' && <GalleryTab key="gallery" />}
                {activeTab === 'reviews' && <ReviewsTab key="reviews" />}
                {activeTab === 'faq' && <FAQTab key="faq" />}
                {activeTab === 'hours' && <HoursTab key="hours" />}
                {activeTab === 'hero' && <HeroTab key="hero" />}
                {activeTab === 'contact' && <ContactTab key="contact" />}
                {activeTab === 'social' && <SocialTab key="social" />}
                {activeTab === 'settings' && <SettingsTab key="settings" />}
                {activeTab === 'analytics' && <AnalyticsTab key="analytics" />}
                {activeTab === 'users' && <UsersTab key="users" />}
              </AnimatePresence>
            </main>
          </div>

          {/* Toasts */}
          <div className="fixed bottom-4 right-4 z-50 space-y-2">
            <AnimatePresence>
              {toasts.map((toast) => (
                <Toast
                  key={toast.id}
                  message={toast.message}
                  type={toast.type}
                  onClose={() => removeToast(toast.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}

// Dashboard Tab
function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    totalCustomers: 0,
    totalBarbers: 0,
    monthlyRevenue: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const [appointmentsRes, barbersRes, servicesRes, reviewsRes] = await Promise.all([
        supabase.from('appointments').select('*'),
        supabase.from('barbers').select('*').eq('is_active', true),
        supabase.from('services').select('*'),
        supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const appointments = appointmentsRes.data || [];
      const barbers = barbersRes.data || [];
      const services = servicesRes.data || [];

      // Calculate unique customers
      const uniqueCustomers = new Set(appointments.map(a => a.customer_email)).size;

      // Calculate revenue
      const monthlyRevenue = appointments
        .filter(a => {
          const date = new Date(a.appointment_date);
          return a.status === 'completed' && date >= new Date(firstDayOfMonth);
        })
        .reduce((sum, a) => {
          const service = services.find(s => s.id === a.service_id);
          return sum + (service?.price || 0);
        }, 0);

      setStats({
        totalAppointments: appointments.length,
        todayAppointments: appointments.filter(a => a.appointment_date === today).length,
        totalCustomers: uniqueCustomers,
        totalBarbers: barbers.length,
        monthlyRevenue,
        pendingAppointments: appointments.filter(a => a.status === 'pending').length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
      });

      setRecentAppointments(appointments.slice(0, 5));
      setRecentReviews(reviewsRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-zinc-900 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Today's Appointments", value: stats.todayAppointments, icon: Calendar, color: 'amber', trend: 'up' },
    { label: 'Pending', value: stats.pendingAppointments, icon: Clock, color: 'yellow', trend: 'neutral' },
    { label: 'Monthly Revenue', value: `$${stats.monthlyRevenue.toFixed(0)}`, icon: DollarSign, color: 'green', trend: 'up' },
    { label: 'Active Barbers', value: stats.totalBarbers, icon: User, color: 'blue', trend: 'neutral' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Recent Appointments
          </h3>
          <div className="space-y-3">
            {recentAppointments.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No appointments yet</p>
            ) : (
              recentAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                  <div>
                    <p className="text-white font-medium">{apt.customer_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(apt.appointment_date)} at {formatTime(apt.appointment_time)}</p>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    apt.status === 'confirmed' && 'bg-green-500/20 text-green-500',
                    apt.status === 'pending' && 'bg-yellow-500/20 text-yellow-500',
                    apt.status === 'completed' && 'bg-blue-500/20 text-blue-500',
                    apt.status === 'cancelled' && 'bg-red-500/20 text-red-500'
                  )}>
                    {apt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Reviews */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Recent Reviews
          </h3>
          <div className="space-y-3">
            {recentReviews.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No reviews yet</p>
            ) : (
              recentReviews.map((review) => (
                <div key={review.id} className="p-3 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">{review.customer_name}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('w-4 h-4', i < review.rating ? 'fill-amber-500 text-amber-500' : 'fill-zinc-700 text-zinc-700')} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

// Appointments Tab
function AppointmentsTab() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', date: '', search: '' });
  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [aptRes, barbersRes, servicesRes] = await Promise.all([
        supabase.from('appointments').select('*').order('appointment_date', { ascending: false }),
        supabase.from('barbers').select('*'),
        supabase.from('services').select('*'),
      ]);
      setAppointments(aptRes.data || []);
      setBarbers(barbersRes.data || []);
      setServices(servicesRes.data || []);
    } catch (error) {
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: Appointment['status']) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await loadData();
      showToast(`Appointment ${status}`, 'success');
    } catch (error) {
      showToast('Failed to update appointment', 'error');
    }
  };

  const exportCSV = () => {
    const headers = ['Customer', 'Email', 'Phone', 'Barber', 'Service', 'Date', 'Time', 'Status'];
    const rows = filteredAppointments.map(apt => [
      apt.customer_name,
      apt.customer_email,
      apt.customer_phone,
      barbers.find(b => b.id === apt.barber_id)?.name || '',
      services.find(s => s.id === apt.service_id)?.name || '',
      apt.appointment_date,
      apt.appointment_time,
      apt.status,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appointments.csv';
    a.click();
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter.status !== 'all' && apt.status !== filter.status) return false;
    if (filter.date && apt.appointment_date !== filter.date) return false;
    if (filter.search && !apt.customer_name.toLowerCase().includes(filter.search.toLowerCase()) &&
        !apt.customer_email.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Appointments</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search customer..."
            value={filter.search}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            className="max-w-xs"
          />
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={filter.date}
            onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))}
            className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Customer</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Barber</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Service</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Date/Time</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Status</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((apt) => (
                <tr key={apt.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-4 px-4">
                    <p className="text-white font-medium">{apt.customer_name}</p>
                    <p className="text-sm text-gray-400">{apt.customer_email}</p>
                  </td>
                  <td className="py-4 px-4 text-gray-300">{barbers.find(b => b.id === apt.barber_id)?.name || '-'}</td>
                  <td className="py-4 px-4 text-gray-300">{services.find(s => s.id === apt.service_id)?.name || '-'}</td>
                  <td className="py-4 px-4">
                    <p className="text-white">{formatDate(apt.appointment_date)}</p>
                    <p className="text-sm text-gray-400">{formatTime(apt.appointment_time)}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      apt.status === 'confirmed' && 'bg-green-500/20 text-green-500',
                      apt.status === 'pending' && 'bg-yellow-500/20 text-yellow-500',
                      apt.status === 'completed' && 'bg-blue-500/20 text-blue-500',
                      apt.status === 'cancelled' && 'bg-red-500/20 text-red-500'
                    )}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {apt.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(apt.id, 'confirmed')} className="p-2 hover:bg-green-500/20 rounded text-green-500">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => updateStatus(apt.id, 'cancelled')} className="p-2 hover:bg-red-500/20 rounded text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {apt.status === 'confirmed' && (
                        <button onClick={() => updateStatus(apt.id, 'completed')} className="p-2 hover:bg-blue-500/20 rounded text-blue-500">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
