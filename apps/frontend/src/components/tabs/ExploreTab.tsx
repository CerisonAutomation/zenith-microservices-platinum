import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, MapPin, Zap, TrendingUp, Loader2 } from "lucide-react";
import ProfileCard from "../profile/ProfileCard";
import FilterDialog from "../filters/FilterDialog";
import { Button, Badge } from "@zenith/ui-components";
import { useApp } from "@/contexts/AppContext";

export default function ExploreTab() {
  const { profiles, isDemoMode, refreshProfiles } = useApp();
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "meetNow" | "trending">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Refresh profiles when component mounts
    const loadProfiles = async () => {
      if (!isDemoMode) {
        setLoading(true);
        try {
          await refreshProfiles();
        } finally {
          setLoading(false);
        }
      }
    };
    loadProfiles();
  }, [isDemoMode, refreshProfiles]);

  // Map profile data to expected format for ProfileCard
  const displayProfiles = profiles.map(profile => ({
    id: profile.id,
    name: profile.name,
    age: profile.age,
    distance: profile.distance || `${Math.random() * 5 + 0.5}`.slice(0, 3) + " km",
    online: Math.random() > 0.5,
    photo: profile.avatar || profile.photo,
    photos: profile.photos || [profile.avatar],
    bio: profile.bio || "",
    verified: profile.verified || false,
    meetNow: Math.random() > 0.7,
    videoVerified: profile.verified || false,
    responseRate: profile.matchScore || Math.floor(Math.random() * 30 + 70),
    lastActive: "Recently",
  }));

  const filteredProfiles = displayProfiles.filter(profile => {
    if (viewMode === "meetNow") return profile.meetNow;
    if (viewMode === "trending") return profile.responseRate && profile.responseRate > 90;
    return true;
  });

  const meetNowCount = displayProfiles.filter(p => p.meetNow).length;

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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      <FilterDialog open={filterOpen} onOpenChange={setFilterOpen} />
    </div>
  );
}