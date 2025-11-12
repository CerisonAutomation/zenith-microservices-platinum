/**
 * Senior Platinum Tab - Exclusive 30+ Executive Dating Experience
 * PLATINUM TIER ONLY - Senior Level Members
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Shield,
  Briefcase,
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
  Star,
  Sparkles,
  Award,
  Globe,
  Phone,
  MessageSquare,
  Filter,
  ChevronDown,
  Users,
  Wine,
  Plane,
  Building2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useApp } from "@/contexts/AppContext";
import type {
  DatingProfile,
  ProfessionalProfile,
  ExecutiveEvent,
  ConciergeRequest,
} from "@/types/dating.types";
import { DATING_APP_CONFIG } from "@/config/dating-app.config";

interface PlatinumProfile extends DatingProfile {
  isPlatinum: true;
  professionalProfile: ProfessionalProfile;
}

export default function SeniorPlatinumTab() {
  const { profiles } = useApp();
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIncomeTier, setSelectedIncomeTier] = useState<string | null>(null);
  const [minAge, setMinAge] = useState(30);
  const [showConcierge, setShowConcierge] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  // Filter for 30+ platinum members only
  const platinumProfiles: PlatinumProfile[] = profiles
    .filter((p) => p.age >= 30)
    .map((p) => ({
      ...p,
      isPlatinum: true as const,
      subscriptionTier: "platinum" as const,
      professionalProfile: {
        id: `prof-${p.id}`,
        userId: p.id,
        category: ["executive", "entrepreneur", "medical", "legal", "finance"][
          Math.floor(Math.random() * 5)
        ] as ProfessionalProfile["category"],
        jobTitle: "Senior Executive",
        company: "Fortune 500 Company",
        industry: "Technology",
        yearsOfExperience: 10 + Math.floor(Math.random() * 15),
        education: [
          {
            degree: "MBA",
            school: "Harvard Business School",
            graduationYear: 2010,
          },
        ],
        incomeVerified: true,
        incomeTier: ["tier2", "tier3", "tier4"][Math.floor(Math.random() * 3)] as
          | "tier2"
          | "tier3"
          | "tier4",
        verificationDate: new Date(),
        backgroundCheck: {
          criminal: { completed: true, passed: true, completedAt: new Date() },
          employment: { completed: true, verified: true, completedAt: new Date() },
          education: { completed: true, verified: true, completedAt: new Date() },
        },
        documents: [],
        verificationStatus: "verified" as const,
        verifiedAt: new Date(),
        linkedInProfile: `https://linkedin.com/in/${p.username}`,
      },
    }));

  const filteredProfiles = platinumProfiles.filter((profile) => {
    if (selectedCategory && profile.professionalProfile.category !== selectedCategory) {
      return false;
    }
    if (
      selectedIncomeTier &&
      profile.professionalProfile.incomeTier !== selectedIncomeTier
    ) {
      return false;
    }
    if (profile.age < minAge) {
      return false;
    }
    return true;
  });

  // Mock executive events
  const upcomingEvents: ExecutiveEvent[] = [
    {
      id: "event-1",
      title: "Platinum Members Yacht Party",
      description:
        "Exclusive networking event aboard a luxury yacht. Wine, dining, and meaningful connections.",
      type: "yacht_party",
      venue: {
        name: "Marina Del Rey Yacht Club",
        address: "4455 Admiralty Way",
        city: "Marina Del Rey, CA",
      },
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      capacity: 50,
      attendeesCount: 32,
      platinumOnly: true,
      minimumAge: 30,
      minimumIncomeTier: "tier2",
      dresscode: "Cocktail Attire",
      cost: 500,
      currency: "USD",
      rsvp: [],
      images: [],
      createdAt: new Date(),
    },
    {
      id: "event-2",
      title: "Executive Golf Tournament",
      description: "18 holes of golf followed by a private dinner and networking.",
      type: "golf_tournament",
      venue: {
        name: "Pebble Beach Golf Links",
        address: "1700 17 Mile Drive",
        city: "Pebble Beach, CA",
      },
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      capacity: 40,
      attendeesCount: 28,
      platinumOnly: true,
      minimumAge: 35,
      minimumIncomeTier: "tier3",
      dresscode: "Golf Attire",
      cost: 1200,
      currency: "USD",
      rsvp: [],
      images: [],
      createdAt: new Date(),
    },
    {
      id: "event-3",
      title: "Art Gallery Opening & Wine Tasting",
      description: "Contemporary art exhibition with curated wine selections.",
      type: "art_gallery",
      venue: {
        name: "Gagosian Gallery",
        address: "456 N Camden Dr",
        city: "Beverly Hills, CA",
      },
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      capacity: 60,
      attendeesCount: 45,
      platinumOnly: true,
      minimumAge: 30,
      minimumIncomeTier: "tier2",
      dresscode: "Business Formal",
      cost: 300,
      currency: "USD",
      rsvp: [],
      images: [],
      createdAt: new Date(),
    },
  ];

  const getIncomeLabel = (tier?: string) => {
    const tierConfig = DATING_APP_CONFIG.professionalVerification.incomeVerification.tiers.find(
      (t) => t.id === tier
    );
    return tierConfig?.label || "Verified";
  };

  const getCategoryLabel = (category: string) => {
    const cat = DATING_APP_CONFIG.professionalVerification.categories.find(
      (c) => c.id === category
    );
    return cat?.label || category;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Platinum Header */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-2xl border-b border-amber-500/30">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl shadow-xl">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                  Platinum Elite
                </h1>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Verified Professionals Only • 30+ Years
                </p>
              </div>
            </div>
            <Button
              onClick={() => setFilterOpen(!filterOpen)}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card className="bg-white/10 border-white/20 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {filteredProfiles.length}
                    </p>
                    <p className="text-xs text-gray-400">Elite Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-amber-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{upcomingEvents.length}</p>
                    <p className="text-xs text-gray-400">Upcoming Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">100%</p>
                    <p className="text-xs text-gray-400">Verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">24/7</p>
                    <p className="text-xs text-gray-400">Concierge</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant="outline"
              className={`border-white/20 ${
                !showConcierge && !showEvents
                  ? "bg-amber-500/20 border-amber-500/50"
                  : "bg-white/10"
              }`}
              onClick={() => {
                setShowConcierge(false);
                setShowEvents(false);
              }}
            >
              <Users className="w-4 h-4 mr-2" />
              Browse Members
            </Button>
            <Button
              variant="outline"
              className={`border-white/20 ${
                showEvents ? "bg-amber-500/20 border-amber-500/50" : "bg-white/10"
              }`}
              onClick={() => {
                setShowEvents(true);
                setShowConcierge(false);
              }}
            >
              <Wine className="w-4 h-4 mr-2" />
              Executive Events
            </Button>
            <Button
              variant="outline"
              className={`border-white/20 ${
                showConcierge ? "bg-amber-500/20 border-amber-500/50" : "bg-white/10"
              }`}
              onClick={() => {
                setShowConcierge(true);
                setShowEvents(false);
              }}
            >
              <Phone className="w-4 h-4 mr-2" />
              Concierge Service
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/40 backdrop-blur-xl border-b border-white/10 overflow-hidden"
          >
            <div className="p-6 space-y-4">
              {/* Professional Category */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Professional Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {DATING_APP_CONFIG.professionalVerification.categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      onClick={() =>
                        setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                      }
                      className={`cursor-pointer ${
                        selectedCategory === cat.id
                          ? "bg-gradient-to-r from-amber-500 to-yellow-600 border-0"
                          : "bg-white/10 border-white/20 hover:bg-white/20"
                      }`}
                    >
                      {cat.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Income Tier */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Income Tier
                </label>
                <div className="flex flex-wrap gap-2">
                  {DATING_APP_CONFIG.professionalVerification.incomeVerification.tiers.map(
                    (tier) => (
                      <Badge
                        key={tier.id}
                        onClick={() =>
                          setSelectedIncomeTier(
                            selectedIncomeTier === tier.id ? null : tier.id
                          )
                        }
                        className={`cursor-pointer ${
                          selectedIncomeTier === tier.id
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 border-0"
                            : "bg-white/10 border-white/20 hover:bg-white/20"
                        }`}
                      >
                        <DollarSign className="w-3 h-3 mr-1" />
                        {tier.label}
                      </Badge>
                    )
                  )}
                </div>
              </div>

              {/* Age Range */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Minimum Age: {minAge}
                </label>
                <input
                  type="range"
                  min="30"
                  max="70"
                  value={minAge}
                  onChange={(e) => setMinAge(parseInt(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <Button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedIncomeTier(null);
                  setMinAge(30);
                }}
                variant="outline"
                className="w-full border-white/20 hover:bg-white/10"
              >
                Reset Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="p-6">
        {/* Executive Events View */}
        {showEvents && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-amber-400" />
              Exclusive Executive Events
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-white/10 border-white/20 backdrop-blur overflow-hidden hover:border-amber-500/50 transition-all">
                    <div className="h-40 bg-gradient-to-br from-amber-600 to-purple-600 flex items-center justify-center">
                      {event.type === "yacht_party" && (
                        <Sparkles className="w-16 h-16 text-white" />
                      )}
                      {event.type === "golf_tournament" && (
                        <TrendingUp className="w-16 h-16 text-white" />
                      )}
                      {event.type === "art_gallery" && (
                        <Wine className="w-16 h-16 text-white" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg text-white mb-2">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="space-y-2 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          {event.venue.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {event.date.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          {event.attendeesCount}/{event.capacity} Attending
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3" />
                          ${event.cost} {event.currency}
                        </div>
                      </div>
                      <Button className="w-full mt-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700">
                        RSVP Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Concierge Service View */}
        {showConcierge && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/10 border-white/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Phone className="w-6 h-6 text-amber-400" />
                  24/7 Platinum Concierge Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-400">
                  Your personal concierge is available to assist with date planning,
                  travel arrangements, venue reservations, and exclusive event access.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="border-white/20 hover:bg-white/10 h-24 flex-col"
                  >
                    <Calendar className="w-8 h-8 mb-2 text-amber-400" />
                    <span>Plan a Date</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 hover:bg-white/10 h-24 flex-col"
                  >
                    <Plane className="w-8 h-8 mb-2 text-blue-400" />
                    <span>Travel Concierge</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 hover:bg-white/10 h-24 flex-col"
                  >
                    <Building2 className="w-8 h-8 mb-2 text-purple-400" />
                    <span>Venue Recommendations</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 hover:bg-white/10 h-24 flex-col"
                  >
                    <MessageSquare className="w-8 h-8 mb-2 text-green-400" />
                    <span>Chat with Concierge</span>
                  </Button>
                </div>

                <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-sm text-amber-200">
                    <span className="font-bold">Premium Service:</span> Average response
                    time under 15 minutes. Available 24/7/365.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Members Grid */}
        {!showConcierge && !showEvents && (
          <>
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-20">
                <Crown className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  No members match your filters
                </p>
                <Button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedIncomeTier(null);
                    setMinAge(30);
                  }}
                  className="mt-4 bg-gradient-to-r from-amber-500 to-yellow-600"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {filteredProfiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-white/10 border-amber-500/30 backdrop-blur overflow-hidden hover:border-amber-500 transition-all group">
                      {/* Profile Image */}
                      <div className="relative h-64 bg-gradient-to-br from-purple-600 to-amber-600">
                        {profile.photos && profile.photos[0] ? (
                          <img
                            src={profile.photos[0].url}
                            alt={profile.displayName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold">
                            {profile.displayName[0]}
                          </div>
                        )}

                        {/* Platinum Badge */}
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-yellow-600 p-2 rounded-full shadow-xl">
                          <Crown className="w-5 h-5 text-white" />
                        </div>

                        {/* Verified Badge */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <div className="bg-white/95 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                            <Shield className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="bg-white/95 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                            <Briefcase className="w-4 h-4 text-purple-600" />
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        {/* Name & Age */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-xl text-white">
                              {profile.displayName}
                            </h3>
                            <p className="text-gray-400">{profile.age} years</p>
                          </div>
                          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        </div>

                        {/* Professional Info */}
                        <div className="space-y-2 mb-4">
                          <Badge className="bg-purple-500/20 border-purple-500/50 text-purple-200">
                            <Briefcase className="w-3 h-3 mr-1" />
                            {getCategoryLabel(profile.professionalProfile.category)}
                          </Badge>
                          <Badge className="bg-green-500/20 border-green-500/50 text-green-200">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {getIncomeLabel(profile.professionalProfile.incomeTier)}
                          </Badge>
                        </div>

                        {/* Location */}
                        {profile.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                            <MapPin className="w-4 h-4" />
                            {profile.location.city}
                          </div>
                        )}

                        {/* Bio */}
                        {profile.bio && (
                          <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                            {profile.bio}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            className="border-amber-500/50 hover:bg-amber-500/20"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
