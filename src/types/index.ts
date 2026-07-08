export interface Barber {
  id: string;
  name: string;
  photo_url: string | null;
  bio: string | null;
  experience_years: number;
  specialties: string[];
  rating: number;
  review_count: number;
  instagram_url: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  is_active: boolean;
  display_order?: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  icon_name: string | null;
  category?: string;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  barber_id: string | null;
  service_id: string | null;
  appointment_date: string;
  appointment_time: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  special_notes: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  barber_id: string | null;
  service_id: string | null;
  appointment_id: string | null;
  customer_name: string;
  customer_photo_url: string | null;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  is_featured?: boolean;
  created_at: string;
}

export interface BlockedDate {
  id: string;
  barber_id: string | null;
  blocked_date: string;
  blocked_time: string | null;
  reason: string | null;
  is_full_day: boolean;
  created_at: string;
}

export interface OpeningHour {
  id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export interface BookingFormData {
  barber_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  special_notes?: string;
}

export interface TimeSlot {
  time: string;
  is_available: boolean;
  is_blocked: boolean;
}

// Admin Panel Types
export interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  category: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeroContent {
  id: string;
  headline: string;
  subtitle: string;
  badge_text: string | null;
  primary_cta_text: string;
  secondary_cta_text: string;
  background_type: 'gradient' | 'image' | 'video';
  background_url: string | null;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  updated_at: string;
}

export interface ContactInfo {
  id: string;
  business_name: string;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  address_line1: string | null;
  address_line2: string | null;
  google_maps_url: string | null;
  emergency_contact: string | null;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  is_visible: boolean;
  display_order: number;
}

export interface AdminProfile {
  id: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  page_url: string | null;
  referrer: string | null;
  user_agent: string | null;
  session_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  totalCustomers: number;
  totalBarbers: number;
  monthlyRevenue: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
}

export interface ChartData {
  labels: string[];
  values: number[];
}
