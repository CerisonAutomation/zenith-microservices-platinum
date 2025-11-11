'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Filter, X, Heart, MessageCircle, MapPin, Shield, Wifi, 
  ChevronDown, ChevronRight, SlidersHorizontal, Search,
  Grid, List, Star, Sparkles
} from 'lucide-react'
import { searchApi } from '@/lib/api'
import { EliteProfileCard } from '@/components/ui/elite-profile-card'

interface User {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  bio?: string
  birth_date?: string
  age?: number
  gender?: string
  location?: {
    city: string
    country: string
  }
  is_online?: boolean
  is_verified?: boolean
  meet_now_available?: boolean
  interests?: string[]
  last_seen_at?: string
}

interface DiscoveryFilters {
  gender: string[]
  ageRange: [number, number]
  distance: number
  onlineOnly: boolean
  verifiedOnly: boolean
  meetNow: boolean
  interests: string[]
}

const POPULAR_INTERESTS = [
  'Travel', 'Photography', 'Fitness', 'Music', 'Coffee',
  'Movies', 'Cooking', 'Reading', 'Gaming', 'Art',
  'Sports', 'Dancing', 'Yoga', 'Fashion', 'Technology'
]

export function EliteDiscoveryGrid() {
  const [filters, setFilters] = useState<DiscoveryFilters>({
    gender: [],
    ageRange: [18, 100],
    distance: 50,
    onlineOnly: false,
    verifiedOnly: false,
    meetNow: false,
    interests: []
  })

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [profiles, setProfiles] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    preferences: true,
    interests: false
  })

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.gender.length > 0) count++
    if (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 100) count++
    if (filters.distance !== 50) count++
    if (filters.onlineOnly) count++
    if (filters.verifiedOnly) count++
    if (filters.meetNow) count++
    if (filters.interests.length > 0) count++
    return count
  }, [filters])

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setIsLoading(true)
        const response = await searchApi.searchProfiles({
          query: searchQuery || undefined,
          ageMin: filters.ageRange[0],
          ageMax: filters.ageRange[1],
          gender: filters.gender.length > 0 ? filters.gender : undefined,
          distance: filters.distance,
          verifiedOnly: filters.verifiedOnly,
          onlineOnly: filters.onlineOnly,
          page: 1,
          limit: 50
        })
        setProfiles(response.results || [])
      } catch (error) {
        console.error('Failed to load profiles:', error)
        const mockProfiles: User[] = [...Array(20)].map((_, i) => ({
          id: `user-${i}`,
          username: `user-${i}`,
          full_name: `User ${i}`,
          avatar_url: `https://images.unsplash.com/photo-${i}?w=400`,
          bio: `I love ${i % 2 === 0 ? 'coffee' : 'travel'}`,
          birth_date: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
          age: 25 + (i % 20),
          gender: i % 2 === 0 ? 'male' : 'female',
          location: { city: 'San Francisco', country: 'USA' },
          is_online: i % 2 === 0,
          is_verified: i % 3 === 0,
          meet_now_available: i % 4 === 0,
          interests: [i % 2 === 0 ? 'photography' : 'travel', i % 3 === 0 ? 'coffee' : 'food'],
          last_seen_at: new Date().toISOString()
        }))
        setProfiles(mockProfiles)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(loadProfiles, 300)
    return () => clearTimeout(debounceTimer)
  }, [filters, searchQuery])

  const handleLike = (userId: string) => {
    console.log('Like:', userId)
  }

  const handleMessage = (userId: string) => {
    console.log('Message:', userId)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const resetFilters = () => {
    setFilters({
      gender: [],
      ageRange: [18, 100],
      distance: 50,
      onlineOnly: false,
      verifiedOnly: false,
      meetNow: false,
      interests: []
    })
  }

  const toggleGender = (gender: string) => {
    setFilters(prev => ({
      ...prev,
      gender: prev.gender.includes(gender)
        ? prev.gender.filter(g => g !== gender)
        : [...prev.gender, gender]
    }))
  }

  const toggleInterest = (interest: string) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Enhanced Side Menu */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 overflow-y-auto shadow-xl"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Discover Filters
                  </h2>
                </div>
                {activeFilterCount > 0 && (
                  <span className="px-3 py-1 bg-amber-600 text-white text-sm font-semibold rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              {/* Reset Button */}
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="w-full px-4 py-2 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors font-medium"
                >
                  Reset All Filters
                </button>
              )}

              {/* Basic Filters Section */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('basic')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-gray-900 dark:text-white">Basic Filters</span>
                  {expandedSections.basic ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {expandedSections.basic && (
                  <div className="space-y-4 pl-2">
                    {/* Gender Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Gender
                      </label>
                      <div className="flex gap-2">
                        {['male', 'female', 'other'].map(gender => (
                          <button
                            key={gender}
                            onClick={() => toggleGender(gender)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              filters.gender.includes(gender)
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                          >
                            {gender.charAt(0).toUpperCase() + gender.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Age Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Age Range: {filters.ageRange[0]} - {filters.ageRange[1]}
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="18"
                          max="100"
                          value={filters.ageRange[0]}
                          onChange={(e) => setFilters(prev => ({ ...prev, ageRange: [parseInt(e.target.value), prev.ageRange[1]] }))}
                          className="w-full accent-amber-600"
                        />
                        <input
                          type="range"
                          min="18"
                          max="100"
                          value={filters.ageRange[1]}
                          onChange={(e) => setFilters(prev => ({ ...prev, ageRange: [prev.ageRange[0], parseInt(e.target.value)] }))}
                          className="w-full accent-amber-600"
                        />
                      </div>
                    </div>

                    {/* Distance */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Distance: {filters.distance} km
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="500"
                        value={filters.distance}
                        onChange={(e) => setFilters(prev => ({ ...prev, distance: parseInt(e.target.value) }))}
                        className="w-full accent-amber-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1 km</span>
                        <span>500 km</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Preferences Section */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('preferences')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-gray-900 dark:text-white">Preferences</span>
                  {expandedSections.preferences ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {expandedSections.preferences && (
                  <div className="space-y-3 pl-2">
                    {/* Toggle Switches */}
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Online Now</span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={filters.onlineOnly}
                          onChange={(e) => setFilters(prev => ({ ...prev, onlineOnly: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Verified Only</span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={filters.verifiedOnly}
                          onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Meet Now</span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={filters.meetNow}
                          onChange={(e) => setFilters(prev => ({ ...prev, meetNow: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Interests Section */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('interests')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Interests {filters.interests.length > 0 && `(${filters.interests.length})`}
                  </span>
                  {expandedSections.interests ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {expandedSections.interests && (
                  <div className="flex flex-wrap gap-2 pl-2">
                    {POPULAR_INTERESTS.map(interest => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          filters.interests.includes(interest)
                            ? 'bg-amber-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Filter className={`w-5 h-5 ${sidebarOpen ? 'text-amber-600' : 'text-gray-600'}`} />
              </button>

              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, location, interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-1 flex gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-slate-600'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-slate-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {profiles.length} profiles
              </div>
            </div>
          </div>
        </div>

        {/* Profiles Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg h-80 animate-pulse"
                />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                No matches found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Try adjusting your filters or search criteria to discover more amazing people
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Reset Filters
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${viewMode}-${JSON.stringify(filters)}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4 max-w-4xl mx-auto"
                }
              >
                {profiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                      {/* Profile Image */}
                      <div className="relative h-64 bg-gradient-to-br from-amber-400 to-rose-500">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold">
                            {profile.full_name?.[0]?.toUpperCase()}
                          </div>
                        )}

                        {/* Status Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {profile.is_verified && (
                            <div className="bg-white/95 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                              <Shield className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          {profile.is_online && (
                            <div className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
                              Online
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Profile Info */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                              {profile.full_name}
                            </h3>
                            {profile.age && (
                              <span className="text-gray-600 dark:text-gray-400">{profile.age} years old</span>
                            )}
                          </div>
                          <Star className="w-5 h-5 text-amber-500" />
                        </div>

                        {profile.location && (
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{profile.location.city}, {profile.location.country}</span>
                          </div>
                        )}

                        {profile.bio && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                            {profile.bio}
                          </p>
                        )}

                        {profile.interests && profile.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {profile.interests.slice(0, 3).map((interest, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLike(profile.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                          >
                            <Heart className="w-4 h-4" />
                            Like
                          </button>
                          <button
                            onClick={() => handleMessage(profile.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
