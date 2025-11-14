import { Calendar, Clock, MapPin, Coffee, Utensils, Wine, Activity, Video, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Badge, Card, Label } from "@zenith/ui-components";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useState } from "react";
import { format, addDays } from "date-fns";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
  profilePhoto: string;
  profileKinks?: string[];
  profileRoles?: string[];
  profileBookingPreferences?: {
    preferredMeetingTypes: string[];
    availability: string[];
    budgetRange: [number, number];
    communicationStyle: string[];
    safetyPreferences: string[];
    specialRequests: string[];
  };
}

const meetingTypes = [
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "dinner", label: "Dinner", icon: Utensils },
  { id: "drinks", label: "Drinks", icon: Wine },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "video", label: "Video Call", icon: Video },
  { id: "phone", label: "Phone Call", icon: Phone },
];

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
];

export default function BookingDialog({ 
  open, 
  onOpenChange, 
  profileName, 
  profilePhoto,
  profileKinks = [],
  profileRoles = [],
  profileBookingPreferences
}: BookingDialogProps) {
  const [selectedType, setSelectedType] = useState("coffee");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState("18:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [meetNow, setMeetNow] = useState(false);
  const [selectedKinks, setSelectedKinks] = useState<string[]>(profileKinks);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(profileRoles);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const handleBooking = () => {
    // Handle booking logic

      selectedType, 
      selectedDate, 
      selectedTime, 
      location, 
      notes, 
      meetNow,
      kinks: selectedKinks,
      roles: selectedRoles,
      bookingPreferences: profileBookingPreferences
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-900/95 via-black/95 to-pink-900/95 backdrop-blur-xl border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <img src={profilePhoto} alt={profileName} className="w-12 h-12 rounded-full border-2 border-white/20" />
            Book a Meet with {profileName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meet Now Option */}
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <h3 className="font-semibold text-white">Available Now</h3>
                  <p className="text-sm text-gray-300">Meet within the next hour</p>
                </div>
              </div>
              <Button
                onClick={() => setMeetNow(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                Meet Now
              </Button>
            </div>
          </Card>

          {/* Meeting Type */}
          <div className="space-y-3">
            <Label className="text-base">Meeting Type</Label>
            <div className="grid grid-cols-3 gap-3">
              {meetingTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedType === type.id
                        ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-500"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2 mx-auto" />
                    <p className="text-sm text-center">{type.label}</p>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <Label className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select Date
            </Label>
            <div className="grid grid-cols-7 gap-2">
              {dates.map((date) => (
                <Card
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 cursor-pointer transition-all text-center ${
                    selectedDate.toDateString() === date.toDateString()
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 border-0"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="text-xs text-gray-400">{format(date, "EEE")}</div>
                  <div className="text-lg font-bold">{format(date, "d")}</div>
                </Card>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <Label className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Time
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="bg-white/10 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-white/20">
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location (Optional)
            </Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="bg-white/10 border-white/20">
                <SelectValue placeholder="Choose a location or suggest one" />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-white/20">
                <SelectItem value="starbucks">Starbucks Downtown</SelectItem>
                <SelectItem value="park">Central Park</SelectItem>
                <SelectItem value="restaurant">Italian Restaurant</SelectItem>
                <SelectItem value="bar">Rooftop Bar</SelectItem>
                <SelectItem value="custom">Custom Location</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kinks & Roles */}
          {profileKinks.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base">Kinks & Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {profileKinks.map((kink) => (
                  <Badge 
                    key={kink}
                    variant={selectedKinks.includes(kink) ? "default" : "outline"}
                    className="cursor-pointer bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30"
                    onClick={() => {
                      setSelectedKinks(prev => 
                        prev.includes(kink) 
                          ? prev.filter(k => k !== kink)
                          : [...prev, kink]
                      );
                    }}
                  >
                    {kink}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profileRoles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base">Roles & Dynamics</Label>
              <div className="flex flex-wrap gap-2">
                {profileRoles.map((role) => (
                  <Badge 
                    key={role}
                    variant={selectedRoles.includes(role) ? "default" : "outline"}
                    className="cursor-pointer bg-pink-500/20 border-pink-500/30 hover:bg-pink-500/30"
                    onClick={() => {
                      setSelectedRoles(prev => 
                        prev.includes(role) 
                          ? prev.filter(r => r !== role)
                          : [...prev, role]
                      );
                    }}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Profile Preferences Info */}
          {profileBookingPreferences && (
            <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30 p-4">
              <h4 className="font-semibold text-blue-300 mb-2">📋 {profileName}'s Preferences</h4>
              <div className="space-y-2 text-sm text-blue-200">
                {profileBookingPreferences.preferredMeetingTypes.length > 0 && (
                  <p><span className="font-medium">Preferred Meeting Types:</span> {profileBookingPreferences.preferredMeetingTypes.join(", ")}</p>
                )}
                {profileBookingPreferences.availability.length > 0 && (
                  <p><span className="font-medium">Availability:</span> {profileBookingPreferences.availability.join(", ")}</p>
                )}
                {profileBookingPreferences.budgetRange && (
                  <p><span className="font-medium">Budget Range:</span> ${profileBookingPreferences.budgetRange[0]} - ${profileBookingPreferences.budgetRange[1]}</p>
                )}
                {profileBookingPreferences.communicationStyle.length > 0 && (
                  <p><span className="font-medium">Communication Style:</span> {profileBookingPreferences.communicationStyle.join(", ")}</p>
                )}
                {profileBookingPreferences.safetyPreferences.length > 0 && (
                  <p><span className="font-medium">Safety Preferences:</span> {profileBookingPreferences.safetyPreferences.join(", ")}</p>
                )}
                {profileBookingPreferences.specialRequests.length > 0 && (
                  <p><span className="font-medium">Special Requests:</span> {profileBookingPreferences.specialRequests.join(", ")}</p>
                )}
              </div>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <Label className="text-base">Additional Notes</Label>
            <Textarea
              placeholder="Any special requests or preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-white/20 hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBooking}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Confirm Booking
            </Button>
          </div>

          {/* Info */}
          <Card className="bg-blue-500/10 border-blue-500/30 p-4">
            <p className="text-sm text-blue-300">
              💡 Your booking request will be sent to {profileName}. They'll have 24 hours to confirm.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
