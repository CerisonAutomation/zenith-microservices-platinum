/**
 * Kinks & Preferences Selector Component
 *
 * Interactive selector for:
 * - Body types (twink, otter, bear, etc.)
 * - Position (top, bottom, versatile, etc.)
 * - Intensity style (passionate, rough, gentle, etc.)
 * - Activities (ff, bd, ds, roleplay, etc.)
 * - Safety preferences (PrEP, condoms, testing, etc.)
 * - Relationship goals
 *
 * Used in profile setup and profile editing
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Heart,
  Flame,
  Shield,
  Target,
  Info,
  Check,
  ChevronRight,
  Star,
} from 'lucide-react';
import { DATING_APP_CONFIG } from '@/config/dating-app.config';
import type {
  BodyType,
  Position,
  KinkIntensity,
  KinkActivity,
  SafetyPreference,
  RelationshipGoal,
} from '@/config/dating-app.config';

interface KinksPreferencesSelectorProps {
  onComplete: (data: ProfileKinksData) => void;
  initialData?: Partial<ProfileKinksData>;
  step?: 'body' | 'position' | 'intensity' | 'activities' | 'safety' | 'goals';
}

export interface ProfileKinksData {
  bodyTypes: BodyType[];
  lookingFor: BodyType[];
  position: Position;
  intensity: KinkIntensity[];
  activities: KinkActivity[];
  safety: SafetyPreference[];
  relationshipGoals: RelationshipGoal[];
}

export function KinksPreferencesSelector({
  onComplete,
  initialData,
  step = 'body',
}: KinksPreferencesSelectorProps) {
  const [currentStep, setCurrentStep] = useState(step);
  const [data, setData] = useState<ProfileKinksData>({
    bodyTypes: initialData?.bodyTypes || [],
    lookingFor: initialData?.lookingFor || [],
    position: initialData?.position || 'versatile',
    intensity: initialData?.intensity || [],
    activities: initialData?.activities || [],
    safety: initialData?.safety || [],
    relationshipGoals: initialData?.relationshipGoals || [],
  });

  const steps = ['body', 'position', 'intensity', 'activities', 'safety', 'goals'] as const;
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'body':
        return data.bodyTypes.length > 0;
      case 'position':
        return data.position !== undefined;
      case 'intensity':
        return data.intensity.length > 0;
      case 'activities':
        return true; // Optional
      case 'safety':
        return data.safety.length > 0;
      case 'goals':
        return data.relationshipGoals.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-pink-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <Card className="bg-black/40 backdrop-blur-xl border-2 border-purple-500/20">
          <AnimatePresence mode="wait">
            {currentStep === 'body' && (
              <BodyTypeStep
                key="body"
                selected={data.bodyTypes}
                lookingFor={data.lookingFor}
                onChange={(bodyTypes, lookingFor) => setData({ ...data, bodyTypes, lookingFor })}
              />
            )}

            {currentStep === 'position' && (
              <PositionStep
                key="position"
                selected={data.position}
                onChange={(position) => setData({ ...data, position })}
              />
            )}

            {currentStep === 'intensity' && (
              <IntensityStep
                key="intensity"
                selected={data.intensity}
                onChange={(intensity) => setData({ ...data, intensity })}
              />
            )}

            {currentStep === 'activities' && (
              <ActivitiesStep
                key="activities"
                selected={data.activities}
                onChange={(activities) => setData({ ...data, activities })}
              />
            )}

            {currentStep === 'safety' && (
              <SafetyStep
                key="safety"
                selected={data.safety}
                onChange={(safety) => setData({ ...data, safety })}
              />
            )}

            {currentStep === 'goals' && (
              <GoalsStep
                key="goals"
                selected={data.relationshipGoals}
                onChange={(relationshipGoals) => setData({ ...data, relationshipGoals })}
              />
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50"
            >
              {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Info Alert */}
        <Alert className="mt-4 bg-purple-500/10 border-purple-500/30">
          <Info className="h-4 w-4 text-purple-400" />
          <AlertDescription className="text-purple-200">
            This information helps others find you and understand your preferences. You can always
            update this later in your profile settings.
          </AlertDescription>
        </Alert>
      </motion.div>
    </div>
  );
}

// Body Type Step
function BodyTypeStep({
  selected,
  lookingFor,
  onChange,
}: {
  selected: BodyType[];
  lookingFor: BodyType[];
  onChange: (bodyTypes: BodyType[], lookingFor: BodyType[]) => void;
}) {
  const toggleBodyType = (type: BodyType) => {
    const newSelected = selected.includes(type)
      ? selected.filter((t) => t !== type)
      : [...selected, type];
    onChange(newSelected, lookingFor);
  };

  const toggleLookingFor = (type: BodyType) => {
    const newLookingFor = lookingFor.includes(type)
      ? lookingFor.filter((t) => t !== type)
      : [...lookingFor, type];
    onChange(selected, newLookingFor);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <CardHeader>
        <CardTitle className="text-2xl text-white flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-400" />
          Body Type & Preferences
        </CardTitle>
        <CardDescription className="text-gray-300">
          Select your body type and what you're looking for
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Your Body Type */}
        <div>
          <Label className="text-white font-semibold mb-3 block">Your Body Type (Select all that apply)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DATING_APP_CONFIG.bodyTypes.map((type) => (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleBodyType(type.id as BodyType)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${
                    selected.includes(type.id as BodyType)
                      ? 'bg-purple-600/30 border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-white">{type.label}</h3>
                  {selected.includes(type.id as BodyType) && (
                    <Check className="w-5 h-5 text-purple-400" />
                  )}
                </div>
                <p className="text-xs text-gray-400">{type.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Looking For */}
        <div>
          <Label className="text-white font-semibold mb-3 block">
            Looking For (Optional - leave empty for all types)
          </Label>
          <div className="flex flex-wrap gap-2">
            {DATING_APP_CONFIG.bodyTypes.map((type) => (
              <Badge
                key={type.id}
                onClick={() => toggleLookingFor(type.id as BodyType)}
                className={`
                  cursor-pointer transition-all
                  ${
                    lookingFor.includes(type.id as BodyType)
                      ? 'bg-pink-600 text-white border-pink-500'
                      : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                  }
                `}
              >
                {type.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </motion.div>
  );
}

// Position Step
function PositionStep({
  selected,
  onChange,
}: {
  selected: Position;
  onChange: (position: Position) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <CardHeader>
        <CardTitle className="text-2xl text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-400" />
          Your Position
        </CardTitle>
        <CardDescription className="text-gray-300">
          Select your preferred position
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DATING_APP_CONFIG.kinks.positions.map((pos) => (
            <motion.button
              key={pos.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(pos.id as Position)}
              className={`
                p-6 rounded-lg border-2 transition-all
                ${
                  selected === pos.id
                    ? 'bg-purple-600/30 border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }
              `}
            >
              <div className="text-center">
                <h3 className="font-bold text-white text-lg mb-2">{pos.label}</h3>
                <p className="text-sm text-gray-400">{pos.description}</p>
                {selected === pos.id && (
                  <Check className="w-6 h-6 text-purple-400 mx-auto mt-3" />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </motion.div>
  );
}

// Intensity Step
function IntensityStep({
  selected,
  onChange,
}: {
  selected: KinkIntensity[];
  onChange: (intensity: KinkIntensity[]) => void;
}) {
  const toggle = (intensity: KinkIntensity) => {
    const newSelected = selected.includes(intensity)
      ? selected.filter((i) => i !== intensity)
      : [...selected, intensity];
    onChange(newSelected);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <CardHeader>
        <CardTitle className="text-2xl text-white flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-400" />
          Your Style
        </CardTitle>
        <CardDescription className="text-gray-300">
          Select your preferred intensity and style (Select all that apply)
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DATING_APP_CONFIG.kinks.intensity.map((int) => (
            <motion.button
              key={int.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggle(int.id as KinkIntensity)}
              className={`
                p-6 rounded-lg border-2 transition-all
                ${
                  selected.includes(int.id as KinkIntensity)
                    ? 'bg-orange-600/30 border-orange-500 shadow-lg shadow-orange-500/20'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }
              `}
            >
              <div className="text-center">
                <h3 className="font-bold text-white text-lg mb-2">{int.label}</h3>
                <p className="text-sm text-gray-400">{int.description}</p>
                {selected.includes(int.id as KinkIntensity) && (
                  <Check className="w-6 h-6 text-orange-400 mx-auto mt-3" />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </motion.div>
  );
}

// Activities Step
function ActivitiesStep({
  selected,
  onChange,
}: {
  selected: KinkActivity[];
  onChange: (activities: KinkActivity[]) => void;
}) {
  const toggle = (activity: KinkActivity) => {
    const newSelected = selected.includes(activity)
      ? selected.filter((a) => a !== activity)
      : [...selected, activity];
    onChange(newSelected);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <CardHeader>
        <CardTitle className="text-2xl text-white flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-400" />
          Activities & Interests
        </CardTitle>
        <CardDescription className="text-gray-300">
          Select activities you're interested in (Optional)
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DATING_APP_CONFIG.kinks.activities.map((act) => (
            <motion.button
              key={act.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggle(act.id as KinkActivity)}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${
                  selected.includes(act.id as KinkActivity)
                    ? 'bg-amber-600/30 border-amber-500 shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }
              `}
            >
              <h3 className="font-bold text-white mb-1">{act.label}</h3>
              <p className="text-xs text-gray-400">{act.description}</p>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </motion.div>
  );
}

// Safety Step
function SafetyStep({
  selected,
  onChange,
}: {
  selected: SafetyPreference[];
  onChange: (safety: SafetyPreference[]) => void;
}) {
  const toggle = (safety: SafetyPreference) => {
    const newSelected = selected.includes(safety)
      ? selected.filter((s) => s !== safety)
      : [...selected, safety];
    onChange(newSelected);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <CardHeader>
        <CardTitle className="text-2xl text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-green-400" />
          Safety & Health
        </CardTitle>
        <CardDescription className="text-gray-300">
          Share your safety practices and health status (Select all that apply)
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Alert className="mb-6 bg-green-500/10 border-green-500/30">
          <Shield className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-200">
            Being open about your health status helps create a safer community for everyone.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DATING_APP_CONFIG.kinks.safety.map((safe) => (
            <motion.button
              key={safe.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggle(safe.id as SafetyPreference)}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${
                  selected.includes(safe.id as SafetyPreference)
                    ? 'bg-green-600/30 border-green-500 shadow-lg shadow-green-500/20'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-white">{safe.label}</h3>
                {selected.includes(safe.id as SafetyPreference) && (
                  <Check className="w-5 h-5 text-green-400" />
                )}
              </div>
              <p className="text-xs text-gray-400">{safe.description}</p>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </motion.div>
  );
}

// Goals Step
function GoalsStep({
  selected,
  onChange,
}: {
  selected: RelationshipGoal[];
  onChange: (goals: RelationshipGoal[]) => void;
}) {
  const toggle = (goal: RelationshipGoal) => {
    const newSelected = selected.includes(goal)
      ? selected.filter((g) => g !== goal)
      : [...selected, goal];
    onChange(newSelected);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <CardHeader>
        <CardTitle className="text-2xl text-white flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-400" />
          What Are You Looking For?
        </CardTitle>
        <CardDescription className="text-gray-300">
          Select your relationship goals (Select all that apply)
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DATING_APP_CONFIG.relationshipGoals.map((goal) => (
            <motion.button
              key={goal.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggle(goal.id as RelationshipGoal)}
              className={`
                p-6 rounded-lg border-2 transition-all
                ${
                  selected.includes(goal.id as RelationshipGoal)
                    ? 'bg-pink-600/30 border-pink-500 shadow-lg shadow-pink-500/20'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }
              `}
            >
              <div className="text-center">
                <h3 className="font-bold text-white text-lg mb-2">{goal.label}</h3>
                <p className="text-sm text-gray-400">{goal.description}</p>
                {selected.includes(goal.id as RelationshipGoal) && (
                  <Check className="w-6 h-6 text-pink-400 mx-auto mt-3" />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </motion.div>
  );
}

// Fix AnimatePresence import
import { AnimatePresence } from 'framer-motion';
