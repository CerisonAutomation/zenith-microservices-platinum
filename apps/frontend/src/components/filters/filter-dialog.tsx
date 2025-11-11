'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SlidersHorizontal } from 'lucide-react'

interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: DiscoveryFilters
  onFiltersChange: (filters: DiscoveryFilters) => void
}

export function FilterDialog({ open, onOpenChange, filters, onFiltersChange }: FilterDialogProps) {
  const [localFilters, setLocalFilters] = useState<DiscoveryFilters>(filters)

  const handleApply = () => {
    onFiltersChange(localFilters)
    onOpenChange(false)
  }

  const handleReset = () => {
    const resetFilters: DiscoveryFilters = {
      gender: [],
      ageRange: [18, 100],
      distance: 50,
      onlineOnly: false,
      verifiedOnly: false,
      meetNow: false,
      interests: []
    }
    setLocalFilters(resetFilters)
  }

  const updateFilter = <K extends keyof DiscoveryFilters>(
    key: K,
    value: DiscoveryFilters[K]
  ) => {
    setLocalFilters((prev: DiscoveryFilters) => ({ ...prev, [key]: value }))
  }

  const toggleGender = (gender: string) => {
    const currentGenders = localFilters.gender || []
    const newGenders = currentGenders.includes(gender)
      ? currentGenders.filter((g: string) => g !== gender)
      : [...currentGenders, gender]
    updateFilter('gender', newGenders)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => onOpenChange(false)}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Discovery Filters
                </h2>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Gender Filter */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                  I'm interested in
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['male', 'female', 'non-binary', 'prefer-not-to-say'].map((gender) => (
                    <button
                      key={gender}
                      onClick={() => toggleGender(gender)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        (localFilters.gender || []).includes(gender)
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                  Age Range: {localFilters.ageRange[0]} - {localFilters.ageRange[1]}
                </h3>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={localFilters.ageRange[0]}
                    onChange={(e) => updateFilter('ageRange', [parseInt(e.target.value), localFilters.ageRange[1]])}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={localFilters.ageRange[1]}
                    onChange={(e) => updateFilter('ageRange', [localFilters.ageRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Distance */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                  Maximum Distance: {localFilters.distance}km
                </h3>
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={localFilters.distance}
                  onChange={(e) => updateFilter('distance', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    Online only
                  </span>
                  <input
                    type="checkbox"
                    checked={localFilters.onlineOnly}
                    onChange={(e) => updateFilter('onlineOnly', e.target.checked)}
                    className="w-5 h-5 text-amber-600 bg-slate-100 border-slate-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    Verified profiles only
                  </span>
                  <input
                    type="checkbox"
                    checked={localFilters.verifiedOnly}
                    onChange={(e) => updateFilter('verifiedOnly', e.target.checked)}
                    className="w-5 h-5 text-amber-600 bg-slate-100 border-slate-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    Available to meet now
                  </span>
                  <input
                    type="checkbox"
                    checked={localFilters.meetNow}
                    onChange={(e) => updateFilter('meetNow', e.target.checked)}
                    className="w-5 h-5 text-amber-600 bg-slate-100 border-slate-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                  />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}