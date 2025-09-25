import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Video, Phone, MapPin, Star, 
  CheckCircle, ArrowLeft, ArrowRight, User, Award,
  Heart, Shield, MessageSquare, Filter, Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import { trackPayment } from '../utils/analyticsManager';

interface Therapist {
  id: string;
  name: string;
  title: string;
  specialization: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  avatar: string;
  verified: boolean;
  nextAvailable: string;
  bio: string;
  languages: string[];
  availability?: string[];
}

interface BookingData {
  therapist: Therapist | null;
  date: string;
  time: string;
  sessionType: 'video' | 'phone' | 'in-person';
  duration: number;
  notes: string;
}

function BookingPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [filteredTherapists, setFilteredTherapists] = useState<Therapist[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [bookingData, setBookingData] = useState<BookingData>({
    therapist: null,
    date: new Date().toISOString().split('T')[0],
    time: '',
    sessionType: 'video',
    duration: 50,
    notes: ''
  });

  useEffect(() => {
    // Load therapists from localStorage
    const savedTherapists = localStorage.getItem('mindcare_therapists');
    if (savedTherapists) {
      const therapistList = JSON.parse(savedTherapists);
      setTherapists(therapistList);
      setFilteredTherapists(therapistList);
    } else {
      // Default therapists if none saved
      const defaultTherapists: Therapist[] = [
        {
          id: '1',
          name: 'Dr. Sarah Smith',
          title: 'Licensed Clinical Psychologist',
          specialization: ['Anxiety', 'Depression', 'CBT'],
          experience: 8,
          rating: 4.9,
          reviewCount: 127,
          hourlyRate: 120,
          location: 'Online',
          avatar: 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=150',
          verified: true,
          nextAvailable: 'Today, 2:00 PM',
          bio: 'Experienced therapist specializing in CBT with a passion for helping patients overcome anxiety and depression.',
          languages: ['English', 'Spanish'],
          availability: [
            'Monday 9:00 AM', 'Monday 10:00 AM', 'Monday 11:00 AM', 'Monday 12:00 PM', 
            'Monday 1:00 PM', 'Monday 2:00 PM', 'Monday 3:00 PM', 'Monday 4:00 PM', 'Monday 5:00 PM',
            'Tuesday 9:00 AM', 'Tuesday 10:00 AM', 'Tuesday 11:00 AM', 'Tuesday 12:00 PM',
            'Tuesday 1:00 PM', 'Tuesday 2:00 PM', 'Tuesday 3:00 PM', 'Tuesday 4:00 PM', 'Tuesday 5:00 PM',
            'Wednesday 9:00 AM', 'Wednesday 10:00 AM', 'Wednesday 11:00 AM', 'Wednesday 12:00 PM',
            'Wednesday 1:00 PM', 'Wednesday 2:00 PM', 'Wednesday 3:00 PM', 'Wednesday 4:00 PM', 'Wednesday 5:00 PM',
            'Thursday 9:00 AM', 'Thursday 10:00 AM', 'Thursday 11:00 AM', 'Thursday 12:00 PM',
            'Thursday 1:00 PM', 'Thursday 2:00 PM', 'Thursday 3:00 PM', 'Thursday 4:00 PM', 'Thursday 5:00 PM',
            'Friday 9:00 AM', 'Friday 10:00 AM', 'Friday 11:00 AM', 'Friday 12:00 PM',
            'Friday 1:00 PM', 'Friday 2:00 PM', 'Friday 3:00 PM', 'Friday 4:00 PM', 'Friday 5:00 PM'
          ]
        },
        {
          id: '2',
          name: 'Dr. Michael Chen',
          title: 'Trauma Specialist',
          specialization: ['PTSD', 'Trauma', 'EMDR'],
          experience: 12,
          rating: 4.8,
          reviewCount: 89,
          hourlyRate: 150,
          location: 'Online',
          avatar: 'https://images.pexels.com/photos/5327647/pexels-photo-5327647.jpeg?auto=compress&cs=tinysrgb&w=150',
          verified: true,
          nextAvailable: 'Tomorrow, 10:00 AM',
          bio: 'Specialized in trauma therapy with extensive experience in EMDR and PTSD treatment.',
          languages: ['English', 'Mandarin']
        }
      ];
      setTherapists(defaultTherapists);
      setFilteredTherapists(defaultTherapists);
      localStorage.setItem('mindcare_therapists', JSON.stringify(defaultTherapists));
    }
  }, []);

  useEffect(() => {
    // Filter therapists based on search and specialization
    let filtered = therapists;
    
    if (searchTerm) {
      filtered = filtered.filter(therapist =>
        therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapist.specialization.some(spec => 
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    if (selectedSpecialization) {
      filtered = filtered.filter(therapist =>
        therapist.specialization.includes(selectedSpecialization)
      );
    }
    
    setFilteredTherapists(filtered);
  }, [searchTerm, selectedSpecialization, therapists]);

  const getAvailableTimeSlots = (selectedDate: string, therapist: Therapist) => {
    if (!therapist.availability) return [];

    const selectedDateObj = new Date(selectedDate);
    const dayName = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    // Get all slots for the selected day
    const daySlots = therapist.availability.filter(slot => slot.startsWith(dayName));
    
    // If the selected date is today, filter out past time slots
    if (selectedDate === currentDate) {
      return daySlots.filter(slot => {
        const timeStr = slot.split(' ').slice(1).join(' '); // Get time part (e.g., "2:00 PM")
        const slotTime = parseTimeToMinutes(timeStr);
        return slotTime > currentTime + 30; // Add 30 minutes buffer for booking
      });
    }
    
    // If the selected date is in the future, return all slots for that day
    if (selectedDate > currentDate) {
      return daySlots;
    }
    
    // If the selected date is in the past, return empty array
    return [];
  };

  const parseTimeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + (minutes || 0);
    
    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes = minutes || 0;
    }
    
    return totalMinutes;
  };

  const formatTimeSlot = (slot: string): string => {
    return slot.split(' ').slice(1).join(' '); // Remove day name, keep time
  };

  const isTimeSlotBooked = (therapistId: string, date: string, time: string): boolean => {
    const bookings = JSON.parse(localStorage.getItem('mindcare_bookings') || '[]');
    return bookings.some((booking: any) => 
      booking.therapistId === therapistId && 
      booking.date === date && 
      booking.time === time &&
      booking.status !== 'cancelled'
    );
  };

  const handleTherapistSelect = (therapist: Therapist) => {
    setBookingData(prev => ({ ...prev, therapist }));
    setCurrentStep(2);
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    setBookingData(prev => ({ ...prev, date, time }));
    setCurrentStep(3);
  };

  const handleBookingConfirm = () => {
    if (!bookingData.therapist || !bookingData.date || !bookingData.time) {
      toast.error('Please complete all booking details');
      return;
    }

    const newBooking = {
      id: Date.now().toString(),
      patientId: user?.id,
      patientName: user?.name,
      patientEmail: user?.email,
      therapistId: bookingData.therapist.id,
      therapistName: bookingData.therapist.name,
      date: bookingData.date,
      time: bookingData.time,
      sessionType: bookingData.sessionType,
      duration: bookingData.duration,
      amount: `$${bookingData.therapist.hourlyRate}`,
      status: 'pending_confirmation',
      notes: bookingData.notes,
      createdAt: new Date().toISOString()
    };

    // Save booking
    const existingBookings = JSON.parse(localStorage.getItem('mindcare_bookings') || '[]');
    const updatedBookings = [...existingBookings, newBooking];
    localStorage.setItem('mindcare_bookings', JSON.stringify(updatedBookings));

    // Track payment
    trackPayment({
      patientId: user?.id,
      therapistId: bookingData.therapist.id,
      amount: `$${bookingData.therapist.hourlyRate}`,
      sessionType: bookingData.sessionType
    });

    toast.success('Booking confirmed! Your therapist will confirm the appointment soon.');
    
    // Reset form
    setBookingData({
      therapist: null,
      date: new Date().toISOString().split('T')[0],
      time: '',
      sessionType: 'video',
      duration: 50,
      notes: ''
    });
    setCurrentStep(1);
  };

  const allSpecializations = Array.from(
    new Set(therapists.flatMap(t => t.specialization))
  );

  const steps = [
    { number: 1, title: 'Choose Therapist', description: 'Select your preferred therapist' },
    { number: 2, title: 'Select Date & Time', description: 'Pick your appointment slot' },
    { number: 3, title: 'Confirm Booking', description: 'Review and confirm details' }
  ];

  return (
    <div className={`h-screen flex flex-col ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50'
    }`}>
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Book Session
          </h1>
          <p className={`text-base ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Schedule a video therapy session with licensed professionals
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-4 p-4 rounded-xl shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center space-x-3 ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    currentStep >= step.number
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="hidden md:block">
                    <h3 className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden md:block w-16 h-0.5 mx-4 ${
                    currentStep > step.number
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                      : theme === 'dark'
                      ? 'bg-gray-700'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="space-y-4"
            >
              {/* Search and Filter */}
              <div className={`p-4 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="text"
                      placeholder="Search therapists..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>
                  <select
                    value={selectedSpecialization}
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                    className={`px-4 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  >
                    <option value="">All Specializations</option>
                    {allSpecializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Therapist Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTherapists.map((therapist, index) => (
                  <motion.div
                    key={therapist.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => handleTherapistSelect(therapist)}
                    className={`p-4 rounded-xl shadow-lg cursor-pointer transition-all duration-300 ${
                      theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:shadow-xl'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="relative">
                        <img
                          src={therapist.avatar}
                          alt={therapist.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {therapist.verified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Shield className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                          {therapist.name}
                        </h3>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {therapist.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                          {therapist.rating}
                        </span>
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          ({therapist.reviewCount})
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4 text-purple-500" />
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {therapist.experience}y exp
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {therapist.specialization.slice(0, 3).map((spec, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <p className={`text-lg font-bold text-green-600`}>
                          ${therapist.hourlyRate}
                        </p>
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          per session
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 font-medium"
                      >
                        Select
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 2 && bookingData.therapist && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className={`p-4 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="flex items-center space-x-3 mb-6">
                <img
                  src={bookingData.therapist.avatar}
                  alt={bookingData.therapist.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {bookingData.therapist.name}
                  </h3>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {bookingData.therapist.title}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={bookingData.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value, time: '' }))}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-3 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Available Time Slots
                  </label>
                  
                  {(() => {
                    const availableSlots = getAvailableTimeSlots(bookingData.date, bookingData.therapist);
                    
                    if (availableSlots.length === 0) {
                      return (
                        <div className={`p-4 rounded-lg text-center ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <Clock className={`w-8 h-8 mx-auto mb-2 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <p className={`${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {bookingData.date < new Date().toISOString().split('T')[0] 
                              ? 'Please select a future date'
                              : bookingData.date === new Date().toISOString().split('T')[0]
                              ? 'No more slots available today. Please select a future date.'
                              : 'No available slots for this date'
                            }
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-3 gap-3">
                        {availableSlots.map((slot) => {
                          const timeOnly = formatTimeSlot(slot);
                          const isBooked = isTimeSlotBooked(bookingData.therapist!.id, bookingData.date, timeOnly);
                          
                          return (
                            <motion.button
                              key={slot}
                              whileHover={{ scale: isBooked ? 1 : 1.05 }}
                              whileTap={{ scale: isBooked ? 1 : 0.95 }}
                              onClick={() => !isBooked && handleDateTimeSelect(bookingData.date, timeOnly)}
                              disabled={isBooked}
                              className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                                isBooked
                                  ? theme === 'dark'
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : bookingData.time === timeOnly
                                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                  : theme === 'dark'
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {timeOnly}
                              {isBooked && (
                                <div className="text-xs mt-1 opacity-60">
                                  Booked
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {bookingData.time && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentStep(1)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentStep(3)}
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 font-medium"
                    >
                      Continue
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 3 && bookingData.therapist && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className={`p-4 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                Confirm Your Booking
              </h3>

              <div className="space-y-4 mb-6">
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    Session Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Therapist:
                      </span>
                      <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                        {bookingData.therapist.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Date:
                      </span>
                      <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                        {new Date(bookingData.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Time:
                      </span>
                      <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                        {bookingData.time}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Duration:
                      </span>
                      <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                        {bookingData.duration} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Session Type:
                      </span>
                      <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                        {bookingData.sessionType === 'video' ? 'Video Call' : 
                         bookingData.sessionType === 'phone' ? 'Phone Call' : 'In-Person'}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Total Cost:
                      </span>
                      <span className="text-green-600">
                        ${bookingData.therapist.hourlyRate}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Session Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'video', label: 'Video Call', icon: Video },
                      { value: 'phone', label: 'Phone Call', icon: Phone },
                      { value: 'in-person', label: 'In-Person', icon: MapPin }
                    ].map((type) => (
                      <motion.button
                        key={type.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setBookingData(prev => ({ ...prev, sessionType: type.value as any }))}
                        className={`p-3 rounded-lg font-medium transition-all duration-200 ${
                          bookingData.sessionType === type.value
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                            : theme === 'dark'
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <type.icon className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs">{type.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Any specific topics you'd like to discuss or concerns you have..."
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentStep(2)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBookingConfirm}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 font-medium"
                >
                  Confirm Booking
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default BookingPage;