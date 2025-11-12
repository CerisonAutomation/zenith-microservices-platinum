/**
 * Abuse Reporting & Moderation System
 *
 * Features:
 * - Report users for various violations
 * - Evidence submission (screenshots, conversation links)
 * - Automated ban durations based on severity
 * - Day bans for no-shows
 * - Appeal system
 * - Report history
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Flag,
  Shield,
  AlertTriangle,
  Ban,
  CheckCircle,
  X,
  Upload,
  FileText,
  MessageCircle,
  Camera,
  User,
  Clock,
  Info,
} from 'lucide-react';
import { DATING_APP_CONFIG } from '@/config/dating-app.config';
import type { Report, ReportReason, DatingProfile } from '@/types/dating.types';

interface ReportSystemProps {
  reportedUser: DatingProfile;
  reporterId: string;
  onSubmit: (report: Partial<Report>) => void;
  onCancel: () => void;
  context?: 'profile' | 'chat' | 'booking';
  contextId?: string; // conversationId or bookingId
}

export function ReportSystem({
  reportedUser,
  reporterId,
  onSubmit,
  onCancel,
  context = 'profile',
  contextId,
}: ReportSystemProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [step, setStep] = useState<'reason' | 'details' | 'confirm'>('reason');

  const handleSubmit = () => {
    if (!selectedReason) return;

    const report: Partial<Report> = {
      reporterId,
      reportedUserId: reportedUser.id,
      reason: selectedReason,
      description,
      evidence: {
        screenshots: screenshots.map((f) => f.name), // In real app, would upload to storage
        conversationId: context === 'chat' ? contextId : undefined,
        bookingId: context === 'booking' ? contextId : undefined,
      },
      status: 'pending',
      createdAt: new Date(),
    };

    onSubmit(report);

    // Auto-block if confirmed
    if (confirmBlock) {
      // Would trigger block action
    }
  };

  const reasonConfig = DATING_APP_CONFIG.reportReasons.find((r) => r.id === selectedReason);
  const severity = reasonConfig?.severity || 'medium';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl bg-gradient-to-br from-red-900/50 via-black to-pink-900/50 rounded-2xl border-2 border-red-500/30 overflow-hidden"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Flag className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Report User</h2>
                <p className="text-gray-400">Help us keep the community safe</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Reported User */}
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={reportedUser.photos[0]?.url} />
                  <AvatarFallback>{reportedUser.displayName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-white font-bold">{reportedUser.displayName}</h3>
                  <p className="text-gray-400 text-sm">@{reportedUser.username}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <AnimatePresence mode="wait">
            {step === 'reason' && (
              <ReasonStep
                key="reason"
                selected={selectedReason}
                onSelect={setSelectedReason}
                onNext={() => setStep('details')}
              />
            )}

            {step === 'details' && (
              <DetailsStep
                key="details"
                reason={selectedReason!}
                description={description}
                screenshots={screenshots}
                onDescriptionChange={setDescription}
                onScreenshotsChange={setScreenshots}
                onBack={() => setStep('reason')}
                onNext={() => setStep('confirm')}
              />
            )}

            {step === 'confirm' && (
              <ConfirmStep
                key="confirm"
                reason={selectedReason!}
                description={description}
                severity={severity}
                confirmBlock={confirmBlock}
                onConfirmBlockChange={setConfirmBlock}
                onBack={() => setStep('details')}
                onSubmit={handleSubmit}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// Reason Selection Step
function ReasonStep({
  selected,
  onSelect,
  onNext,
}: {
  selected: ReportReason | null;
  onSelect: (reason: ReportReason) => void;
  onNext: () => void;
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'high':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'low':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Why are you reporting this user?</h3>
        <p className="text-gray-400 text-sm">Select the reason that best describes the issue</p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {DATING_APP_CONFIG.reportReasons.map((reason) => (
          <motion.button
            key={reason.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(reason.id as ReportReason)}
            className={`
              w-full p-4 rounded-lg border-2 transition-all text-left
              ${
                selected === reason.id
                  ? 'bg-red-600/30 border-red-500'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-white mb-1">{reason.label}</h4>
                <Badge
                  className={`text-xs ${getSeverityColor(reason.severity)}`}
                >
                  {reason.severity.toUpperCase()} Severity
                </Badge>
              </div>
              {selected === reason.id && (
                <CheckCircle className="w-5 h-5 text-red-400 flex-shrink-0 ml-2" />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <Button
        onClick={onNext}
        disabled={!selected}
        className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:opacity-50"
      >
        Continue
      </Button>
    </motion.div>
  );
}

// Details Step
function DetailsStep({
  reason,
  description,
  screenshots,
  onDescriptionChange,
  onScreenshotsChange,
  onBack,
  onNext,
}: any) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onScreenshotsChange([...screenshots, ...files].slice(0, 5)); // Max 5 files
  };

  const reasonConfig = DATING_APP_CONFIG.reportReasons.find((r) => r.id === reason);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Provide Details</h3>
        <p className="text-gray-400 text-sm">
          Report reason: <span className="text-white font-semibold">{reasonConfig?.label}</span>
        </p>
      </div>

      {/* Description */}
      <div>
        <Label className="text-white mb-3 block">
          Describe what happened <span className="text-red-400">*</span>
        </Label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Please provide as much detail as possible..."
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 min-h-[120px]"
          maxLength={1000}
          required
        />
        <p className="text-xs text-gray-400 mt-1">{description.length}/1000</p>
      </div>

      {/* Evidence Upload */}
      <div>
        <Label className="text-white mb-3 block flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Upload Evidence (Optional)
        </Label>
        <div className="space-y-3">
          <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-all">
            <input
              type="file"
              id="evidence-upload"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="evidence-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-white font-semibold">Upload Screenshots</p>
              <p className="text-xs text-gray-400">PNG, JPG up to 5MB (Max 5 files)</p>
            </label>
          </div>

          {/* Uploaded Files */}
          {screenshots.length > 0 && (
            <div className="space-y-2">
              {screenshots.map((file: File, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm">{file.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                  <button
                    onClick={() =>
                      onScreenshotsChange(screenshots.filter((_: any, i: number) => i !== index))
                    }
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 border-white/20 text-white hover:bg-white/10"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={description.length < 20}
          className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:opacity-50"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}

// Confirm Step
function ConfirmStep({
  reason,
  description,
  severity,
  confirmBlock,
  onConfirmBlockChange,
  onBack,
  onSubmit,
}: any) {
  const reasonConfig = DATING_APP_CONFIG.reportReasons.find((r) => r.id === reason);

  // Get ban duration based on severity
  const getBanDuration = (sev: string) => {
    switch (sev) {
      case 'critical':
        return DATING_APP_CONFIG.banDurations.permanent;
      case 'high':
        return DATING_APP_CONFIG.banDurations.severe;
      case 'medium':
        return DATING_APP_CONFIG.banDurations.moderate;
      case 'low':
        return DATING_APP_CONFIG.banDurations.minor;
      default:
        return DATING_APP_CONFIG.banDurations.warning;
    }
  };

  const banDuration = getBanDuration(severity);
  const banText =
    banDuration === -1
      ? 'Permanent ban'
      : banDuration === 0
      ? 'Warning only'
      : `${banDuration} day${banDuration !== 1 ? 's' : ''} ban`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Confirm Report</h3>
        <p className="text-gray-400 text-sm">Review your report before submitting</p>
      </div>

      {/* Summary */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-gray-400 text-sm mb-1">Report Reason</p>
            <p className="text-white font-semibold">{reasonConfig?.label}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Severity</p>
            <Badge
              className={
                severity === 'critical'
                  ? 'bg-red-500/20 text-red-400'
                  : severity === 'high'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }
            >
              {severity.toUpperCase()}
            </Badge>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Your Description</p>
            <p className="text-white text-sm line-clamp-3">{description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Automatic Action Info */}
      <Alert className="bg-red-500/10 border-red-500/30">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-200 text-sm">
          <strong>Automated Action:</strong> If verified, this report will result in a{' '}
          <strong>{banText}</strong> for the reported user.
        </AlertDescription>
      </Alert>

      {/* Block Option */}
      <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 border border-white/10">
        <Checkbox
          id="block"
          checked={confirmBlock}
          onCheckedChange={(checked) => onConfirmBlockChange(checked as boolean)}
          className="mt-1"
        />
        <div className="flex-1">
          <Label htmlFor="block" className="text-white font-semibold cursor-pointer flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-400" />
            Also block this user
          </Label>
          <p className="text-sm text-gray-400 mt-1">
            They won't be able to see your profile or contact you
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200 text-sm">
          False reports may result in action against your account. Our moderation team will review
          all reports within 24 hours.
        </AlertDescription>
      </Alert>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 border-white/20 text-white hover:bg-white/10"
        >
          Back
        </Button>
        <Button
          onClick={onSubmit}
          className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500"
        >
          Submit Report
        </Button>
      </div>
    </motion.div>
  );
}

/**
 * Ban Notice Component
 * Shown to banned users
 */
interface BanNoticeProps {
  ban: {
    reason: string;
    duration: number; // days, -1 for permanent
    startDate: Date;
    endDate?: Date;
    appealable: boolean;
  };
  onAppeal?: () => void;
}

export function BanNotice({ ban, onAppeal }: BanNoticeProps) {
  const isPermanent = ban.duration === -1;
  const daysRemaining = ban.endDate
    ? Math.ceil((ban.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-pink-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-black/40 backdrop-blur-xl border-2 border-red-500/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <Ban className="w-10 h-10 text-red-400" />
            </div>
            <CardTitle className="text-3xl font-bold text-white">Account Suspended</CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              {isPermanent
                ? 'Your account has been permanently banned'
                : `Your account is temporarily suspended for ${ban.duration} days`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <AlertDescription className="text-red-200">
                <strong>Reason:</strong> {ban.reason}
              </AlertDescription>
            </Alert>

            {!isPermanent && (
              <div className="text-center p-6 bg-white/5 rounded-lg border border-white/10">
                <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white mb-2">{daysRemaining}</p>
                <p className="text-gray-400">Days remaining</p>
                {ban.endDate && (
                  <p className="text-sm text-gray-500 mt-2">
                    Ban expires: {ban.endDate.toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2 text-gray-300 text-sm">
              <p>
                <strong className="text-white">What happens now:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Your profile is hidden from all users</li>
                <li>You cannot message or interact with other users</li>
                <li>All pending bookings have been cancelled</li>
                {!isPermanent && <li>Access will be restored after the ban period</li>}
                {ban.appealable && <li>You may appeal this decision</li>}
              </ul>
            </div>

            {ban.appealable && onAppeal && (
              <Button
                onClick={onAppeal}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
              >
                Appeal This Ban
              </Button>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-center">
            <p className="text-sm text-gray-400">
              If you believe this is an error, please contact support
            </p>
            <a href="/support" className="text-purple-400 hover:text-purple-300 text-sm">
              Contact Support
            </a>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
