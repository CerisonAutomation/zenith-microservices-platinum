'use client';

import { motion } from "framer-motion";
import { MessageCircle, Heart, Ban, Share2, MapPin, CheckCircle, Calendar, Video, Shield, Zap } from "lucide-react";
import { useState, useCallback, memo, useMemo } from "react";
import Image from "next/image";
import { Dialog, DialogContent, Button, Badge } from "@zenith/ui-components";
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

const ProfileCard = memo(function ProfileCard({ profile }: ProfileCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  const allPhotos = useMemo(() => profile.photos || [profile.photo], [profile.photos, profile.photo]);

  const handleOpenDetail = useCallback(() => {
    setDetailOpen(true);
  }, []);

  const handleStopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleBookingClick = useCallback(() => {
    setDetailOpen(false);
    setBookingOpen(true);
  }, []);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative group cursor-pointer"
        onClick={handleOpenDetail}
        role="button"
        aria-label={`View ${profile.name}'s profile, ${profile.age} years old, ${profile.distance} away${profile.online ? ', currently online' : ''}${profile.verified ? ', verified' : ''}`}
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenDetail();
          }
        }}
      >
        <article className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10">
          <Image
            src={profile.photo}
            alt={`${profile.name}, ${profile.age} years old`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            priority={false}
          />

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {profile.online && (
              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg" aria-label="Online now" role="status" />
            )}
            {profile.meetNow && (
              <Badge className="bg-green-500 text-white border-0 text-xs" role="status" aria-label="Available to meet now">
                <Zap className="w-3 h-3 mr-1" aria-hidden="true" />
                Now
              </Badge>
            )}
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" aria-hidden="true" />

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white">
                {profile.name}, {profile.age}
              </h3>
              {profile.verified && (
                <CheckCircle className="w-4 h-4 text-blue-400 fill-blue-400" aria-label="Verified profile" />
              )}
              {profile.videoVerified && (
                <Shield className="w-4 h-4 text-green-400 fill-green-400" aria-label="Video verified" />
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-300">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              <span>{profile.distance}</span>
            </div>
          </div>

          {/* Quick actions on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              onClick={handleStopPropagation}
              aria-label={`Add ${profile.name} to favorites`}
            >
              <Heart className="w-5 h-5" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              onClick={handleStopPropagation}
              aria-label={`Send message to ${profile.name}`}
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </article>
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
                    <CarouselItem key={`${profile.id}-photo-${index}`}>
                      <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
                        <Image
                          src={photo}
                          alt={`${profile.name} ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 700px"
                          className="object-cover"
                          priority={index === 0}
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
                  {profile.kinks.map((kink, idx) => (
                    <Badge key={`${profile.id}-kink-${idx}`} variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">
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
                  {profile.roles.map((role, idx) => (
                    <Badge key={`${profile.id}-role-${idx}`} variant="outline" className="bg-pink-500/20 border-pink-500/30 text-pink-300">
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
                onClick={handleBookingClick}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                aria-label={`Book a meeting with ${profile.name}`}
              >
                <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
                Book Meet
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600" aria-label={`Start video call with ${profile.name}`}>
                <Video className="w-4 h-4 mr-2" aria-hidden="true" />
                Video Call
              </Button>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" aria-label={`Send message to ${profile.name}`}>
                <MessageCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                Message
              </Button>
              <Button variant="outline" size="icon" className="border-white/20 hover:bg-white/10" aria-label={`Add ${profile.name} to favorites`}>
                <Heart className="w-5 h-5" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="icon" className="border-white/20 hover:bg-white/10" aria-label={`Share ${profile.name}'s profile`}>
                <Share2 className="w-5 h-5" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="icon" className="border-white/20 hover:bg-white/10 hover:border-red-500 hover:text-red-500" aria-label={`Block ${profile.name}`}>
                <Ban className="w-5 h-5" aria-hidden="true" />
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
        profileKinks={profile.kinks}
        profileRoles={profile.roles}
        profileBookingPreferences={profile.bookingPreferences}
      />
    </>
  );
});

export default ProfileCard;