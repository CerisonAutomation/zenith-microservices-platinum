import { useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, MapPin, Zap, TrendingUp } from "lucide-react";
import ProfileCard from "../profile/ProfileCard";
import FilterDialog from "../filters/FilterDialog";
import { Button } from "../ui/button";

// Mock data
const mockProfiles = [
  {
    id: "1",
    name: "Alex",
    age: 28,
    distance: "0.5 km",
    online: true,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
    ],
    bio: "Adventure seeker 🏔️ | Coffee enthusiast ☕ | Love hiking and exploring new places",
    verified: true,
    meetNow: true,
    videoVerified: true,
    responseRate: 95,
    lastActive: "2m ago",
  },
  {
    id: "2",
    name: "Jordan",
    age: 25,
    distance: "1.2 km",
    online: true,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    ],
    bio: "Fitness & wellness 💪 | Dog lover 🐕 | Personal trainer",
    verified: false,
    meetNow: false,
    videoVerified: false,
    responseRate: 88,
    lastActive: "1h ago",
  },
  {
    id: "3",
    name: "Sam",
    age: 30,
    distance: "2.1 km",
    online: false,
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
    bio: "Artist & musician 🎨🎵 | Creative soul",
    verified: true,
    meetNow: false,
    videoVerified: true,
    responseRate: 92,
    lastActive: "3h ago",
  },
  {
    id: "4",
    name: "Taylor",
    age: 27,
    distance: "3.5 km",
    online: true,
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    bio: "Foodie | Travel enthusiast ✈️ | Always planning the next adventure",
    verified: true,
    meetNow: true,
    videoVerified: false,
    responseRate: 90,
    lastActive: "5m ago",
  },
  {
    id: "5",
    name: "Morgan",
    age: 29,
    distance: "4.2 km",
    online: false,
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    bio: "Tech geek 💻 | Gamer 🎮 | Software engineer",
    verified: false,
    meetNow: false,
    videoVerified: false,
    responseRate: 75,
    lastActive: "1d ago",
  },
  {
    id: "6",
    name: "Casey",
    age: 26,
    distance: "5.0 km",
    online: true,
    photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
    bio: "Yoga instructor 🧘 | Nature lover 🌿 | Mindfulness advocate",
    verified: true,
    meetNow: false,
    videoVerified: true,
    responseRate: 97,
    lastActive: "10m ago",
  },
];

export default function ExploreTab() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [profiles] = useState(mockProfiles);
  const [viewMode, setViewMode] = useState<"all" | "meetNow" | "trending">("all");

  const filteredProfiles = profiles.filter(profile => {
    if (viewMode === "meetNow") return profile.meetNow;
    if (viewMode === "trending") return profile.responseRate && profile.responseRate > 90;
    return true;
  });

  const meetNowCount = profiles.filter(p => p.meetNow).length;

  return (
    <div className="min-h-screen">
      {/* Header - Ultra Compact Premium */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-purple-900/95 via-purple-800/95 to-amber-900/95 backdrop-blur-xl border-b border-amber-500/20 shadow-2xl">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-light tracking-wide bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 bg-clip-text text-transparent">
              Discover
            </h1>
            <Button
              onClick={() => setFilterOpen(true)}
              variant="ghost"
              size="icon"
              className="rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-200" />
            </Button>
          </div>
          
          {/* Combined stats and filters in single row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-light text-amber-100/80">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>{profiles.length} nearby</span>
              {meetNowCount > 0 && (
                <>
                  <span className="text-amber-400/60">•</span>
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">{meetNowCount} now</span>
                </>
              )}
            </div>

            {/* View Mode Filters - Premium Styling */}
            <div className="flex gap-1.5">
              <Button
                onClick={() => setViewMode("all")}
                size="sm"
                className={`rounded-full text-xs font-light px-3 py-1 transition-all duration-300 ${
                  viewMode === "all"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 border border-amber-400/30"
                    : "bg-purple-800/30 text-amber-200/70 hover:bg-purple-700/40 border border-purple-600/30 hover:border-amber-500/40"
                }`}
              >
                All
              </Button>
              <Button
                onClick={() => setViewMode("meetNow")}
                size="sm"
                className={`rounded-full text-xs font-light px-3 py-1 transition-all duration-300 flex items-center gap-1 ${
                  viewMode === "meetNow"
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/30"
                    : "bg-purple-800/30 text-amber-200/70 hover:bg-purple-700/40 border border-purple-600/30 hover:border-emerald-500/40"
                }`}
              >
                <Zap className="w-3 h-3" />
                Now
              </Button>
              <Button
                onClick={() => setViewMode("trending")}
                size="sm"
                className={`rounded-full text-xs font-light px-3 py-1 transition-all duration-300 flex items-center gap-1 ${
                  viewMode === "trending"
                    ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30 border border-orange-400/30"
                    : "bg-purple-800/30 text-amber-200/70 hover:bg-purple-700/40 border border-purple-600/30 hover:border-orange-500/40"
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                Hot
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid - Optimized for more profiles */}
      <div className="p-2">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {filteredProfiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProfileCard profile={profile} />
            </motion.div>
          ))}
        </motion.div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400">No profiles match your filters</p>
            <Button
              onClick={() => setViewMode("all")}
              variant="outline"
              className="mt-4 border-white/20 hover:bg-white/10 text-sm"
            >
              View All Profiles
            </Button>
          </div>
        )}
      </div>

      <FilterDialog open={filterOpen} onOpenChange={setFilterOpen} />
    </div>
  );
}