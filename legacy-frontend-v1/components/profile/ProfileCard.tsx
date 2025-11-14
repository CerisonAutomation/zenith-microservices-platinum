import { motion } from "framer-motion";
import { MessageCircle, Heart, Ban, Share2, MapPin, CheckCircle, Calendar, Video, Shield, Zap } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import BookingDialog from "../booking/BookingDialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";

interface Profile {
  id: string;
  name: string;
  age: number;
  distance: string;
  online: boolean;
  photo: string;
  photos?: string[];
  bio: string;
  verified: boolean;
  meetNow?: boolean;
  videoVerified?: boolean;
  responseRate?: number;
  lastActive?: string;
  kinks?: string[];
  roles?: string[];
  bookingPreferences?: {
    preferredMeetingTypes: string[];
    availability: string[];
    budgetRange: [number, number];
    communicationStyle: string[];
    safetyPreferences: string[];
    specialRequests: string[];
  };
}

interface ProfileCardProps {
  profile: Profile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  const allPhotos = profile.photos || [profile.photo];

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative group cursor-pointer"
        onClick={() => setDetailOpen(true)}
      >
        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-purple-800/30 to-amber-800/30 backdrop-blur-sm border border-amber-500/20 shadow-2xl">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
          
          {/* Premium Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {profile.online && (
              <div className="w-3 h-3 bg-emerald-400 rounded-full border-2 border-amber-200 shadow-lg shadow-emerald-400/50" />
            )}
            {profile.meetNow && (
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border border-emerald-400/30 text-xs px-2 py-1 rounded-full font-light shadow-lg shadow-emerald-500/30">
                <Zap className="w-3 h-3 mr-1" />
                Now
              </div>
            )}
          </div>

          {/* Premium gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-purple-900/40 to-transparent" />

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-light tracking-wide text-amber-100">
                {profile.name}, {profile.age}
              </h3>
              {profile.verified && (
                <CheckCircle className="w-4 h-4 text-amber-400 fill-amber-400" />
              )}
              {profile.videoVerified && (
                <Shield className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              )}
            </div>
            <div className="flex items-center gap-1 text-sm font-light text-amber-200/70">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>{profile.distance}</span>
            </div>
          </div>

          {/* Premium quick actions on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/30 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Heart className="w-5 h-5 text-amber-200" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/30 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <MessageCircle className="w-5 h-5 text-purple-200" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-900/95 via-black/95 to-pink-900/95 backdrop-blur-xl border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Photo Carousel */}
            <div className="relative">
              <Carousel className="w-full">
                <CarouselContent>
                  {allPhotos.map((photo, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
                        <img
                          src={photo}
                          alt={`${profile.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {allPhotos.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>

              {/* Status Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {profile.online && (
                  <Badge className="bg-green-500 text-white border-0">
                    Online
                  </Badge>
                )}
                {profile.meetNow && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 animate-pulse">
                    <Zap className="w-3 h-3 mr-1" />
                    Available Now
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-3xl font-bold">
                  {profile.name}, {profile.age}
                </h2>
                {profile.verified && (
                  <CheckCircle className="w-6 h-6 text-blue-400 fill-blue-400" />
                )}
                {profile.videoVerified && (
                  <Shield className="w-6 h-6 text-green-400 fill-green-400" />
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.distance} away</span>
                </div>
                {profile.responseRate && (
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{profile.responseRate}% response rate</span>
                  </div>
                )}
                {profile.lastActive && (
                  <span>Active {profile.lastActive}</span>
                )}
              </div>

              <p className="text-gray-300">{profile.bio}</p>

            {/* Kinks & Roles */}
            {profile.kinks && profile.kinks.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-purple-300 mb-2">Kinks & Preferences</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.kinks.map((kink) => (
                    <Badge key={kink} variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                      {kink}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.roles && profile.roles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-pink-300 mb-2">Roles & Dynamics</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.roles.map((role) => (
                    <Badge key={role} variant="outline" className="bg-pink-500/20 border-pink-500/30 text-pink-300">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => {
                  setDetailOpen(false);
                  setBookingOpen(true);
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Meet
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <Video className="w-4 h-4 mr-2" />
                Video Call
              </Button>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" size="icon" className="border-white/20 hover:bg-white/10">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="border-white/20 hover:bg-white/10">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="border-white/20 hover:bg-white/10 hover:border-red-500 hover:text-red-500">
                <Ban className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        profileName={profile.name}
        profilePhoto={profile.photo}
        profileKinks={profile.kinks || []}
        profileRoles={profile.roles || []}
        {...(profile.bookingPreferences && { profileBookingPreferences: profile.bookingPreferences })}
      />
    </>
  );
}