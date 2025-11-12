/**
 * Booking System Component
 *
 * Features:
 * - Date and time selection
 * - Duration and pricing calculator
 * - Safety features (ID verification, deposit)
 * - Abuse protection (no-show reporting, day bans)
 * - Terms acceptance
 * - Location options (host, travel, public)
 * - Service selection
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  User,
  Home,
  Car,
  Building,
  Heart,
  MessageCircle,
  X,
  ChevronRight,
  Star,
  Flag,
} from 'lucide-react';
import type { DatingProfile, Booking } from '@/types/dating.types';

interface BookingSystemProps {
  boyfriend: DatingProfile;
  client: DatingProfile;
  onComplete: (booking: Partial<Booking>) => void;
  onCancel: () => void;
}

export function BookingSystem({ boyfriend, client, onComplete, onCancel }: BookingSystemProps) {
  const [step, setStep] = useState<'datetime' | 'location' | 'services' | 'confirm'>('datetime');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState(2); // hours
  const [locationType, setLocationType] = useState<'host' | 'travel' | 'public'>('public');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [requiresDeposit, setRequiresDeposit] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  // Calculate pricing
  const hourlyRate = boyfriend.availability?.hourlyRate || 0;
  const baseRate = hourlyRate * duration;
  const depositAmount = baseRate * 0.3; // 30% deposit
  const total = baseRate;

  const handleNext = () => {
    const steps = ['datetime', 'location', 'services', 'confirm'] as const;
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps = ['datetime', 'location', 'services', 'confirm'] as const;
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleConfirm = () => {
    if (!termsAccepted) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
      return;
    }

    const booking: Partial<Booking> = {
      clientId: client.id,
      boyfriendId: boyfriend.id,
      status: 'pending',
      date: selectedDate!,
      duration,
      location: {
        type: locationType,
        address: '', // Would be filled from form
      },
      pricing: {
        baseRate: hourlyRate,
        duration,
        total,
        currency: boyfriend.availability?.currency || 'USD',
      },
      services: selectedServices,
      notes,
      requiresIDVerification: true,
      requiresDeposit,
      depositAmount: requiresDeposit ? depositAmount : 0,
      depositPaid: false,
      createdAt: new Date(),
    };

    onComplete(booking);
  };

  const canProceed = () => {
    switch (step) {
      case 'datetime':
        return selectedDate && selectedTime;
      case 'location':
        return locationType !== null;
      case 'services':
        return selectedServices.length > 0;
      case 'confirm':
        return termsAccepted;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl bg-gradient-to-br from-purple-900/50 via-black to-pink-900/50 rounded-2xl border-2 border-purple-500/30 overflow-hidden"
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left Side - Profile Summary */}
          <div className="bg-black/40 p-6 border-r border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Booking Details</h2>
              <button
                onClick={onCancel}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Boyfriend Profile */}
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={boyfriend.photos[0]?.url} />
                    <AvatarFallback>{boyfriend.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-white font-bold text-lg">{boyfriend.displayName}</h3>
                    <p className="text-gray-400">@{boyfriend.username}</p>
                    {boyfriend.verified.id && (
                      <Badge className="mt-1 bg-blue-500 text-white border-0">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">4.9</span>
                    </div>
                    <p className="text-xs text-gray-400">Rating</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="font-bold text-white mb-1">127</p>
                    <p className="text-xs text-gray-400">Bookings</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{boyfriend.location.city}</span>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Hourly rate</span>
                  <span className="font-semibold">
                    ${hourlyRate}/{boyfriend.availability?.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Duration</span>
                  <span className="font-semibold">{duration} hours</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-2xl font-bold text-amber-400">${total}</span>
                </div>
                {requiresDeposit && (
                  <Alert className="bg-amber-500/10 border-amber-500/30">
                    <Info className="h-4 w-4 text-amber-400" />
                    <AlertDescription className="text-amber-200 text-xs">
                      30% deposit (${depositAmount.toFixed(2)}) required to confirm
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Safety Notice */}
            <Alert className="mt-6 bg-green-500/10 border-green-500/30">
              <Shield className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200 text-xs">
                All bookings require ID verification. Report no-shows to prevent abuse.
              </AlertDescription>
            </Alert>
          </div>

          {/* Right Side - Booking Form */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              {step === 'datetime' && (
                <DateTimeStep
                  key="datetime"
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  duration={duration}
                  availability={boyfriend.availability}
                  onDateChange={setSelectedDate}
                  onTimeChange={setSelectedTime}
                  onDurationChange={setDuration}
                />
              )}

              {step === 'location' && (
                <LocationStep
                  key="location"
                  selected={locationType}
                  availability={boyfriend.availability}
                  onChange={setLocationType}
                />
              )}

              {step === 'services' && (
                <ServicesStep
                  key="services"
                  selected={selectedServices}
                  available={boyfriend.availability?.services || []}
                  notes={notes}
                  onChange={setSelectedServices}
                  onNotesChange={setNotes}
                />
              )}

              {step === 'confirm' && (
                <ConfirmStep
                  key="confirm"
                  booking={{
                    boyfriend,
                    date: selectedDate!,
                    time: selectedTime,
                    duration,
                    location: locationType,
                    services: selectedServices,
                    total,
                    deposit: requiresDeposit ? depositAmount : 0,
                  }}
                  termsAccepted={termsAccepted}
                  onTermsChange={setTermsAccepted}
                  showWarning={showWarning}
                />
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 'datetime'}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>

              {step !== 'confirm' ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleConfirm}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                >
                  Confirm Booking
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Date & Time Step
function DateTimeStep({
  selectedDate,
  selectedTime,
  duration,
  availability,
  onDateChange,
  onTimeChange,
  onDurationChange,
}: any) {
  const durations = [1, 2, 3, 4, 6, 8];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-400" />
          Select Date & Time
        </h3>
        <p className="text-gray-300">Choose when you'd like to meet</p>
      </div>

      {/* Date Picker (simplified) */}
      <div>
        <Label className="text-white mb-3 block">Date</Label>
        <input
          type="date"
          value={selectedDate?.toISOString().split('T')[0] || ''}
          onChange={(e) => onDateChange(new Date(e.target.value))}
          min={new Date().toISOString().split('T')[0]}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
        />
      </div>

      {/* Time Picker */}
      <div>
        <Label className="text-white mb-3 block">Time</Label>
        <div className="grid grid-cols-4 gap-2">
          {['10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00'].map((time) => (
            <button
              key={time}
              onClick={() => onTimeChange(time)}
              className={`
                p-3 rounded-lg border-2 transition-all
                ${
                  selectedTime === time
                    ? 'bg-purple-600/30 border-purple-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                }
              `}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <Label className="text-white mb-3 block flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Duration
        </Label>
        <div className="grid grid-cols-6 gap-2">
          {durations.map((hrs) => (
            <button
              key={hrs}
              onClick={() => onDurationChange(hrs)}
              className={`
                p-3 rounded-lg border-2 transition-all
                ${
                  duration === hrs
                    ? 'bg-pink-600/30 border-pink-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                }
              `}
            >
              {hrs}h
            </button>
          ))}
        </div>
      </div>

      {/* Available Days Info */}
      {availability && (
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200 text-sm">
            Available: {availability.availableDays.map((d: string) => d.toUpperCase()).join(', ')}
          </AlertDescription>
        </Alert>
      )}
    </motion.div>
  );
}

// Location Step
function LocationStep({ selected, availability, onChange }: any) {
  const options = [
    {
      id: 'public',
      name: 'Public Place',
      description: 'Meet at a cafe, restaurant, or public venue',
      icon: Building,
      available: true,
    },
    {
      id: 'host',
      name: 'Your Place',
      description: 'Host at your location',
      icon: Home,
      available: availability?.location?.canHost || false,
    },
    {
      id: 'travel',
      name: 'Boyfriend Travels',
      description: 'Meet at your preferred location',
      icon: Car,
      available: availability?.location?.willTravel || false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-purple-400" />
          Choose Location
        </h3>
        <p className="text-gray-300">Where would you like to meet?</p>
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => option.available && onChange(option.id)}
              disabled={!option.available}
              className={`
                w-full p-5 rounded-lg border-2 transition-all text-left
                ${
                  selected === option.id
                    ? 'bg-purple-600/30 border-purple-500'
                    : option.available
                    ? 'bg-white/5 border-white/10 hover:border-white/30'
                    : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selected === option.id
                      ? 'bg-purple-500'
                      : 'bg-white/10'
                  }`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                    {option.name}
                    {!option.available && (
                      <Badge variant="outline" className="text-xs">
                        Not Available
                      </Badge>
                    )}
                  </h4>
                  <p className="text-sm text-gray-400">{option.description}</p>
                </div>
                {selected === option.id && (
                  <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// Services Step
function ServicesStep({ selected, available, notes, onChange, onNotesChange }: any) {
  const toggle = (service: string) => {
    const newSelected = selected.includes(service)
      ? selected.filter((s: string) => s !== service)
      : [...selected, service];
    onChange(newSelected);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-400" />
          Services & Details
        </h3>
        <p className="text-gray-300">What would you like to do together?</p>
      </div>

      {/* Services */}
      <div>
        <Label className="text-white mb-3 block">Services</Label>
        <div className="flex flex-wrap gap-2">
          {(available.length > 0 ? available : ['Companionship', 'Dinner Date', 'Coffee', 'Activity']).map(
            (service: string) => (
              <Badge
                key={service}
                onClick={() => toggle(service)}
                className={`
                  cursor-pointer transition-all px-4 py-2
                  ${
                    selected.includes(service)
                      ? 'bg-pink-600 text-white border-pink-500'
                      : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                  }
                `}
              >
                {service}
              </Badge>
            )
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label className="text-white mb-3 block">Special Requests (Optional)</Label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Any special requests or things you'd like to mention..."
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 min-h-[100px]"
          maxLength={500}
        />
        <p className="text-xs text-gray-400 mt-1">{notes.length}/500</p>
      </div>
    </motion.div>
  );
}

// Confirm Step
function ConfirmStep({ booking, termsAccepted, onTermsChange, showWarning }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-400" />
          Confirm Booking
        </h3>
        <p className="text-gray-300">Review your booking details</p>
      </div>

      {/* Summary */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Date</span>
            <span className="text-white font-semibold">
              {booking.date?.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Time</span>
            <span className="text-white font-semibold">{booking.time}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Duration</span>
            <span className="text-white font-semibold">{booking.duration} hours</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Location</span>
            <span className="text-white font-semibold capitalize">
              {booking.location.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Services</span>
            <span className="text-white font-semibold">
              {booking.services.slice(0, 2).join(', ')}
              {booking.services.length > 2 && ` +${booking.services.length - 2}`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <div className="space-y-4">
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 border border-white/10">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => onTermsChange(checked as boolean)}
            className="mt-1"
          />
          <div className="flex-1">
            <Label
              htmlFor="terms"
              className="text-white font-semibold cursor-pointer flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-green-400" />
              I accept the booking terms
            </Label>
            <p className="text-sm text-gray-400 mt-1">
              • Show valid ID upon meeting
              <br />
              • Treat each other with respect
              <br />
              • Report no-shows within 24 hours
              <br />• Cancel at least 24h in advance for refund
            </p>
          </div>
        </div>

        {showWarning && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              You must accept the booking terms to proceed
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Safety Warning */}
      <Alert className="bg-amber-500/10 border-amber-500/30">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-amber-200 text-sm">
          <strong>Safety First:</strong> Always meet in public places for first dates. Trust your
          instincts. Report suspicious behavior immediately.
        </AlertDescription>
      </Alert>

      {/* Deposit Info */}
      {booking.deposit > 0 && (
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <DollarSign className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200 text-sm">
            A ${booking.deposit.toFixed(2)} deposit will be charged to secure your booking.
            Remaining ${(booking.total - booking.deposit).toFixed(2)} due upon meeting.
          </AlertDescription>
        </Alert>
      )}
    </motion.div>
  );
}
