import { useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, MapPin, Zap, TrendingUp } from "lucide-react";
import ProfileCard from "../profile/ProfileCard";
import FilterDialog from "../filters/FilterDialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

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
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Discover
            </h1>
            <Button
              onClick={() => setFilterOpen(true)}
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/10 hover:bg-white/20"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <MapPin className="w-4 h-4" />
            <span>{profiles.length} people nearby</span>
            {meetNowCount > 0 && (
              <>
                <span>•</span>
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-green-400">{meetNowCount} available now</span>
              </>
            )}
          </div>

          {/* View Mode Filters */}
          <div className="flex gap-2">
            <Badge
              onClick={() => setViewMode("all")}
              className={`cursor-pointer ${
                viewMode === "all"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 border-0"
                  : "bg-white/10 border-white/20 hover:bg-white/20"
              }`}
            >
              All
            </Badge>
            <Badge
              onClick={() => setViewMode("meetNow")}
              className={`cursor-pointer ${
                viewMode === "meetNow"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 border-0"
                  : "bg-white/10 border-white/20 hover:bg-white/20"
              }`}
            >
              <Zap className="w-3 h-3 mr-1" />
              Meet Now
            </Badge>
            <Badge
              onClick={() => setViewMode("trending")}
              className={`cursor-pointer ${
                viewMode === "trending"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 border-0"
                  : "bg-white/10 border-white/20 hover:bg-white/20"
              }`}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
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
          <div className="text-center py-20">
            <p className="text-gray-400">No profiles match your filters</p>
            <Button
              onClick={() => setViewMode("all")}
              variant="outline"
              className="mt-4 border-white/20 hover:bg-white/10"
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