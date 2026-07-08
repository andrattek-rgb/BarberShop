import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, Check, ChevronLeft, ChevronRight, Scissors } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Barber, Service, TimeSlot, OpeningHour, BlockedDate, Appointment } from '../../types';
import { Section, SectionHeader, Button, Input, Card } from '../ui';
import { formatTime, formatDate, cn } from '../../lib/utils';

type Step = 'barber' | 'service' | 'date' | 'time' | 'details' | 'confirm';

interface BookingFormData {
  barber_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  special_notes: string;
}

const STEPS: { key: Step; label: string }[] = [
  { key: 'barber', label: 'Select Barber' },
  { key: 'service', label: 'Choose Service' },
  { key: 'date', label: 'Pick Date' },
  { key: 'time', label: 'Select Time' },
  { key: 'details', label: 'Your Details' },
  { key: 'confirm', label: 'Confirm' },
];

export function BookingWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('barber');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const [formData, setFormData] = useState<BookingFormData>({
    barber_id: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    special_notes: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Load existing appointments when barber/date changes
    if (formData.barber_id && formData.appointment_date) {
      loadAppointmentsForDate();
    }
  }, [formData.barber_id, formData.appointment_date]);

  useEffect(() => {
    // Generate time slots when date or service changes
    if (formData.appointment_date && formData.service_id) {
      generateTimeSlots();
    }
  }, [formData.appointment_date, formData.service_id, existingAppointments, blockedDates]);

  // Check localStorage for pre-selected barber
  useEffect(() => {
    const selectedBarber = localStorage.getItem('selectedBarber');
    if (selectedBarber && barbers.length > 0) {
      const barber = barbers.find(b => b.id === selectedBarber);
      if (barber) {
        setFormData(prev => ({ ...prev, barber_id: selectedBarber }));
        localStorage.removeItem('selectedBarber');
      }
    }
  }, [barbers]);

  const loadData = async () => {
    try {
      const [barbersRes, servicesRes, hoursRes] = await Promise.all([
        supabase.from('barbers').select('*').eq('is_active', true).order('created_at'),
        supabase.from('services').select('*').eq('is_active', true).order('display_order'),
        supabase.from('opening_hours').select('*').order('day_of_week'),
      ]);

      if (barbersRes.error) throw barbersRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (hoursRes.error) throw hoursRes.error;

      setBarbers(barbersRes.data || []);
      setServices(servicesRes.data || []);
      setOpeningHours(hoursRes.data || []);

      // Load blocked dates
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_dates')
        .select('*')
        .gte('blocked_date', new Date().toISOString().split('T')[0]);

      if (!blockedError) {
        setBlockedDates(blockedData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointmentsForDate = async () => {
    if (!formData.barber_id || !formData.appointment_date) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('barber_id', formData.barber_id)
        .eq('appointment_date', formData.appointment_date)
        .in('status', ['pending', 'confirmed']);

      if (error) throw error;
      setExistingAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const generateTimeSlots = () => {
    const date = new Date(formData.appointment_date);
    const dayOfWeek = date.getDay();
    // Convert Sunday (0) to our format (6), and shift others
    const ourDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const hours = openingHours.find(h => h.day_of_week === ourDay);
    if (!hours || hours.is_closed || !hours.open_time || !hours.close_time) {
      setTimeSlots([]);
      return;
    }

    const service = services.find(s => s.id === formData.service_id);
    const duration = service?.duration_minutes || 30;

    const [openHour, openMin] = hours.open_time.split(':').map(Number);
    const [closeHour, closeMin] = hours.close_time.split(':').map(Number);

    const slots: TimeSlot[] = [];
    let currentHour = openHour;
    let currentMin = openMin;

    while (currentHour * 60 + currentMin + duration <= closeHour * 60 + closeMin) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

      // Check if slot is blocked
      const isBlockedByAdmin = blockedDates.some(b =>
        b.blocked_date === formData.appointment_date &&
        (b.is_full_day || b.blocked_time === timeString)
      );

      // Check if slot is already booked
      const isBooked = existingAppointments.some(a => a.appointment_time === timeString);

      slots.push({
        time: timeString,
        is_available: !isBlockedByAdmin && !isBooked,
        is_blocked: isBlockedByAdmin,
      });

      // Move to next slot (30-minute intervals)
      currentMin += 30;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }
    }

    setTimeSlots(slots);
  };

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);

  const nextStep = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].key);
    }
  };

  const prevStep = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1].key);
    }
  };

  const validateDetails = () => {
    const errors: Partial<Record<keyof BookingFormData, string>> = {};

    if (!formData.customer_name.trim()) {
      errors.customer_name = 'Name is required';
    }

    if (!formData.customer_phone.trim()) {
      errors.customer_phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s-]{8,}$/.test(formData.customer_phone)) {
      errors.customer_phone = 'Please enter a valid phone number';
    }

    if (!formData.customer_email.trim()) {
      errors.customer_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      errors.customer_email = 'Please enter a valid email';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitBooking = async () => {
    if (!validateDetails()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          barber_id: formData.barber_id,
          service_id: formData.service_id,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_email: formData.customer_email,
          special_notes: formData.special_notes || null,
          status: 'pending',
        });

      if (insertError) throw insertError;

      setBooked(true);
    } catch (error) {
      console.error('Error submitting booking:', error);
      setError('Failed to submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);
    return maxDate.toISOString().split('T')[0];
  };

  const selectedBarber = barbers.find(b => b.id === formData.barber_id);
  const selectedService = services.find(s => s.id === formData.service_id);

  if (loading) {
    return (
      <Section id="booking" background="darker">
        <SectionHeader
          eyebrow="Book Now"
          title="Schedule Your Visit"
          subtitle="Easy online booking in just a few steps"
        />
        <div className="animate-pulse">
          <div className="h-16 bg-zinc-800 rounded-xl mb-8" />
          <div className="h-64 bg-zinc-800 rounded-xl" />
        </div>
      </Section>
    );
  }

  if (booked) {
    return (
      <Section id="booking" background="darker">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto text-center"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Booking Confirmed!</h2>
          <p className="text-gray-400 mb-6">
            Your appointment has been successfully booked. You will receive a confirmation email shortly.
          </p>
          <Card className="text-left p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Appointment Details</h3>
            <div className="space-y-3 text-gray-300">
              <p><span className="text-gray-500">Barber:</span> {selectedBarber?.name}</p>
              <p><span className="text-gray-500">Service:</span> {selectedService?.name} (${selectedService?.price})</p>
              <p><span className="text-gray-500">Date:</span> {formatDate(formData.appointment_date)}</p>
              <p><span className="text-gray-500">Time:</span> {formatTime(formData.appointment_time)}</p>
            </div>
          </Card>
          <Button
            variant="outline"
            onClick={() => {
              setBooked(false);
              setFormData({
                barber_id: '',
                service_id: '',
                appointment_date: '',
                appointment_time: '',
                customer_name: '',
                customer_phone: '',
                customer_email: '',
                special_notes: '',
              });
              setCurrentStep('barber');
            }}
          >
            Book Another Appointment
          </Button>
        </motion.div>
      </Section>
    );
  }

  return (
    <Section id="booking" background="darker">
      <SectionHeader
        eyebrow="Book Now"
        title="Schedule Your Visit"
        subtitle="Easy online booking in just a few steps"
      />

      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div
                key={step.key}
                className="flex flex-col items-center flex-1"
              >
                <motion.div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                    index < currentStepIndex
                      ? 'bg-amber-500 text-black'
                      : index === currentStepIndex
                      ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-500'
                      : 'bg-zinc-800 text-gray-500'
                  )}
                >
                  {index < currentStepIndex ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </motion.div>
                <span className={cn(
                  'text-xs mt-2 hidden sm:block',
                  index === currentStepIndex ? 'text-amber-500' : 'text-gray-500'
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Barber */}
            {currentStep === 'barber' && (
              <motion.div
                key="barber"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <User className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-xl font-semibold text-white">Choose Your Barber</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {barbers.map((barber) => (
                    <motion.button
                      key={barber.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, barber_id: barber.id }));
                        nextStep();
                      }}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        formData.barber_id === barber.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-white/10 hover:border-amber-500/50'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={barber.photo_url || 'https://images.pexels.com/photo-2379005/pexels-photo-2379005.jpeg?w=80&h=80&fit=crop'}
                          alt={barber.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-white">{barber.name}</h4>
                          <p className="text-sm text-gray-400">{barber.experience_years}+ years</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-amber-500 text-sm">{barber.rating.toFixed(1)}</span>
                            <span className="text-gray-500 text-xs">({barber.review_count} reviews)</span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Service */}
            {currentStep === 'service' && (
              <motion.div
                key="service"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <span className="text-amber-500 text-sm font-medium">{selectedBarber?.name}</span>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Scissors className="w-6 h-6 text-amber-500" />
                    <h3 className="text-xl font-semibold text-white">Choose Your Service</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {services.map((service) => (
                    <motion.button
                      key={service.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, service_id: service.id }));
                        nextStep();
                      }}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between',
                        formData.service_id === service.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-white/10 hover:border-amber-500/50'
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white">{service.name}</h4>
                          {service.is_popular && (
                            <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-500">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{service.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{service.duration_minutes} minutes</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-white">${service.price.toFixed(2)}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Select Date */}
            {currentStep === 'date' && (
              <motion.div
                key="date"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <Calendar className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-xl font-semibold text-white">Select a Date</h3>
                </div>
                <div className="flex justify-center">
                  <input
                    type="date"
                    min={getMinDate()}
                    max={getMaxDate()}
                    value={formData.appointment_date}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, appointment_date: e.target.value, appointment_time: '' }));
                      if (e.target.value) nextStep();
                    }}
                    className="w-full max-w-xs bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
                {formData.appointment_date && (
                  <p className="text-center text-gray-400 mt-4">
                    Selected: {formatDate(formData.appointment_date)}
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 4: Select Time */}
            {currentStep === 'time' && (
              <motion.div
                key="time"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <Clock className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-xl font-semibold text-white">Choose a Time</h3>
                  <p className="text-sm text-gray-400 mt-1">{formatDate(formData.appointment_date)}</p>
                </div>

                {timeSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">
                      No available time slots for this date. Please select another date.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <motion.button
                        key={slot.time}
                        whileHover={{ scale: slot.is_available ? 1.02 : 1 }}
                        whileTap={{ scale: slot.is_available ? 0.98 : 1 }}
                        disabled={!slot.is_available}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, appointment_time: slot.time }));
                          nextStep();
                        }}
                        className={cn(
                          'p-3 rounded-lg text-sm font-medium transition-all',
                          slot.is_available
                            ? formData.appointment_time === slot.time
                              ? 'bg-amber-500 text-black'
                              : 'bg-zinc-800 text-white hover:bg-zinc-700'
                            : 'bg-zinc-900 text-gray-600 cursor-not-allowed line-through'
                        )}
                      >
                        {formatTime(slot.time)}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 5: Contact Details */}
            {currentStep === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <Mail className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-xl font-semibold text-white">Your Contact Details</h3>
                </div>
                <div className="space-y-4 max-w-md mx-auto">
                  <Input
                    label="Full Name"
                    placeholder="John Smith"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    error={formErrors.customer_name}
                    icon={<User className="w-5 h-5" />}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="+1 234 567 8900"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    error={formErrors.customer_phone}
                    icon={<Phone className="w-5 h-5" />}
                  />
                  <Input
                    label="Email Address"
                    placeholder="john@example.com"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                    error={formErrors.customer_email}
                    icon={<Mail className="w-5 h-5" />}
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Special Notes (Optional)
                    </label>
                    <textarea
                      placeholder="Any special requests or notes..."
                      value={formData.special_notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, special_notes: e.target.value }))}
                      rows={3}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-200 resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Confirmation */}
            {currentStep === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <Check className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-xl font-semibold text-white">Review & Confirm</h3>
                </div>
                <Card className="p-6 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400">Barber</span>
                    <span className="text-white font-medium">{selectedBarber?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400">Service</span>
                    <span className="text-white font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400">Date</span>
                    <span className="text-white font-medium">{formatDate(formData.appointment_date)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400">Time</span>
                    <span className="text-white font-medium">{formatTime(formData.appointment_time)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white font-medium">{selectedService?.duration_minutes} minutes</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">Total Price</span>
                    <span className="text-2xl font-bold text-amber-500">${selectedService?.price.toFixed(2)}</span>
                  </div>
                </Card>

                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={submitBooking}
                  isLoading={submitting}
                >
                  Confirm Booking
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            {currentStep !== 'confirm' && currentStepIndex < STEPS.length - 1 && (
              <Button
                variant="secondary"
                onClick={nextStep}
                disabled={
                  (currentStep === 'barber' && !formData.barber_id) ||
                  (currentStep === 'service' && !formData.service_id) ||
                  (currentStep === 'date' && !formData.appointment_date) ||
                  (currentStep === 'time' && !formData.appointment_time) ||
                  (currentStep === 'details' && !validateDetails())
                }
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </Section>
  );
}
