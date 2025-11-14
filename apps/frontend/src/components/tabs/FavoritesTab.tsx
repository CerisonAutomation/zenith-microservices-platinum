'use client';

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { memo } from "react";
import ProfileCard from "../profile/ProfileCard";

const mockFavorites = [
  {
    id: "1",
    name: "Alex",
    age: 28,
    distance: "0.5 km",
    online: true,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    bio: "Adventure seeker 🏔️ | Coffee enthusiast ☕",
    verified: true,
  },
  {
    id: "4",
    name: "Taylor",
    age: 27,
    distance: "3.5 km",
    online: true,
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    bio: "Foodie | Travel enthusiast ✈️",
    verified: true,
  },
  {
    id: "6",
    name: "Casey",
    age: 26,
    distance: "5.0 km",
    online: true,
    photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
    bio: "Yoga instructor 🧘 | Nature lover 🌿",
    verified: true,
  },
];

const FavoritesTab = memo(function FavoritesTab() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Favorites
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
            <span>{mockFavorites.length} favorites</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        {mockFavorites.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {mockFavorites.map((profile, index) => (
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
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No favorites yet</h3>
            <p className="text-gray-500">Start exploring and add profiles to your favorites</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default FavoritesTab;
